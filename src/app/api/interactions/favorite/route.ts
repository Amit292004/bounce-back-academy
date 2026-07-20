import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetId, targetType } = await request.json();
    const userId = payload.userId as string;

    const modelMap: Record<string, any> = {
      'VIDEO': prisma.video,
      'NOTE': prisma.note,
      'PAPER': prisma.questionPaper,
      'QUIZ': prisma.quiz
    };

    const targetModel = modelMap[targetType];
    if (!targetModel) return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });

    // Verify target exists
    const targetExists = await targetModel.findUnique({ where: { id: targetId } });
    if (!targetExists) return NextResponse.json({ error: 'Target resource not found' }, { status: 404 });

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_targetId_targetType: { userId, targetId, targetType }
      }
    });

    const hasCountField = targetType !== 'QUIZ';

    if (existingFavorite) {
      if (hasCountField) {
        await prisma.$transaction([
          prisma.favorite.delete({ where: { id: existingFavorite.id } }),
          targetModel.update({
            where: { id: targetId },
            data: { favoritesCount: { decrement: 1 } }
          })
        ]);
      } else {
        await prisma.favorite.delete({ where: { id: existingFavorite.id } });
      }
      return NextResponse.json({ favorited: false });
    } else {
      if (hasCountField) {
        await prisma.$transaction([
          prisma.favorite.create({
            data: { userId, targetId, targetType }
          }),
          targetModel.update({
            where: { id: targetId },
            data: { favoritesCount: { increment: 1 } }
          })
        ]);
      } else {
        await prisma.favorite.create({
          data: { userId, targetId, targetType }
        });
      }
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    logger.error('Favorite error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
