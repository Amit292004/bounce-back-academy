import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] as any
  });
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const { message, priority, imageUrl, type, className } = await request.json();
  const announcement = await prisma.announcement.create({
    data: { 
      message, 
      imageUrl,
      type: type || "SECTION",
      priority: priority ?? 0,
      className: className || null
    } as any
  });
  return NextResponse.json(announcement);
}

export async function PATCH(request: Request) {
  const { id, isActive, priority, message, imageUrl, type, className } = await request.json();
  const data: Record<string, any> = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (priority !== undefined) data.priority = priority;
  if (message !== undefined) data.message = message;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (type !== undefined) data.type = type;
  if (className !== undefined) data.className = className || null;
  
  const updated = await prisma.announcement.update({ 
    where: { id }, 
    data: data as any
  });
  return NextResponse.json(updated);
}
