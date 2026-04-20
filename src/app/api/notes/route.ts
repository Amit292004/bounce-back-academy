import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');

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

    const notes = await prisma.note.findMany({
      where,
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userId) {
      const [userLikes, userFavorites] = await Promise.all([
        (prisma as any).like.findMany({ where: { userId, targetType: 'NOTE', targetId: { in: notes.map(n => n.id) } } }),
        (prisma as any).favorite.findMany({ where: { userId, targetType: 'NOTE', targetId: { in: notes.map(n => n.id) } } })
      ]);

      const likedIds = new Set(userLikes.map((l: any) => l.targetId));
      const favoritedIds = new Set(userFavorites.map((f: any) => f.targetId));

      const notesWithInteractions = notes.map(note => ({
        ...note,
        isLiked: likedIds.has(note.id),
        isFavorited: favoritedIds.has(note.id)
      }));

      return NextResponse.json(notesWithInteractions);
    }

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
