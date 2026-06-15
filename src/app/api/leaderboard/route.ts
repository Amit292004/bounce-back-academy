import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch users with counts of their likes and favorites
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        class: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            favorites: true,
          },
        },
      },
    });

    const now = new Date();

    // Map and compute XP
    const rankedUsers = users.map((user) => {
      const daysActive = Math.max(
        1,
        Math.ceil((now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      );

      // Base XP from activity days + likes + favorites
      const activityXp = daysActive * 10;
      const engagementXp = (user._count.likes * 25) + (user._count.favorites * 50);
      const totalXp = activityXp + engagementXp;

      // Streaks (simulated/persisted in future, or standard dynamic sequence based on activity days)
      const streakDays = Math.min(daysActive, (daysActive % 7) + 2);

      return {
        id: user.id,
        name: user.name,
        class: user.class,
        image: user.image,
        xp: totalXp,
        streak: streakDays,
        likesCount: user._count.likes,
        favoritesCount: user._count.favorites,
      };
    });

    // Sort by XP descending
    rankedUsers.sort((a, b) => b.xp - a.xp);

    return NextResponse.json(rankedUsers);
  } catch (error) {
    logger.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
