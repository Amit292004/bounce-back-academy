import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
// @ts-ignore
import Razorpay from 'razorpay';
import { logger } from '@/lib/logger'

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

    // 5. Dynamic Commerce Mode Check
    const hasKeys = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    if (hasKeys) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!
        });

        // Amount in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(premiumItem.price * 100);

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${premiumItem.id.slice(0, 20)}`,
          notes: {
            premiumItemId: premiumItem.id,
            userId: userId
          }
        });

        return NextResponse.json({
          mode: 'razorpay',
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          premiumItem
        });
      } catch (err: any) {
        logger.error('Failed to create Razorpay order, falling back to simulated mode:', err);
        // Fall back gracefully to simulation if order creation fails due to network/keys issues
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
