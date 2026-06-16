import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return !!(payload && payload.adminId);
}

// GET /api/admin/reviews — all reviews (pending + approved)
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(reviews);
}
