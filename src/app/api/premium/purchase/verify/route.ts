import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the student session
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Please sign in to complete purchase.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Authentication expired. Please sign in again.' }, { status: 401 });
    }

    const userId = payload.userId as string;

    // 2. Parse payload
    const {
      premiumItemId,
      cashfreeOrderId,
      simulatedConfirm
    } = await request.json();

    if (!premiumItemId) {
      return NextResponse.json({ error: 'Premium Item ID is required.' }, { status: 400 });
    }

    // Verify product exists
    const premiumItem = await prisma.premiumItem.findUnique({
      where: { id: premiumItemId }
    });

    if (!premiumItem) {
      return NextResponse.json({ error: 'Premium listing was not found.' }, { status: 404 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const hasCashfreeKeys = !!(appId && secretKey);

    // 3. Handle Simulated Confirmation Mode (local dev & unconfigured gateway fallback)
    if (simulatedConfirm) {
      if (hasCashfreeKeys && process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATED_PURCHASE !== 'true') {
        return NextResponse.json({ error: 'Simulated purchases are disabled when real payment gateway is configured.' }, { status: 403 });
      }
      const purchase = await prisma.purchase.upsert({
        where: {
          userId_premiumItemId: {
            userId,
            premiumItemId
          }
        },
        create: {
          userId,
          premiumItemId
        },
        update: {}
      });

      return NextResponse.json({
        success: true,
        message: `Successfully unlocked "${premiumItem.title}"!`,
        purchase
      });
    }

    // 4. Handle Real Cashfree Verification — fetch order status from Cashfree API
    if (!cashfreeOrderId) {
      return NextResponse.json({ error: 'Cashfree order ID is required for verification.' }, { status: 400 });
    }

    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured on the server.' }, { status: 500 });
    }

    const isProduction = (process.env.CASHFREE_ENV || 'production') === 'production';
    const cashfreeBaseUrl = isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    // Fetch order status from Cashfree
    const cfResponse = await fetch(`${cashfreeBaseUrl}/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      }
    });

    if (!cfResponse.ok) {
      const cfError = await cfResponse.json();
      logger.error('Cashfree order fetch failed:', cfError);
      return NextResponse.json({ error: 'Failed to verify payment with Cashfree.' }, { status: 400 });
    }

    const cfOrder = await cfResponse.json();

    // Check if payment is successful
    if (cfOrder.order_status !== 'PAID') {
      logger.warn('Cashfree order not PAID:', cfOrder.order_status);
      return NextResponse.json(
        { error: `Payment not completed. Status: ${cfOrder.order_status}` },
        { status: 400 }
      );
    }

    // Write verified unlock to DB
    const purchase = await prisma.purchase.upsert({
      where: {
        userId_premiumItemId: {
          userId,
          premiumItemId
        }
      },
      create: {
        userId,
        premiumItemId
      },
      update: {}
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unlocked "${premiumItem.title}"!`,
      purchase
    });
  } catch (error) {
    logger.error('Purchase verification error:', error);
    return NextResponse.json({ error: 'Failed to verify transaction.' }, { status: 500 });
  }
}
