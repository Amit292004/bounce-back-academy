import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';
import { logger } from '@/lib/logger'

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
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
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

    // 3. Handle Simulated Confirmation Mode
    if (simulatedConfirm) {
      // Record simulated unlock directly in the DB
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

    // 4. Handle Real Razorpay Cryptographic Verification Mode
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification parameters are missing.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay system is not configured on the server.' }, { status: 500 });
    }

    // Create signature hash: order_id | payment_id
    const hashText = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(hashText)
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;

    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
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
