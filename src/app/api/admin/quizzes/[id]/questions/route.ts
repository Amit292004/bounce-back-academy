import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const { questionText, imageUrl, type, options, answer, explanation, timeLimit } = await request.json();

    if (!answer) {
      return NextResponse.json({ error: 'Correct answer is required' }, { status: 400 });
    }

    // Process options array to pipe-separated string
    let optionsStr: string | null = null;
    if (type === 'MCQ' && Array.isArray(options)) {
      optionsStr = options.map(opt => opt.trim()).join('|');
    }

    // Parse custom time limit
    const parsedTimeLimit = timeLimit ? parseInt(timeLimit) : 30;

    const question = await prisma.quizQuestion.create({
      data: {
        quizId,
        questionText: questionText || null,
        imageUrl: imageUrl || null,
        type: type || 'TEXT',
        options: optionsStr,
        answer: answer.trim(),
        explanation: explanation || null,
        timeLimit: isNaN(parsedTimeLimit) ? 30 : parsedTimeLimit
      }
    });

    return NextResponse.json(question);
  } catch (error) {
    logger.error('Create quiz question error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
