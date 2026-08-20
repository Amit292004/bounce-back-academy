import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/premium/[id]/modules/[moduleId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { moduleId } = await params;

    // Unlink content first
    await (prisma as any).premiumContent.updateMany({
      where: { moduleId },
      data: { moduleId: null }
    });

    await (prisma as any).premiumModule.delete({
      where: { id: moduleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete module error:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}

// PATCH /api/admin/premium/[id]/modules/[moduleId] — rename module
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { moduleId } = await params;
    const { title } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    const updated = await (prisma as any).premiumModule.update({
      where: { id: moduleId },
      data: { title: title.trim() }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Rename module error:', error);
    return NextResponse.json({ error: 'Failed to rename module' }, { status: 500 });
  }
}
