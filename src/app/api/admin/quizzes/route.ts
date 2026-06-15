import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(quizzes);
  } catch (error) {
    logger.error('Fetch admin quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, className, subjectId } = await request.json();
    if (!title || !className) {
      return NextResponse.json({ error: 'Title and Class Name are required' }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        className,
        subjectId: subjectId || null
      },
      include: {
        subject: true
      }
    });

    return NextResponse.json(quiz);
  } catch (error) {
    logger.error('Create admin quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
