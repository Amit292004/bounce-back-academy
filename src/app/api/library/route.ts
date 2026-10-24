import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'all'; // 'all' | 'notes' | 'papers' | 'videos' | 'quizzes'
  const className = searchParams.get('class')?.trim() || '';
  const subjectId = searchParams.get('subject')?.trim() || '';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    let userId: string | null = null;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) userId = payload.userId as string;
    }

    // Class name candidate resolution
    let classFilter: any = undefined;
    if (className && className !== 'all') {
      const numOnly = className.replace(/^Class\s+/i, '');
      const classPrefixed = className.toLowerCase().startsWith('class') ? className : `Class ${className}`;
      const candidates = Array.from(new Set([className, numOnly, classPrefixed]));
      classFilter = { in: candidates, mode: 'insensitive' };
    }

    // Build query conditions
    const buildWhere = (categoryField = 'className') => {
      const condition: any = {};
      if (classFilter) {
        condition[categoryField] = classFilter;
      }
      if (subjectId && subjectId !== 'all') {
        condition.subjectId = subjectId;
      }
      if (q) {
        condition.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { subject: { name: { contains: q, mode: 'insensitive' } } },
        ];
      }
      return condition;
    };

    const fetchNotes = type === 'all' || type === 'notes'
      ? prisma.note.findMany({
          where: buildWhere('className'),
          include: { subject: true, chapter: true },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]);

    const fetchPapers = type === 'all' || type === 'papers'
      ? prisma.questionPaper.findMany({
          where: buildWhere('className'),
          include: { subject: true, year: true, chapter: true },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]);

    const fetchVideos = type === 'all' || type === 'videos'
      ? prisma.video.findMany({
          where: buildWhere('category'),
          include: { subject: true, chapter: true },
          orderBy: { lectureNumber: 'asc' },
          take: 30,
        })
      : Promise.resolve([]);

    const fetchQuizzes = type === 'all' || type === 'quizzes'
      ? prisma.quiz.findMany({
          where: buildWhere('className'),
          include: { subject: true, chapter: true, questions: { select: { id: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]);

    const [notes, papers, videos, quizzes] = await Promise.all([
      fetchNotes,
      fetchPapers,
      fetchVideos,
      fetchQuizzes,
    ]);

    // Check user interaction states if authenticated
    let userFavorites = new Set<string>();
    if (userId) {
      const favs = await prisma.favorite.findMany({
        where: { userId },
        select: { targetId: true },
      });
      userFavorites = new Set(favs.map((f) => f.targetId));
    }

    const normalizedNotes = notes.map((n: any) => ({
      id: n.id,
      title: n.title,
      type: 'NOTE' as const,
      className: n.className,
      subject: n.subject?.name || 'General',
      chapter: n.chapter?.name,
      viewUrl: n.viewUrl,
      downloadUrl: n.downloadFile,
      likesCount: n.likesCount,
      sharesCount: n.sharesCount,
      favoritesCount: n.favoritesCount,
      isFavorited: userFavorites.has(n.id),
      createdAt: n.createdAt,
    }));

    const normalizedPapers = papers.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: 'PAPER' as const,
      className: p.className,
      subject: p.subject?.name || 'General',
      year: p.year?.year,
      chapter: p.chapter?.name,
      viewUrl: p.viewUrl,
      downloadUrl: p.downloadFile,
      likesCount: p.likesCount,
      sharesCount: p.sharesCount,
      favoritesCount: p.favoritesCount,
      isFavorited: userFavorites.has(p.id),
      createdAt: p.createdAt,
    }));

    const normalizedVideos = videos.map((v: any) => ({
      id: v.id,
      title: v.title,
      type: 'VIDEO' as const,
      className: v.category,
      subject: v.subject?.name || 'General',
      youtubeLink: v.youtubeLink,
      pdfUrl: v.pdfUrl,
      lectureNumber: v.lectureNumber,
      chapter: v.chapter?.name,
      likesCount: v.likesCount,
      sharesCount: v.sharesCount,
      favoritesCount: v.favoritesCount,
      isFavorited: userFavorites.has(v.id),
      createdAt: v.createdAt,
    }));

    const normalizedQuizzes = quizzes.map((q: any) => ({
      id: q.id,
      title: q.title,
      type: 'QUIZ' as const,
      className: q.className,
      subject: q.subject?.name || 'General',
      questionCount: q.questions?.length || 0,
      chapter: q.chapter?.name,
      createdAt: q.createdAt,
    }));

    return NextResponse.json({
      query: q,
      totalCount:
        normalizedNotes.length +
        normalizedPapers.length +
        normalizedVideos.length +
        normalizedQuizzes.length,
      notes: normalizedNotes,
      papers: normalizedPapers,
      videos: normalizedVideos,
      quizzes: normalizedQuizzes,
    });
  } catch (error) {
    logger.error('Universal study library query error:', error);
    return NextResponse.json({ error: 'Failed to search study library' }, { status: 500 });
  }
}
