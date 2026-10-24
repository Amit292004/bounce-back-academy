import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = payload.userId as string;
    const body = await request.json();
    const guestItemIds: string[] = Array.isArray(body.itemIds) ? body.itemIds : [];

    // Fetch existing purchases to exclude already owned courses
    const userPurchases = await prisma.purchase.findMany({
      where: { userId },
      select: { premiumItemId: true },
    });
    const ownedSet = new Set(userPurchases.map((p) => p.premiumItemId));

    // Filter guest IDs: must be valid active courses and not owned
    if (guestItemIds.length > 0) {
      const validCourses = await prisma.premiumItem.findMany({
        where: {
          id: { in: guestItemIds },
          isActive: true,
        },
        select: { id: true },
      });

      for (const course of validCourses) {
        if (!ownedSet.has(course.id)) {
          await prisma.cartItem.upsert({
            where: {
              userId_premiumItemId: {
                userId,
                premiumItemId: course.id,
              },
            },
            create: {
              userId,
              premiumItemId: course.id,
            },
            update: {},
          });
        }
      }
    }

    // Now fetch complete current cart for user
    const dbCartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        premiumItem: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            price: true,
            originalPrice: true,
            imageUrl: true,
            features: true,
            className: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = dbCartItems.map((ci) => ({
      ...ci.premiumItem,
      alreadyEnrolled: ownedSet.has(ci.premiumItemId),
    }));

    return NextResponse.json({
      success: true,
      items,
      count: items.filter((i) => !i.alreadyEnrolled).length,
    });
  } catch (error) {
    logger.error('Error syncing cart:', error);
    return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
  }
}
