import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // 2. Load listings with simulated purchase metrics
    const listings = await prisma.premiumItem.findMany({
      include: {
        _count: {
          select: { purchases: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(listings);
  } catch (error) {
    logger.error('Fetch admin premium listings error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    // 2. Parse request payload
    const { title, description, type, price, originalPrice, imageUrl, features, resourceId } = await request.json();

    if (!title || !description || !type || price === undefined) {
      return NextResponse.json({ error: 'Title, description, type, and price are required.' }, { status: 400 });
    }

    // Process pipe-separated features array or string
    let processedFeatures: string | null = null;
    if (Array.isArray(features)) {
      processedFeatures = features.map(f => f.trim()).filter(Boolean).join('|');
    } else if (typeof features === 'string') {
      processedFeatures = features;
    }

    // 3. Create listing
    const listing = await prisma.premiumItem.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        imageUrl: imageUrl?.trim() || null,
        features: processedFeatures,
        resourceId: resourceId?.trim() || null
      }
    });

    return NextResponse.json(listing);
  } catch (error) {
    logger.error('Create premium listing error:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
