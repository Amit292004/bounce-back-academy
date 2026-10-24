import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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

    logger.info(`Checkout Webhook received for order ${orderId}, status: ${orderStatus}`);

    if (orderStatus === 'PAID') {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (dbOrder && dbOrder.status !== 'PAID') {
        const orderUserId = dbOrder.userId || userId;

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

        logger.info(`Checkout Webhook: fulfilled order ${orderId} for user ${orderUserId}`);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Checkout webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
