import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const papers = await prisma.questionPaper.findMany({
      include: { subject: true, year: true, chapter: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(papers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, className, subjectId, yearId, phase, viewUrl, downloadFile, chapterId } = data;

    if (!title || !className || !subjectId || !viewUrl || !downloadFile) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    const paper = await prisma.questionPaper.create({
      data: {
        title,
        className,
        subjectId,
        yearId: yearId || null,
        phase: phase || null,
        viewUrl,
        downloadFile,
        chapterId: chapterId || null
      }
    });
    return NextResponse.json(paper);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create paper' }, { status: 500 });
  }
}
