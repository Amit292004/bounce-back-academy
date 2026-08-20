import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/premium/[id]/complete — mark a lesson/content item complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = payload.userId as string;

    const { id: premiumItemId } = await params;
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    // Verify purchase
    const purchase = await prisma.purchase.findUnique({
      where: { userId_premiumItemId: { userId, premiumItemId } }
    });
    if (!purchase) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Upsert completion record
    await (prisma as any).lessonCompletion.upsert({
      where: {
        userId_contentId: { userId, contentId }
      },
      create: {
        userId,
        contentId
      },
      update: {}
    });

    return NextResponse.json({ success: true, contentId });
  } catch (error) {
    logger.error('Mark lesson complete error:', error);
    return NextResponse.json({ error: 'Failed to mark complete' }, { status: 500 });
  }
}

// DELETE /api/premium/[id]/complete — unmark a lesson/content item complete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = payload.userId as string;

    const { id: premiumItemId } = await params;
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }

    // Verify purchase
    const purchase = await prisma.purchase.findUnique({
      where: { userId_premiumItemId: { userId, premiumItemId } }
    });
    if (!purchase) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await (prisma as any).lessonCompletion.deleteMany({
      where: { userId, contentId }
    });

    return NextResponse.json({ success: true, contentId });
  } catch (error) {
    logger.error('Unmark lesson complete error:', error);
    return NextResponse.json({ error: 'Failed to unmark complete' }, { status: 500 });
  }
}
