import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/premium/[id]/notices/[noticeId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noticeId: string }> }
) {
  try {
    const { noticeId } = await params;
    await (prisma as any).premiumNotice.delete({
      where: { id: noticeId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting notice:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
