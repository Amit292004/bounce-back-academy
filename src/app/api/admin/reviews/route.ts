import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}

// GET /api/admin/reviews — all reviews (pending + approved)
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(reviews);
}
