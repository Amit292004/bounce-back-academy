import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');
  const yearId = searchParams.get('year');

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

    const papers = await prisma.questionPaper.findMany({
      where,
      include: { subject: true, year: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userId) {
      const [userLikes, userFavorites] = await Promise.all([
        (prisma as any).like.findMany({ where: { userId, targetType: 'PAPER', targetId: { in: papers.map(p => p.id) } } }),
        (prisma as any).favorite.findMany({ where: { userId, targetType: 'PAPER', targetId: { in: papers.map(p => p.id) } } })
      ]);

      const likedIds = new Set(userLikes.map((l: any) => l.targetId));
      const favoritedIds = new Set(userFavorites.map((f: any) => f.targetId));

      const papersWithInteractions = papers.map(paper => ({
        ...paper,
        isLiked: likedIds.has(paper.id),
        isFavorited: favoritedIds.has(paper.id)
      }));

      return NextResponse.json(papersWithInteractions);
    }

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Fetch papers error:', error);
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}
