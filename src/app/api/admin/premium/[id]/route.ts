import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Parse request payload
    const { title, description, type, price, originalPrice, imageUrl, features, resourceId, isActive, className } = await request.json();

    // Process pipe-separated features array or string
    let processedFeatures: string | null | undefined = undefined;
    if (Array.isArray(features)) {
      processedFeatures = features.map(f => f.trim()).filter(Boolean).join('|');
    } else if (typeof features === 'string') {
      processedFeatures = features;
    }

    // 3. Update listing
    const listing = await prisma.premiumItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(processedFeatures !== undefined && { features: processedFeatures }),
        ...(resourceId !== undefined && { resourceId: resourceId?.trim() || null }),
        ...(isActive !== undefined && { isActive: !!isActive }),
        ...(className !== undefined && { className: className?.trim() || null })
      }
    });

    return NextResponse.json(listing);
  } catch (error) {
    logger.error('Update premium listing error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Delete item
    await prisma.premiumItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Premium listing deleted successfully.' });
  } catch (error) {
    logger.error('Delete premium listing error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
