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

// PATCH /api/admin/reviews/[id] — approve or reject
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { approved } = await request.json();
  const review = await prisma.review.update({ where: { id }, data: { approved } });
  return NextResponse.json(review);
}

// DELETE /api/admin/reviews/[id] — delete a review
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
