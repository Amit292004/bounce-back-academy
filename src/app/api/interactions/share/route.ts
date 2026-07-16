import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { targetId, targetType } = await request.json();

    const modelMap: Record<string, any> = {
      'VIDEO': prisma.video,
      'NOTE': prisma.note,
      'PAPER': prisma.questionPaper,
      'QUIZ': prisma.quiz
    };

    const targetModel = modelMap[targetType];
    if (!targetModel) return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });

    if (targetType !== 'QUIZ') {
      await targetModel.update({
        where: { id: targetId },
        data: { sharesCount: { increment: 1 } }
      });
    }

    return NextResponse.json({ shared: true });
  } catch (error) {
    logger.error('Share error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
