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
  verifyOrderAmountMatch,
  sanitizeOrderId,
} from '@/lib/paymentSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection (Max 20 verify requests/minute per IP)
    const rateLimitResponse = await checkRateLimit(request, 20, 60);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authenticate student session
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

    // 3. Parse and sanitize payload
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request format' }, { status: 400 });
    }

    const { orderId, cashfreeOrderId, simulatedConfirm } = body;
    const rawTargetId = orderId || cashfreeOrderId;
    const targetOrderId = sanitizeOrderId(rawTargetId);

    if (!targetOrderId) {
      return NextResponse.json({ error: 'Valid Order ID is required for verification.' }, { status: 400 });
    }

    // 4. Find order in DB
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
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    // 5. Strict Authorization: Ensure order belongs to authenticated user
    if (order.userId !== userId) {
      logger.warn(`Unauthorized verification attempt on order ${targetOrderId} by user ${userId}`);
      return NextResponse.json({ error: 'Unauthorized order access.' }, { status: 403 });
    }

    // 6. Idempotent check: If order is already PAID or FREE, return success immediately
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

    // 7. Security Enforcement on Simulated Confirmation
    if (simulatedConfirm) {
      if (!isSimulationAllowed()) {
        logger.error(`Blocked unauthorized simulated verification attempt on order ${targetOrderId} in production`);
        return NextResponse.json(
          { error: 'Simulated payments are strictly disabled in production environment.' },
          { status: 403 }
        );
      }
      // Allowed simulated confirmation proceeds to fulfillment (local dev only)
    } else {
      // 8. Authoritative Cashfree Gateway Verification
      if (!isCashfreeConfigured()) {
        return NextResponse.json(
          { error: 'Payment gateway configuration is missing on server.' },
          { status: 500 }
        );
      }

      const cashfreeBaseUrl = getCashfreeBaseUrl();
      const appId = process.env.CASHFREE_APP_ID!.trim();
      const secretKey = process.env.CASHFREE_SECRET_KEY!.trim();

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
        return NextResponse.json({ error: 'Failed to verify transaction with payment gateway.' }, { status: 400 });
      }

      const cfOrder = await cfResponse.json();

      // Check A: Order status must be PAID
      if (cfOrder.order_status !== 'PAID') {
        logger.warn('Order is not in PAID status:', cfOrder.order_status);
        return NextResponse.json(
          { error: `Payment not completed. Status: ${cfOrder.order_status}` },
          { status: 400 }
        );
      }

      // Check B: Currency must be INR
      if (cfOrder.order_currency !== 'INR') {
        logger.error('Order currency mismatch:', cfOrder.order_currency);
        return NextResponse.json({ error: 'Invalid order currency' }, { status: 400 });
      }

      // Check C: Paid amount must strictly match order totalAmount (Cent-level check)
      const cfAmount = Number(cfOrder.order_amount);
      if (!verifyOrderAmountMatch(order.totalAmount, cfAmount)) {
        logger.error(`Amount mismatch for order ${order.id}. Expected ${order.totalAmount}, got ${cfAmount}`);
        return NextResponse.json({ error: 'Paid amount does not match order amount' }, { status: 400 });
      }

      // Check D: Customer ID on gateway order must match the student user ID
      const cfCustomerId = cfOrder.customer_details?.customer_id;
      if (cfCustomerId && cfCustomerId !== userId) {
        logger.error(`Customer mismatch: Gateway customer ${cfCustomerId} !== user ${userId}`);
        return NextResponse.json({ error: 'Customer identifier mismatch' }, { status: 403 });
      }
    }

    // 9. Atomic Fulfillment in Database Transaction
    await prisma.$transaction(async (tx) => {
      // Update order status to PAID
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

    logger.info(`Successfully verified and fulfilled order ${order.id} for user ${userId}`);

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
