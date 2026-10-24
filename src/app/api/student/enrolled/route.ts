import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, enrolledIds: [] });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ authenticated: false, enrolledIds: [] });
    }

    const userId = payload.userId as string;

    const purchases = await prisma.purchase.findMany({
      where: { userId },
      select: { premiumItemId: true, createdAt: true },
    });

    return NextResponse.json({
      authenticated: true,
      userId,
      enrolledIds: purchases.map((p) => p.premiumItemId),
      purchases,
    });
  } catch (error) {
    logger.error('Error fetching enrolled items:', error);
    return NextResponse.json({ authenticated: false, enrolledIds: [], error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}
