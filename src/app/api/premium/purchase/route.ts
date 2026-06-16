import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // 1. Authenticate student session
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

    // 2. Parse request payload
    const { premiumItemId } = await request.json();
    if (!premiumItemId) {
      return NextResponse.json({ error: 'Premium Item ID is required.' }, { status: 400 });
    }

    // 3. Verify item exists
    const premiumItem = await prisma.premiumItem.findUnique({
      where: { id: premiumItemId }
    });

    if (!premiumItem) {
      return NextResponse.json({ error: 'The requested item was not found.' }, { status: 404 });
    }

    // 4. Verify if already purchased
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

    // 5. Fetch user details for Cashfree customer_details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, mobile: true }
    });

    // 6. Dynamic Commerce Mode Check — use Cashfree if keys are set
    const hasCashfreeKeys = !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

    if (hasCashfreeKeys) {
      try {
        const isProduction = (process.env.CASHFREE_ENV || 'production') === 'production';
        const cashfreeBaseUrl = isProduction
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg';

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bounce-back-academy-en1o.vercel.app';
        const returnUrl = `${appUrl}/payment/return?order_id={order_id}&premiumItemId=${premiumItemId}`;

        // Unique order ID — use timestamp + item id slice for uniqueness
        const orderId = `bba_${Date.now()}_${premiumItemId.slice(0, 8)}`;

        const orderPayload = {
          order_id: orderId,
          order_amount: premiumItem.price,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_name: user?.name || 'Student',
            customer_email: user?.email || 'student@bouncebackacademy.com',
            customer_phone: user?.mobile || '9999999999'
          },
          order_meta: {
            return_url: returnUrl,
            notify_url: `${appUrl}/api/premium/purchase/webhook`
          },
          order_note: premiumItem.title
        };

        const cfResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': process.env.CASHFREE_APP_ID!,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
            'x-api-version': '2023-08-01'
          },
          body: JSON.stringify(orderPayload)
        });

        if (!cfResponse.ok) {
          const cfError = await cfResponse.json();
          logger.error('Cashfree order creation failed:', cfError);
          // Fall through to simulated mode
        } else {
          const cfData = await cfResponse.json();

          return NextResponse.json({
            mode: 'cashfree',
            paymentSessionId: cfData.payment_session_id,
            orderId: cfData.order_id,
            amount: premiumItem.price,
            currency: 'INR',
            environment: isProduction ? 'production' : 'sandbox',
            premiumItem
          });
        }
      } catch (err) {
        logger.error('Failed to create Cashfree order, falling back to simulated mode:', err);
        // Fall back gracefully to simulation
      }
    }

    // Default Fallback: Simulated Sandbox Mode
    return NextResponse.json({
      mode: 'simulated',
      premiumItem
    });
  } catch (error) {
    logger.error('Purchase initiation error:', error);
    return NextResponse.json({ error: 'Failed to process checkout request.' }, { status: 500 });
  }
}
