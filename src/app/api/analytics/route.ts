import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [userCount, paperCount, noteCount, videoCount] = await Promise.all([
      prisma.user.count({ where: { emailVerified: true } }),
      (prisma as any).questionPaper.count(),
      (prisma as any).note.count(),
      (prisma as any).video.count(),
    ]);

    // Real "Active Now" count based on heartbeats in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeNow = await (prisma as any).activeSession.count({
      where: {
        lastSeen: {
          gte: fiveMinutesAgo
        }
      }
    });

    return NextResponse.json({
      users: userCount,
      papers: paperCount,
      notes: noteCount,
      videos: videoCount,
      activeNow: Math.max(1, activeNow)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
