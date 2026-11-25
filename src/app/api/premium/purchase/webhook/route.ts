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
    const userId = order.customer_details?.customer_id;
    const orderAmount = Number(order.order_amount);

    const premiumItemId =
      order.order_tags?.premiumItemId ||
      data.order_tags?.premiumItemId ||
      body.premiumItemId;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order ID in webhook' }, { status: 400 });
    }

    logger.info(`Authenticated Cashfree Webhook received for order ${orderId}, status: ${orderStatus}, premiumItemId: ${premiumItemId}`);

    if (orderStatus === 'PAID' && userId && premiumItemId) {
      // Re-verify that premium item exists and price matches
      const premiumItem = await prisma.premiumItem.findUnique({
        where: { id: premiumItemId },
      });

      if (premiumItem) {
        if (!isNaN(orderAmount) && !verifyOrderAmountMatch(premiumItem.price, orderAmount)) {
          logger.error(`Amount mismatch in single item webhook for item ${premiumItemId}: item price ${premiumItem.price}, gateway sent ${orderAmount}`);
          return NextResponse.json({ error: 'Order amount mismatch' }, { status: 400 });
        }

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

        logger.info(`Successfully fulfilled single course purchase via webhook for user ${userId}, item ${premiumItemId}`);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Cashfree single purchase webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
