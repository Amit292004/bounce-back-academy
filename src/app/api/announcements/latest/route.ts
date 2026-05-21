import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latest = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    return NextResponse.json({ latestCreatedAt: latest?.createdAt || null });
  } catch {
    // DB unreachable — treat as no announcements, not a server error
    return NextResponse.json({ latestCreatedAt: null });
  }
}
