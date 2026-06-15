import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

// GET /api/admin/premium/[id]/content — list content items for a premium package
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const contents = await (prisma as any).premiumContent.findMany({
      where: { premiumItemId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json(contents);
  } catch (error) {
    logger.error('Fetch premium content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// POST /api/admin/premium/[id]/content — add a content item to a premium package
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify premium item exists
    const premiumItem = await (prisma as any).premiumItem.findUnique({ where: { id } });
    if (!premiumItem) return NextResponse.json({ error: 'Premium package not found' }, { status: 404 });

    const { contentType, title, description, viewUrl, downloadUrl, youtubeLink, sortOrder } =
      await request.json();

    if (!contentType || !title) {
      return NextResponse.json({ error: 'Content type and title are required' }, { status: 400 });
    }

    const content = await (prisma as any).premiumContent.create({
      data: {
        premiumItemId: id,
        contentType,
        title: title.trim(),
        description: description?.trim() || null,
        viewUrl: viewUrl?.trim() || null,
        downloadUrl: downloadUrl?.trim() || null,
        youtubeLink: youtubeLink?.trim() || null,
        sortOrder: parseInt(sortOrder) || 0
      }
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    logger.error('Add premium content error:', error);
    return NextResponse.json({ error: 'Failed to add content' }, { status: 500 });
  }
}
