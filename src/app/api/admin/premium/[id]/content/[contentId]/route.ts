import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

// DELETE /api/admin/premium/[id]/content/[contentId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { contentId } = await params;

    await (prisma as any).premiumContent.delete({ where: { id: contentId } });
    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (error) {
    logger.error('Delete premium content error:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
