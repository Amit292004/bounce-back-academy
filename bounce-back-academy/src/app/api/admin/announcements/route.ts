import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }});
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const { message } = await request.json();
  const announcement = await prisma.announcement.create({ data: { message }});
  return NextResponse.json(announcement);
}
