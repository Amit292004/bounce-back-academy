import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');
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
    if (chapterId) where.chapterId = chapterId;

    const notes = await prisma.note.findMany({
      where,
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userId) {
      const [userLikes, userFavorites] = await Promise.all([
        prisma.like.findMany({ where: { userId, targetType: 'NOTE', targetId: { in: notes.map((n: any) => n.id) } } }),
        prisma.favorite.findMany({ where: { userId, targetType: 'NOTE', targetId: { in: notes.map((n: any) => n.id) } } })
      ]);

      const likedIds = new Set(userLikes.map((l: any) => l.targetId));
      const favoritedIds = new Set(userFavorites.map((f: any) => f.targetId));

      const notesWithInteractions = notes.map((note: any) => ({
        ...note,
        isLiked: likedIds.has(note.id),
        isFavorited: favoritedIds.has(note.id)
      }));

      return NextResponse.json(notesWithInteractions);
    }

    return NextResponse.json(notes);
  } catch (error) {
    logger.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
