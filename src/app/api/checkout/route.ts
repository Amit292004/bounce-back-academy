import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  isCashfreeConfigured,
  getCashfreeBaseUrl,
  isSimulationAllowed,
  isProductionEnvironment,
  generateSecureOrderId,
  validateCustomerDetails,
} from '@/lib/paymentSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection (Max 15 checkout creation requests/minute per IP)
    const rateLimitResponse = await checkRateLimit(request, 15, 60);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authenticate student session
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

    // 3. Parse and sanitize request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request format' }, { status: 400 });
    }

    const { itemIds, couponCode, customerDetails } = body;

    // Strict validation of itemIds array
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    const cleanItemIds = Array.from(
      new Set(itemIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
    );

    if (cleanItemIds.length === 0) {
      return NextResponse.json({ error: 'Invalid course selections in cart' }, { status: 400 });
    }

    // Customer details validation
    const customerValidation = validateCustomerDetails(customerDetails);
    if (!customerValidation.valid) {
      return NextResponse.json({ error: customerValidation.error }, { status: 400 });
    }

    // 4. Fetch courses from database (authoritative prices server-side)
    const dbCourses = await prisma.premiumItem.findMany({
      where: {
        id: { in: cleanItemIds },
        isActive: true,
      },
    });

    if (dbCourses.length === 0) {
      return NextResponse.json(
        { error: 'Selected courses are no longer available for purchase' },
        { status: 404 }
      );
    }

    // 5. Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, mobile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // 6. Check existing enrollments to prevent duplicate purchases
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

    // 7. Calculate subtotal strictly using trusted database prices
    const subtotal = coursesToBuy.reduce((sum, item) => sum + item.price, 0);

    // 8. Validate coupon code server-side against DB rules
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

    // Generate cryptographically unguessable order ID
    const orderId = generateSecureOrderId('bba_ord');

    const customerName = (customerDetails?.name || user.name || 'Student').trim().slice(0, 100);
    const customerEmail = (customerDetails?.email || user.email).trim().toLowerCase();
    const rawMobile = customerDetails?.mobile || user.mobile || '9999999999';
    const customerPhone = rawMobile.replace(/[^\d]/g, '').slice(-10) || '9999999999';

    // 9. Handle Free Checkout (finalAmount === 0, e.g. 100% coupon or ₹0 courses)
    if (finalAmount === 0) {
      await prisma.$transaction(async (tx) => {
        // Create Order record with FREE status
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

        // Grant enrollment for all items in order
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

    // 10. Handle Paid Checkout
    const hasCashfree = isCashfreeConfigured();
    const isProduction = isProductionEnvironment();

    // Create PENDING Order in Database before gateway handoff
    await prisma.order.create({
      data: {
        id: orderId,
        userId,
        subtotal,
        discountAmount,
        totalAmount: finalAmount,
        couponCode: validatedCouponCode,
        status: 'PENDING',
        paymentGateway: hasCashfree ? 'cashfree' : 'simulated',
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

    if (hasCashfree) {
      try {
        const cashfreeBaseUrl = getCashfreeBaseUrl();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://bouncebackacademy.vercel.app';
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
            'x-client-id': process.env.CASHFREE_APP_ID!.trim(),
            'x-client-secret': process.env.CASHFREE_SECRET_KEY!.trim(),
            'x-api-version': '2023-08-01',
          },
          body: JSON.stringify(orderPayload),
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();

          // Link gateway order ID and session ID to DB order
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
            environment: (process.env.CASHFREE_ENV || 'production').toLowerCase() === 'production' ? 'production' : 'sandbox',
            courses: coursesToBuy.map((c) => ({ id: c.id, title: c.title, price: c.price })),
          });
        } else {
          const cfError = await cfResponse.json();
          logger.error('Cashfree order creation error:', cfError);
          return NextResponse.json(
            { error: 'Payment gateway rejected order creation. Please verify details or try again.' },
            { status: 502 }
          );
        }
      } catch (err) {
        logger.error('Cashfree communication failure:', err);
        return NextResponse.json(
          { error: 'Unable to reach payment gateway. Please check your internet connection and try again.' },
          { status: 503 }
        );
      }
    }

    // 11. Gateway Not Configured Safeguards
    if (!isSimulationAllowed()) {
      // In production without keys, NEVER allow bypass!
      return NextResponse.json(
        {
          error: 'Online payments are currently undergoing scheduled maintenance. Please contact academy support for enrollment.',
          maintenance: true,
        },
        { status: 503 }
      );
    }

    // Local development fallback only
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
