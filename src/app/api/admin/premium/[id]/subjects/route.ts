import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/admin/premium/[id]/subjects — list all subjects for a premium course
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
    const subjects = await (prisma as any).premiumSubject.findMany({
      where: { premiumItemId: id },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            contents: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    return NextResponse.json(subjects);
  } catch (error) {
    logger.error('Fetch subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

// POST /api/admin/premium/[id]/subjects — create a new subject
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
    const { name, order } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const existingCount = await (prisma as any).premiumSubject.count({
      where: { premiumItemId: id }
    });

    const newSubject = await (prisma as any).premiumSubject.create({
      data: {
        premiumItemId: id,
        name: name.trim(),
        order: order !== undefined ? parseInt(order) : existingCount
      }
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    logger.error('Create subject error:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
