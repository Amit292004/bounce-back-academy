import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('className');
  const subjectId = searchParams.get('subjectId');

  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        ...(className && { className }),
        ...(subjectId && { subjectId }),
      },
      orderBy: { number: 'asc' },
      include: { subject: true }
    });
    return NextResponse.json(chapters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, number, className, subjectId } = await request.json();
    if (!name || !className || !subjectId) {
      return NextResponse.json({ error: 'Name, className, and subjectId are required' }, { status: 400 });
    }

    const chapter = await prisma.chapter.create({
      data: { 
        name, 
        number: parseInt(number) || 0,
        className, 
        subjectId 
      }
    });
    return NextResponse.json(chapter);
  } catch (error: any) {
    logger.error('Create chapter error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create chapter' }, { status: 500 });
  }
}
