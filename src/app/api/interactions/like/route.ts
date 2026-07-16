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

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: { userId, targetId, targetType }
      }
    });

    const hasCountField = targetType !== 'QUIZ';

    if (existingLike) {
      if (hasCountField) {
        await prisma.$transaction([
          prisma.like.delete({ where: { id: existingLike.id } }),
          targetModel.update({
            where: { id: targetId },
            data: { likesCount: { decrement: 1 } }
          })
        ]);
      } else {
        await prisma.like.delete({ where: { id: existingLike.id } });
      }
      return NextResponse.json({ liked: false });
    } else {
      if (hasCountField) {
        await prisma.$transaction([
          prisma.like.create({
            data: { userId, targetId, targetType }
          }),
          targetModel.update({
            where: { id: targetId },
            data: { likesCount: { increment: 1 } }
          })
        ]);
      } else {
        await prisma.like.create({
          data: { userId, targetId, targetType }
        });
      }
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    logger.error('Like error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
