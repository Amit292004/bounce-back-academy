import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] as any
  });
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const { message, priority } = await request.json();
  const announcement = await prisma.announcement.create({
    data: { message, priority: priority ?? 0 } as any
  });
  return NextResponse.json(announcement);
}

export async function PATCH(request: Request) {
  const { id, isActive, priority } = await request.json();
  const data: Record<string, unknown> = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (priority !== undefined) data.priority = priority;
  const updated = await prisma.announcement.update({ where: { id }, data });
  return NextResponse.json(updated);
}
