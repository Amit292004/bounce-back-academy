import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate student
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Please sign in to proceed with checkout', requireLogin: true },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Your session has expired. Please sign in again.', requireLogin: true },
        { status: 401 }
      );
    }

    const userId = payload.userId as string;

    // 2. Parse request
    const body = await request.json();
    const { itemIds, couponCode, customerDetails } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    // 3. Fetch courses from database (re-validate prices server-side)
    const dbCourses = await prisma.premiumItem.findMany({
      where: {
        id: { in: itemIds },
        isActive: true,
      },
    });

    if (dbCourses.length === 0) {
      return NextResponse.json(
        { error: 'Selected courses are no longer available for purchase' },
        { status: 404 }
      );
    }

    // 4. Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, mobile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // 5. Check if user already owns any of these courses
    const existingPurchases = await prisma.purchase.findMany({
      where: {
        userId,
        premiumItemId: { in: dbCourses.map((c) => c.id) },
      },
      select: { premiumItemId: true },
    });

    const ownedIdSet = new Set(existingPurchases.map((p) => p.premiumItemId));
    const coursesToBuy = dbCourses.filter((c) => !ownedIdSet.has(c.id));

    if (coursesToBuy.length === 0) {
      return NextResponse.json(
        {
          error: 'You are already enrolled in all selected courses!',
          allEnrolled: true,
        },
        { status: 400 }
      );
    }

    // 6. Calculate subtotal strictly using trusted database prices
    const subtotal = coursesToBuy.reduce((sum, item) => sum + item.price, 0);

    // 7. Validate coupon if provided
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;

    if (couponCode && typeof couponCode === 'string') {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCoupon },
      });

      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const meetsMin = !coupon.minSubtotal || subtotal >= coupon.minSubtotal;

        if (notExpired && meetsMin) {
          validatedCouponCode = coupon.code;
          if (coupon.discountType === 'PERCENT') {
            discountAmount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.value, subtotal);
          }
        }
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // Generate unique order ID
    const orderId = `bba_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const customerName = customerDetails?.name || user.name || 'Student';
    const customerEmail = customerDetails?.email || user.email;
    const customerPhone = customerDetails?.mobile || user.mobile || '9999999999';

    // 8. Handle Free Checkout (finalAmount === 0)
    if (finalAmount === 0) {
      await prisma.$transaction(async (tx) => {
        // Create Order record
        await tx.order.create({
          data: {
            id: orderId,
            userId,
            subtotal,
            discountAmount,
            totalAmount: 0,
            couponCode: validatedCouponCode,
            status: 'FREE',
            paymentGateway: 'free',
            customerName,
            customerEmail,
            customerPhone,
            items: {
              create: coursesToBuy.map((c) => ({
                premiumItemId: c.id,
                price: c.price,
                originalPrice: c.originalPrice,
                title: c.title,
              })),
            },
          },
        });

        // Immediately grant enrollment for every course in order
        for (const course of coursesToBuy) {
          await tx.purchase.upsert({
            where: {
              userId_premiumItemId: {
                userId,
                premiumItemId: course.id,
              },
            },
            create: {
              userId,
              premiumItemId: course.id,
            },
            update: {},
          });
        }

        // Remove purchased items from cart
        await tx.cartItem.deleteMany({
          where: {
            userId,
            premiumItemId: { in: coursesToBuy.map((c) => c.id) },
          },
        });
      });

      return NextResponse.json({
        mode: 'free',
        success: true,
        orderId,
        message: 'Enrollment successful! You have free lifetime access.',
        courses: coursesToBuy.map((c) => ({ id: c.id, title: c.title })),
      });
    }

    // 9. Handle Paid Checkout
    const hasCashfreeKeys = !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
    const isProduction = (process.env.CASHFREE_ENV || 'production') === 'production';

    // Create PENDING Order in Database first
    await prisma.order.create({
      data: {
        id: orderId,
        userId,
        subtotal,
        discountAmount,
        totalAmount: finalAmount,
        couponCode: validatedCouponCode,
        status: 'PENDING',
        paymentGateway: hasCashfreeKeys ? 'cashfree' : 'simulated',
        customerName,
        customerEmail,
        customerPhone,
        items: {
          create: coursesToBuy.map((c) => ({
            premiumItemId: c.id,
            price: c.price,
            originalPrice: c.originalPrice,
            title: c.title,
          })),
        },
      },
    });

    if (hasCashfreeKeys) {
      try {
        const cashfreeBaseUrl = isProduction
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg';

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bouncebackacademy.vercel.app';
        const returnUrl = `${appUrl}/payment/return?order_id={order_id}&mode=cart`;

        const orderPayload = {
          order_id: orderId,
          order_amount: finalAmount,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
          },
          order_meta: {
            return_url: returnUrl,
            notify_url: `${appUrl}/api/checkout/webhook`,
          },
          order_note: `Enrollment in ${coursesToBuy.length} Course${coursesToBuy.length > 1 ? 's' : ''}`,
          order_tags: {
            orderId,
            userId,
            itemCount: String(coursesToBuy.length),
          },
        };

        const cfResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': process.env.CASHFREE_APP_ID!,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
            'x-api-version': '2023-08-01',
          },
          body: JSON.stringify(orderPayload),
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();

          // Update order with payment session id
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentSessionId: cfData.payment_session_id,
              gatewayOrderId: cfData.order_id,
            },
          });

          return NextResponse.json({
            mode: 'cashfree',
            orderId: cfData.order_id,
            paymentSessionId: cfData.payment_session_id,
            amount: finalAmount,
            currency: 'INR',
            environment: isProduction ? 'production' : 'sandbox',
            courses: coursesToBuy.map((c) => ({ id: c.id, title: c.title, price: c.price })),
          });
        } else {
          const cfError = await cfResponse.json();
          logger.error('Cashfree order creation error:', cfError);
          // If Cashfree PG returns an error in production, propagate error
          if (isProduction && process.env.ALLOW_SIMULATED_PURCHASE !== 'true') {
            return NextResponse.json(
              { error: 'Payment gateway error. Please try again shortly.' },
              { status: 502 }
            );
          }
        }
      } catch (err) {
        logger.error('Cashfree communication failure:', err);
      }
    }

    // Default Fallback: Simulated Mode (for dev environment or test simulation)
    return NextResponse.json({
      mode: 'simulated',
      orderId,
      amount: finalAmount,
      currency: 'INR',
      courses: coursesToBuy.map((c) => ({ id: c.id, title: c.title, price: c.price })),
    });
  } catch (error) {
    logger.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to process checkout request' }, { status: 500 });
  }
}
