import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

// GET /api/premium/[id] — Get a premium package detail + its content if purchased
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch the premium item with its content
    const premiumItem = await (prisma as any).premiumItem.findUnique({
      where: { id },
      include: {
        contents: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        }
      }
    });

    if (!premiumItem) {
      return NextResponse.json({ error: 'Premium package not found' }, { status: 404 });
    }

    // 2. Check if the student is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    let isUnlocked = false;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        const userId = payload.userId as string;
        const purchase = await prisma.purchase.findUnique({
          where: {
            userId_premiumItemId: { userId, premiumItemId: id }
          }
        });
        isUnlocked = !!purchase;
      }
    }

    return NextResponse.json({
      ...premiumItem,
      // Only expose content details if unlocked; otherwise just titles
      contents: isUnlocked
        ? premiumItem.contents
        : premiumItem.contents.map((c: any) => ({
            id: c.id,
            title: c.title,
            contentType: c.contentType,
            description: c.description,
            sortOrder: c.sortOrder
            // viewUrl, downloadUrl, youtubeLink are hidden unless unlocked
          })),
      isUnlocked
    });
  } catch (error) {
    logger.error('Fetch premium item detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch package details' }, { status: 500 });
  }
}
