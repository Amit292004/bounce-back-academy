import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
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
    if (category) where.category = category;
    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;

    const videos = await (prisma as any).video.findMany({
      where,
      include: { subject: true, chapter: true },
      orderBy: [
        { lectureNumber: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    if (userId) {
      const [userLikes, userFavorites] = await Promise.all([
        (prisma as any).like.findMany({ where: { userId, targetType: 'VIDEO', targetId: { in: videos.map((v: any) => v.id) } } }),
        (prisma as any).favorite.findMany({ where: { userId, targetType: 'VIDEO', targetId: { in: videos.map((v: any) => v.id) } } })
      ]);

      const likedIds = new Set(userLikes.map((l: any) => l.targetId));
      const favoritedIds = new Set(userFavorites.map((f: any) => f.targetId));

      const videosWithInteractions = videos.map((video: any) => ({
        ...video,
        isLiked: likedIds.has(video.id),
        isFavorited: favoritedIds.has(video.id)
      }));

      return NextResponse.json(videosWithInteractions);
    }

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Fetch videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
