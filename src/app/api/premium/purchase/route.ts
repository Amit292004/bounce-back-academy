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
  sanitizeOrderId,
} from '@/lib/paymentSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection (Max 15 requests/minute per IP)
    const rateLimitResponse = await checkRateLimit(request, 15, 60);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authenticate student session
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Please sign in to make a purchase.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Authentication expired. Please sign in again.' }, { status: 401 });
    }

    const userId = payload.userId as string;

    // 3. Parse and sanitize request payload
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request format' }, { status: 400 });
    }

    const { premiumItemId } = body;
    if (!premiumItemId || typeof premiumItemId !== 'string') {
      return NextResponse.json({ error: 'Premium Item ID is required.' }, { status: 400 });
    }

    // 4. Verify item exists and is active
    const premiumItem = await prisma.premiumItem.findUnique({
      where: { id: premiumItemId }
    });

    if (!premiumItem || !premiumItem.isActive) {
      return NextResponse.json({ error: 'The requested course is no longer available.' }, { status: 404 });
    }

    // 5. Verify if already purchased
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_premiumItemId: {
          userId,
          premiumItemId
        }
      }
    });

    if (existingPurchase) {
      return NextResponse.json({ success: true, alreadyUnlocked: true, message: 'You have already unlocked this item!' });
    }

    // 6. Free Item Checkout
    if (premiumItem.price === 0) {
      await prisma.purchase.upsert({
        where: {
          userId_premiumItemId: {
            userId,
            premiumItemId,
          },
        },
        create: {
          userId,
          premiumItemId,
        },
        update: {},
      });

      return NextResponse.json({
        mode: 'free',
        success: true,
        alreadyUnlocked: true,
        message: `Successfully enrolled in "${premiumItem.title}"!`,
        premiumItem,
      });
    }

    // 7. Fetch user details for Cashfree customer_details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, mobile: true }
    });

    const hasCashfreeKeys = isCashfreeConfigured();
    const isProduction = isProductionEnvironment();
    const orderId = generateSecureOrderId('bba_sngl');

    if (hasCashfreeKeys) {
      try {
        const cashfreeBaseUrl = getCashfreeBaseUrl();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://bouncebackacademy.vercel.app';
        const returnUrl = `${appUrl}/payment/return?order_id={order_id}&premiumItemId=${premiumItemId}`;

        const customerPhone = (user?.mobile || '9999999999').replace(/[^\d]/g, '').slice(-10) || '9999999999';

        const orderPayload = {
          order_id: orderId,
          order_amount: premiumItem.price,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_name: (user?.name || 'Student').trim().slice(0, 100),
            customer_email: (user?.email || 'student@bouncebackacademy.com').trim().toLowerCase(),
            customer_phone: customerPhone,
          },
          order_meta: {
            return_url: returnUrl,
            notify_url: `${appUrl}/api/premium/purchase/webhook`
          },
          order_note: premiumItem.title.slice(0, 100),
          order_tags: {
            premiumItemId,
            userId
          }
        };

        const cfResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': process.env.CASHFREE_APP_ID!.trim(),
            'x-client-secret': process.env.CASHFREE_SECRET_KEY!.trim(),
            'x-api-version': '2023-08-01'
          },
          body: JSON.stringify(orderPayload)
        });

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();

          return NextResponse.json({
            mode: 'cashfree',
            paymentSessionId: cfData.payment_session_id,
            orderId: cfData.order_id,
            amount: premiumItem.price,
            currency: 'INR',
            environment: (process.env.CASHFREE_ENV || 'production').toLowerCase() === 'production' ? 'production' : 'sandbox',
            premiumItem
          });
        } else {
          const cfError = await cfResponse.json();
          logger.error('Cashfree order creation failed:', cfError);
          return NextResponse.json(
            { error: 'Payment gateway rejected order creation. Please try again.' },
            { status: 502 }
          );
        }
      } catch (err) {
        logger.error('Failed to communicate with Cashfree:', err);
        return NextResponse.json(
          { error: 'Payment service temporarily unreachable. Please try again shortly.' },
          { status: 503 }
        );
      }
    }

    // 8. Gateway Not Configured Safeguards
    if (!isSimulationAllowed()) {
      return NextResponse.json(
        {
          error: 'Online payments are currently undergoing scheduled maintenance. Please contact academy support.',
          maintenance: true,
        },
        { status: 503 }
      );
    }

    // Default Fallback: Simulated Sandbox Mode (Allowed only in local dev)
    return NextResponse.json({
      mode: 'simulated',
      orderId,
      amount: premiumItem.price,
      premiumItem
    });
  } catch (error) {
    logger.error('Purchase initiation error:', error);
    return NextResponse.json({ error: 'Failed to process checkout request.' }, { status: 500 });
  }
}
