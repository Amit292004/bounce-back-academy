import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/admin/premium/[id]/notices — Fetch notices for a premium item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notices = await (prisma as any).premiumNotice.findMany({
      where: { premiumItemId: id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(notices);
  } catch (error) {
    logger.error('Error fetching notices:', error);
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

// POST /api/admin/premium/[id]/notices — Create a notice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, tag } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 });
    }

    const notice = await (prisma as any).premiumNotice.create({
      data: {
        premiumItemId: id,
        title: title.trim(),
        content: content.trim(),
        tag: tag || 'ANNOUNCEMENT'
      }
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    logger.error('Error creating notice:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}
