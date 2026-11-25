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

    // 2. Authenticate the student session
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

    // 3. Parse and sanitize payload
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request format' }, { status: 400 });
    }

    const { premiumItemId, cashfreeOrderId, simulatedConfirm } = body;

    if (!premiumItemId || typeof premiumItemId !== 'string') {
      return NextResponse.json({ error: 'Premium Item ID is required.' }, { status: 400 });
    }

    // Verify product exists
    const premiumItem = await prisma.premiumItem.findUnique({
      where: { id: premiumItemId }
    });

    if (!premiumItem) {
      return NextResponse.json({ error: 'Premium listing was not found.' }, { status: 404 });
    }

    // Idempotent Check: If user already owns it, return success immediately
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_premiumItemId: {
          userId,
          premiumItemId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: `You already have access to "${premiumItem.title}"!`,
        purchase: existingPurchase,
      });
    }

    // 4. Handle Simulated Confirmation Mode (strictly restricted to local dev)
    if (simulatedConfirm) {
      if (!isSimulationAllowed()) {
        logger.error(`Blocked unauthorized single-item simulated verification attempt for item ${premiumItemId} in production`);
        return NextResponse.json(
          { error: 'Simulated purchases are strictly disabled in production environment.' },
          { status: 403 }
        );
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

    // 5. Authoritative Cashfree Verification — fetch order status from Cashfree API
    const targetOrderId = sanitizeOrderId(cashfreeOrderId);
    if (!targetOrderId) {
      return NextResponse.json({ error: 'Valid Cashfree order ID is required for verification.' }, { status: 400 });
    }

    if (!isCashfreeConfigured()) {
      return NextResponse.json({ error: 'Payment gateway is not configured on the server.' }, { status: 500 });
    }

    const cashfreeBaseUrl = getCashfreeBaseUrl();
    const appId = process.env.CASHFREE_APP_ID!.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY!.trim();

    // Fetch order status directly from Cashfree
    const cfResponse = await fetch(`${cashfreeBaseUrl}/orders/${targetOrderId}`, {
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
      return NextResponse.json({ error: 'Failed to verify payment with payment gateway.' }, { status: 400 });
    }

    const cfOrder = await cfResponse.json();

    // Verification Check A: Order status
    if (cfOrder.order_status !== 'PAID') {
      logger.warn('Cashfree order not PAID:', cfOrder.order_status);
      return NextResponse.json(
        { error: `Payment not completed. Status: ${cfOrder.order_status}` },
        { status: 400 }
      );
    }

    // Verification Check B: Currency
    if (cfOrder.order_currency !== 'INR') {
      return NextResponse.json({ error: 'Invalid transaction currency' }, { status: 400 });
    }

    // Verification Check C: Amount matching item price
    const cfAmount = Number(cfOrder.order_amount);
    if (!verifyOrderAmountMatch(premiumItem.price, cfAmount)) {
      logger.error(`Amount mismatch: Item ${premiumItem.id} price is ${premiumItem.price}, gateway order amount was ${cfAmount}`);
      return NextResponse.json({ error: 'Paid amount does not match course price' }, { status: 400 });
    }

    // Verification Check D: Customer ID matching authenticated user
    const cfCustomerId = cfOrder.customer_details?.customer_id;
    if (cfCustomerId && cfCustomerId !== userId) {
      logger.error(`Customer mismatch: Gateway customer ${cfCustomerId} !== user ${userId}`);
      return NextResponse.json({ error: 'Customer identifier mismatch' }, { status: 403 });
    }

    // Verification Check E: Cross-item reuse prevention via order_tags
    const taggedItemId = cfOrder.order_tags?.premiumItemId;
    if (taggedItemId && taggedItemId !== premiumItemId) {
      logger.error(`Order tag mismatch: Order ${targetOrderId} was generated for item ${taggedItemId}, but verification attempted for ${premiumItemId}`);
      return NextResponse.json({ error: 'Transaction was authorized for a different item' }, { status: 403 });
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

    logger.info(`Successfully verified and unlocked course ${premiumItem.id} for user ${userId}`);

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
