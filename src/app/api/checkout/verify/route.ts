import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate student session
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Please sign in to verify order.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Authentication expired.' }, { status: 401 });
    }

    const userId = payload.userId as string;

    // 2. Parse payload
    const { orderId, cashfreeOrderId, simulatedConfirm } = await request.json();
    const targetOrderId = orderId || cashfreeOrderId;

    if (!targetOrderId) {
      return NextResponse.json({ error: 'Order ID is required for verification.' }, { status: 400 });
    }

    // 3. Find order in DB
    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      include: {
        items: {
          include: {
            premiumItem: {
              select: { id: true, title: true, type: true, className: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Ensure order belongs to authenticated user
    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized order access.' }, { status: 403 });
    }

    // Idempotent check: If order is already PAID or FREE, return success immediately
    if (order.status === 'PAID' || order.status === 'FREE') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'Order access is already verified and active!',
        orderId: order.id,
        items: order.items.map((i) => ({
          id: i.premiumItemId,
          title: i.title,
          type: i.premiumItem.type,
        })),
      });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const hasCashfreeKeys = !!(appId && secretKey);
    const isProduction = (process.env.CASHFREE_ENV || 'production') === 'production';

    // 4. Verification Check
    if (simulatedConfirm) {
      if (hasCashfreeKeys && isProduction && process.env.ALLOW_SIMULATED_PURCHASE !== 'true') {
        return NextResponse.json(
          { error: 'Simulated payments are disabled in production environment.' },
          { status: 403 }
        );
      }
      // Allowed simulated confirmation proceeds to fulfillment
    } else {
      // Real Cashfree Gateway Verification
      if (!appId || !secretKey) {
        return NextResponse.json({ error: 'Payment gateway configuration missing.' }, { status: 500 });
      }

      const cashfreeBaseUrl = isProduction
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';

      const cfResponse = await fetch(`${cashfreeBaseUrl}/orders/${targetOrderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      if (!cfResponse.ok) {
        const cfError = await cfResponse.json();
        logger.error('Cashfree order fetch failed:', cfError);
        return NextResponse.json({ error: 'Failed to verify transaction with Cashfree.' }, { status: 400 });
      }

      const cfOrder = await cfResponse.json();

      if (cfOrder.order_status !== 'PAID') {
        logger.warn('Order is not in PAID status:', cfOrder.order_status);
        return NextResponse.json(
          { error: `Payment not completed. Status: ${cfOrder.order_status}` },
          { status: 400 }
        );
      }
    }

    // 5. Atomic Fulfillment in Database Transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Grant course entitlement for all items in order
      for (const item of order.items) {
        await tx.purchase.upsert({
          where: {
            userId_premiumItemId: {
              userId,
              premiumItemId: item.premiumItemId,
            },
          },
          create: {
            userId,
            premiumItemId: item.premiumItemId,
          },
          update: {},
        });
      }

      // Remove purchased items from Cart
      await tx.cartItem.deleteMany({
        where: {
          userId,
          premiumItemId: { in: order.items.map((i) => i.premiumItemId) },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! All courses have been added to your account.',
      orderId: order.id,
      items: order.items.map((i) => ({
        id: i.premiumItemId,
        title: i.title,
        type: i.premiumItem.type,
      })),
    });
  } catch (error) {
    logger.error('Checkout verification error:', error);
    return NextResponse.json({ error: 'Transaction verification failed.' }, { status: 500 });
  }
}
