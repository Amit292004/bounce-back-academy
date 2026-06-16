import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/reviews — submit a new review
export async function POST(request: Request) {
  try {
    const { name, className, quote, score } = await request.json();

    if (!name || !className || !quote) {
      return NextResponse.json({ error: 'Name, class and review are required.' }, { status: 400 });
    }
    if (name.length > 100) return NextResponse.json({ error: 'Name too long.' }, { status: 400 });
    if (quote.length > 1000) return NextResponse.json({ error: 'Review too long (max 1000 chars).' }, { status: 400 });

    const review = await prisma.review.create({
      data: { name, className, quote, score: score || null, approved: false },
    });

    return NextResponse.json({ success: true, id: review.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}

// GET /api/reviews — fetch approved reviews for homepage
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      ...(limit === 'all' ? {} : { take: Number(limit) || 9 }),
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews.' }, { status: 500 });
  }
}
