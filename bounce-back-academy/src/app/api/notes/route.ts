import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (className) where.className = className;
  if (subjectId) where.subjectId = subjectId;

  try {
    const notes = await prisma.note.findMany({
      where,
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
