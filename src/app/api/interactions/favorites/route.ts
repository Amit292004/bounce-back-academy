import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId as string;

    // Fetch favorites first to get IDs, since we removed relation fields from schema
    const favoritesData = await (prisma as any).favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const videoIds = favoritesData.filter((f: any) => f.targetType === 'VIDEO').map((f: any) => f.targetId);
    const noteIds = favoritesData.filter((f: any) => f.targetType === 'NOTE').map((f: any) => f.targetId);
    const paperIds = favoritesData.filter((f: any) => f.targetType === 'PAPER').map((f: any) => f.targetId);

    const [videos, notes, papers] = await Promise.all([
      prisma.video.findMany({
        where: { id: { in: videoIds } },
        include: { subject: true }
      }),
      prisma.note.findMany({
        where: { id: { in: noteIds } },
        include: { subject: true }
      }),
      prisma.questionPaper.findMany({
        where: { id: { in: paperIds } },
        include: { subject: true, year: true }
      })
    ]);

    // Add isLiked/isFavorited flags for UI consistency
    const [userLikes] = await Promise.all([
      (prisma as any).like.findMany({ where: { userId } })
    ]);

    const likedIds = new Set(userLikes.map((l: any) => l.targetId));
    const favoritedIds = new Set(favoritesData.map((f: any) => f.targetId));

    const mapItem = (item: any) => ({
      ...item,
      isLiked: likedIds.has(item.id),
      isFavorited: favoritedIds.has(item.id)
    });

    // Re-order based on favorite date (desc)
    const sortedVideos = videoIds.map((id: any) => videos.find((v: any) => v.id === id)).filter(Boolean).map(mapItem);
    const sortedNotes = noteIds.map((id: any) => notes.find((n: any) => n.id === id)).filter(Boolean).map(mapItem);
    const sortedPapers = paperIds.map((id: any) => papers.find((p: any) => p.id === id)).filter(Boolean).map(mapItem);

    return NextResponse.json({
      videos: sortedVideos,
      notes: sortedNotes,
      papers: sortedPapers
    });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
