import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');
  const yearId = searchParams.get('year');
  const chapterId = searchParams.get('chapter');

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    let userId: string | null = null;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) userId = payload.userId as string;
    }

    const where: any = {};
    if (className) where.className = className;
    if (subjectId) where.subjectId = subjectId;
    if (yearId) where.yearId = yearId;
    if (chapterId) where.chapterId = chapterId;

    const mode = searchParams.get('mode'); // 'year-wise' or 'chapter-wise'
    // Bug Fix #6: Only apply the mode filter when no explicit chapterId was provided,
    // otherwise the mode unconditionally overrides the specific chapter filter.
    if (!chapterId) {
      if (mode === 'year-wise') {
        where.chapterId = null;
      } else if (mode === 'chapter-wise') {
        where.chapterId = { not: null };
      }
    }

    const papers = await prisma.questionPaper.findMany({
      where,
      include: { subject: true, year: true, chapter: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userId) {
      const [userLikes, userFavorites] = await Promise.all([
        prisma.like.findMany({ where: { userId, targetType: 'PAPER', targetId: { in: papers.map((p: any) => p.id) } } }),
        prisma.favorite.findMany({ where: { userId, targetType: 'PAPER', targetId: { in: papers.map((p: any) => p.id) } } })
      ]);

      const likedIds = new Set(userLikes.map((l: any) => l.targetId));
      const favoritedIds = new Set(userFavorites.map((f: any) => f.targetId));

      const papersWithInteractions = papers.map((paper: any) => ({
        ...paper,
        isLiked: likedIds.has(paper.id),
        isFavorited: favoritedIds.has(paper.id)
      }));

      return NextResponse.json(papersWithInteractions);
    }

    return NextResponse.json(papers);
  } catch (error) {
    logger.error('Fetch papers error:', error);
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}
