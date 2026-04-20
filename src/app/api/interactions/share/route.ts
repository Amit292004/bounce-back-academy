import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { targetId, targetType } = await request.json();

    const modelMap: Record<string, any> = {
      'VIDEO': prisma.video,
      'NOTE': prisma.note,
      'PAPER': prisma.questionPaper
    };

    const targetModel = modelMap[targetType];
    if (!targetModel) return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });

    await targetModel.update({
      where: { id: targetId },
      data: { sharesCount: { increment: 1 } }
    });

    return NextResponse.json({ shared: true });
  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
