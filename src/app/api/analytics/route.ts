import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [userCount, paperCount, noteCount, videoCount] = await Promise.all([
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.questionPaper.count(),
      prisma.note.count(),
      prisma.video.count(),
    ]);

    // Real "Active Now" count based on heartbeats in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeNow = await prisma.activeSession.count({
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
      // Fix #15: Return real count — don't fake a minimum of 1
      activeNow,
    });
  } catch (error) {
    logger.error('[analytics] DB error:', error);
    // Return zeroed fallback so the client never gets a network-level failure
    return NextResponse.json({
      users: 0,
      papers: 0,
      notes: 0,
      videos: 0,
      activeNow: 0
    });
  }
}
