import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class');
  const subjectId = searchParams.get('subject');

  const cookieStore = await cookies();
  const token = cookieStore.get('student_token')?.value;
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) isAuthenticated = true;
  }

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

    if (!isAuthenticated) {
      const publicNotes = notes.map(note => ({ ...note, downloadFile: '' }));
      return NextResponse.json(publicNotes);
    }

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
