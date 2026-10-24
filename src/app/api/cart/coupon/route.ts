import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderSubtotal = Number(subtotal) || 0;

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
    }

    if (coupon.minSubtotal && orderSubtotal < coupon.minSubtotal) {
      return NextResponse.json(
        { error: `This coupon requires a minimum subtotal of ₹${coupon.minSubtotal}` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // FLAT discount
      discountAmount = Math.min(coupon.value, orderSubtotal);
    }

    // Round to 2 decimals
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, Math.round((orderSubtotal - discountAmount) * 100) / 100);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discountAmount,
        finalAmount,
        message:
          coupon.discountType === 'PERCENT'
            ? `${coupon.value}% discount applied (-₹${discountAmount})`
            : `₹${discountAmount} flat discount applied`,
      },
    });
  } catch (error) {
    logger.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}
