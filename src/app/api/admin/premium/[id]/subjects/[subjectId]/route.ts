import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/premium/[id]/subjects/[subjectId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subjectId } = await params;

    // Unlink modules first
    await (prisma as any).premiumModule.updateMany({
      where: { subjectId },
      data: { subjectId: null }
    });

    await (prisma as any).premiumSubject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete subject error:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}

// PATCH /api/admin/premium/[id]/subjects/[subjectId] — rename subject
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subjectId } = await params;
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const updated = await (prisma as any).premiumSubject.update({
      where: { id: subjectId },
      data: { name: name.trim() }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Rename subject error:', error);
    return NextResponse.json({ error: 'Failed to rename subject' }, { status: 500 });
  }
}
