import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body.data;

    if (!data || !data.order) {
      return NextResponse.json({ status: 'ignored', message: 'No order data in webhook payload' });
    }

    const order = data.order;
    const orderStatus = order.order_status;
    const orderId = order.order_id;
    const userId = order.customer_details?.customer_id;
    const premiumItemId = order.order_tags?.premiumItemId || body.premiumItemId;

    logger.info(`Cashfree Webhook received for order ${orderId}, status: ${orderStatus}`);

    if (orderStatus === 'PAID' && userId && premiumItemId) {
      await prisma.purchase.upsert({
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
      logger.info(`Successfully created purchase via webhook for user ${userId}, item ${premiumItemId}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Cashfree webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
