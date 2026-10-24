import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return (payload?.userId as string) || null;
  } catch {
    return null;
  }
}

// GET /api/cart
// Validates items against DB, fetches real prices, filters out inactive or already-purchased courses
export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const rawGuestIds = searchParams.get('itemIds');

    let courseIds: string[] = [];

    // 1. If user is authenticated, query user's CartItems from DB
    let userCartDbIds: string[] = [];
    if (userId) {
      const dbCartItems = await prisma.cartItem.findMany({
        where: { userId },
        select: { premiumItemId: true },
        orderBy: { createdAt: 'desc' },
      });
      userCartDbIds = dbCartItems.map((c) => c.premiumItemId);
      courseIds = [...userCartDbIds];
    }

    // 2. If guest IDs are supplied (or merging during hydration), include them
    if (rawGuestIds) {
      const guestIds = rawGuestIds.split(',').map((id) => id.trim()).filter(Boolean);
      for (const gid of guestIds) {
        if (!courseIds.includes(gid)) {
          courseIds.push(gid);
        }
      }
    }

    if (courseIds.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        originalSubtotal: 0,
        totalSavings: 0,
        itemCount: 0,
        authenticated: !!userId,
      });
    }

    // 3. Fetch canonical courses from DB
    const courses = await prisma.premiumItem.findMany({
      where: {
        id: { in: courseIds },
        isActive: true,
      },
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
    });

    // 4. Fetch user's existing purchases to detect already enrolled items
    let enrolledIdSet = new Set<string>();
    if (userId) {
      const userPurchases = await prisma.purchase.findMany({
        where: { userId },
        select: { premiumItemId: true },
      });
      enrolledIdSet = new Set(userPurchases.map((p) => p.premiumItemId));
    }

    // 5. Build validated items array
    const validItems = courses.map((c) => ({
      ...c,
      alreadyEnrolled: enrolledIdSet.has(c.id),
      savings: c.originalPrice && c.originalPrice > c.price ? c.originalPrice - c.price : 0,
    }));

    // Calculate totals based exclusively on server prices
    const subtotal = validItems.reduce((sum, item) => sum + (item.alreadyEnrolled ? 0 : item.price), 0);
    const originalSubtotal = validItems.reduce(
      (sum, item) => sum + (item.alreadyEnrolled ? 0 : (item.originalPrice || item.price)),
      0
    );
    const totalSavings = Math.max(0, originalSubtotal - subtotal);

    return NextResponse.json({
      items: validItems,
      subtotal,
      originalSubtotal,
      totalSavings,
      itemCount: validItems.filter((i) => !i.alreadyEnrolled).length,
      authenticated: !!userId,
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
  }
}

// POST /api/cart
// Adds an item to authenticated user's cart in DB
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Verify course exists and is active
    const course = await prisma.premiumItem.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, isActive: true },
    });

    if (!course || !course.isActive) {
      return NextResponse.json({ error: 'Course is not available for purchase' }, { status: 404 });
    }

    // If user is authenticated, check purchase status & save to DB
    if (userId) {
      const alreadyPurchased = await prisma.purchase.findUnique({
        where: {
          userId_premiumItemId: {
            userId,
            premiumItemId: courseId,
          },
        },
      });

      if (alreadyPurchased) {
        return NextResponse.json(
          { error: 'You already own this course!', alreadyEnrolled: true },
          { status: 400 }
        );
      }

      await prisma.cartItem.upsert({
        where: {
          userId_premiumItemId: {
            userId,
            premiumItemId: courseId,
          },
        },
        create: {
          userId,
          premiumItemId: courseId,
        },
        update: {},
      });
    }

    return NextResponse.json({
      success: true,
      message: `"${course.title}" added to cart`,
      item: course,
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}

// DELETE /api/cart
// Removes course from user's DB cart or clears it
export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('itemId');
    const clearAll = searchParams.get('clear') === 'true';

    if (userId) {
      if (clearAll) {
        await prisma.cartItem.deleteMany({ where: { userId } });
      } else if (courseId) {
        await prisma.cartItem.deleteMany({
          where: { userId, premiumItemId: courseId },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Cart updated successfully' });
  } catch (error) {
    logger.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}
