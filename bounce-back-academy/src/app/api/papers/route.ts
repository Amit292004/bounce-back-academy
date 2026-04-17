import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');
  const yearId = searchParams.get('year');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (className) where.className = className;
  if (subjectId) where.subjectId = subjectId;
  if (yearId) where.yearId = yearId;

  try {
    const papers = await prisma.questionPaper.findMany({
      where,
      include: { subject: true, year: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(papers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}
