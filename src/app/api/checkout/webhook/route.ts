import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  verifyCashfreeWebhookSignature,
  verifyOrderAmountMatch,
  sanitizeOrderId,
} from '@/lib/paymentSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Read Raw Body as string for cryptographic signature calculation
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty webhook payload' }, { status: 400 });
    }

    // 2. Extract Cashfree Webhook Security Headers
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

    // 3. Cryptographic Signature & Timestamp Replay Verification
    if (secretKey) {
      if (!signature || !timestamp) {
        logger.warn('Rejected webhook: Missing x-webhook-signature or x-webhook-timestamp headers');
        return NextResponse.json(
          { error: 'Missing webhook signature headers' },
          { status: 401 }
        );
      }

      const isValidSignature = verifyCashfreeWebhookSignature({
        rawBody,
        signature,
        timestamp,
        secretKey,
      });

      if (!isValidSignature) {
        logger.error('CRITICAL: Cashfree webhook signature verification failed or timestamp expired! Possible tampering/spoofing.');
        return NextResponse.json(
          { error: 'Invalid webhook signature or expired payload' },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: CASHFREE_SECRET_KEY not set in production. Webhooks cannot be safely processed.');
      return NextResponse.json(
        { error: 'Payment gateway secret key not configured' },
        { status: 500 }
      );
    }

    // 4. Parse JSON payload safely
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const data = body.data;
    if (!data || !data.order) {
      return NextResponse.json({ status: 'ignored', message: 'No order data in webhook payload' });
    }

    const order = data.order;
    const orderStatus = order.order_status;
    const rawOrderId = order.order_id;
    const orderId = sanitizeOrderId(rawOrderId);
    const orderAmount = Number(order.order_amount);
    const customerId = order.customer_details?.customer_id;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order ID in webhook' }, { status: 400 });
    }

    logger.info(`Authenticated Cashfree Webhook received for order ${orderId}, status: ${orderStatus}`);

    // 5. Only fulfill if status is PAID
    if (orderStatus === 'PAID') {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!dbOrder) {
        logger.warn(`Webhook received for non-existent order: ${orderId}`);
        return NextResponse.json({ status: 'not_found', message: 'Order not found in database' }, { status: 404 });
      }

      // Idempotency: skip if already fulfilled
      if (dbOrder.status === 'PAID' || dbOrder.status === 'FREE') {
        logger.info(`Webhook idempotency: order ${orderId} is already marked as ${dbOrder.status}`);
        return NextResponse.json({ status: 'already_fulfilled' });
      }

      // Security Check: Verify order amount match (prevent amount tampering)
      if (!isNaN(orderAmount) && !verifyOrderAmountMatch(dbOrder.totalAmount, orderAmount)) {
        logger.error(`CRITICAL: Webhook amount mismatch for order ${orderId}. DB expects ${dbOrder.totalAmount}, gateway sent ${orderAmount}`);
        return NextResponse.json({ error: 'Order amount mismatch' }, { status: 400 });
      }

      // Security Check: Customer verification
      if (customerId && dbOrder.userId && customerId !== dbOrder.userId) {
        logger.error(`CRITICAL: Webhook customer mismatch for order ${orderId}. DB user ${dbOrder.userId}, gateway sent ${customerId}`);
        return NextResponse.json({ error: 'Customer identifier mismatch' }, { status: 403 });
      }

      const orderUserId = dbOrder.userId;

      // 6. Atomic Fulfillment in Database Transaction
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });

        for (const item of dbOrder.items) {
          await tx.purchase.upsert({
            where: {
              userId_premiumItemId: {
                userId: orderUserId,
                premiumItemId: item.premiumItemId,
              },
            },
            create: {
              userId: orderUserId,
              premiumItemId: item.premiumItemId,
            },
            update: {},
          });
        }

        await tx.cartItem.deleteMany({
          where: {
            userId: orderUserId,
            premiumItemId: { in: dbOrder.items.map((i) => i.premiumItemId) },
          },
        });
      });

      logger.info(`Checkout Webhook successfully fulfilled order ${orderId} for user ${orderUserId}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Checkout webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
