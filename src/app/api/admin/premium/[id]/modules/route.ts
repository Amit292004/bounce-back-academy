import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/admin/premium/[id]/modules — list all modules for a premium item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const modules = await (prisma as any).premiumModule.findMany({
      where: { premiumItemId: id },
      orderBy: { order: 'asc' },
      include: {
        contents: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json(modules);
  } catch (error) {
    logger.error('Fetch modules error:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}

// POST /api/admin/premium/[id]/modules — create a new module
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { title, order, subjectId } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 });
    }

    const existingCount = await (prisma as any).premiumModule.count({
      where: { premiumItemId: id }
    });

    const newModule = await (prisma as any).premiumModule.create({
      data: {
        premiumItemId: id,
        subjectId: subjectId || null,
        title: title.trim(),
        order: order !== undefined ? parseInt(order) : existingCount
      }
    });

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    logger.error('Create module error:', error);
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
  }
}

// PATCH /api/admin/premium/[id]/modules — reorder modules
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { modules } = await request.json();
    if (!Array.isArray(modules)) {
      return NextResponse.json({ error: 'modules array required' }, { status: 400 });
    }

    await Promise.all(
      modules.map((m: { id: string; order: number }) =>
        (prisma as any).premiumModule.update({
          where: { id: m.id },
          data: { order: m.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Reorder modules error:', error);
    return NextResponse.json({ error: 'Failed to reorder modules' }, { status: 500 });
  }
}
