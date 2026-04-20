import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const videos = await (prisma.video as any).findMany({
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(videos);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, youtubeLink, category, pdfUrl, subjectId } = await request.json();
    if (!title || !youtubeLink || !category) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    const video = await (prisma.video as any).create({
      data: { 
        title, 
        youtubeLink, 
        category, 
        pdfUrl,
        subjectId: subjectId || null
      }
    });
    return NextResponse.json(video, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
