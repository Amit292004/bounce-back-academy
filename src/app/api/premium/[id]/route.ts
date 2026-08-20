import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/premium/[id] — High-performance package detail fetch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parallel fetch for lightning speed
    const [premiumItem, subjects, modules, contents, notices] = await Promise.all([
      prisma.premiumItem.findUnique({
        where: { id }
      }),
      (prisma as any).premiumSubject.findMany({
        where: { premiumItemId: id },
        orderBy: { order: 'asc' }
      }),
      (prisma as any).premiumModule.findMany({
        where: { premiumItemId: id },
        orderBy: { order: 'asc' }
      }),
      (prisma as any).premiumContent.findMany({
        where: { premiumItemId: id },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      (prisma as any).premiumNotice.findMany({
        where: { premiumItemId: id },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!premiumItem) {
      return NextResponse.json({ error: 'Premium package not found' }, { status: 404 });
    }

    // Check student authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    let isUnlocked = false;
    let completedContentIds: string[] = [];

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        const userId = payload.userId as string;
        const purchase = await prisma.purchase.findUnique({
          where: {
            userId_premiumItemId: { userId, premiumItemId: id }
          }
        });
        isUnlocked = !!purchase;

        if (isUnlocked && contents.length > 0) {
          const completions = await (prisma as any).lessonCompletion.findMany({
            where: {
              userId,
              contentId: { in: contents.map((c: any) => c.id) }
            },
            select: { contentId: true }
          });
          completedContentIds = completions.map((c: any) => c.contentId);
        }
      }
    }

    // Sanitize content if locked
    const sanitizedContents = contents.map((c: any) => {
      if (isUnlocked) return c;
      return {
        id: c.id,
        title: c.title,
        contentType: c.contentType,
        description: c.description,
        sortOrder: c.sortOrder,
        moduleId: c.moduleId
      };
    });

    return NextResponse.json({
      ...premiumItem,
      subjects: subjects || [],
      modules: modules || [],
      contents: sanitizedContents,
      notices: notices || [],
      completedContentIds,
      isUnlocked
    });
  } catch (error) {
    logger.error('Fetch premium item detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch package details' }, { status: 500 });
  }
}
