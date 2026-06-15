import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch all active premium store items
    const premiumItems = await prisma.premiumItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Identify if student is authenticated to check purchase status
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    let userId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        userId = payload.userId as string;
      }
    }

    // 3. If student is authenticated, fetch their unlocked item IDs
    let purchasedItemIds: Set<string> = new Set();
    if (userId) {
      const userPurchases = await prisma.purchase.findMany({
        where: { userId },
        select: { premiumItemId: true }
      });
      purchasedItemIds = new Set(userPurchases.map(p => p.premiumItemId));
    }

    // 4. Map premium items with the 'unlocked' flag
    const formattedItems = premiumItems.map(item => ({
      ...item,
      unlocked: purchasedItemIds.has(item.id)
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    logger.error('Fetch premium items error:', error);
    return NextResponse.json({ error: 'Failed to fetch premium items' }, { status: 500 });
  }
}
