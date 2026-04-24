import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, className, subjectId, viewUrl, downloadFile, chapterId } = await request.json();
    if (!title || !className || !subjectId) {
      return NextResponse.json({ error: 'Title, class, and subject are required' }, { status: 400 });
    }
    const note = await prisma.note.create({
      data: { 
        title, 
        className, 
        subjectId, 
        viewUrl: viewUrl || '', 
        downloadFile: downloadFile || '',
        chapterId: chapterId || null
      }
    });
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
