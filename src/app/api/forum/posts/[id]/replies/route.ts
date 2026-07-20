import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to reply' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, class: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await (prisma as any).forumPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }
    if (content.length > 3000) {
      return NextResponse.json({ error: 'Reply is too long' }, { status: 400 });
    }

    const reply = await (prisma as any).forumReply.create({
      data: {
        postId: id,
        content: content.trim(),
        authorName: user.name,
        authorClass: `Class ${user.class}`
      }
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    logger.error('Forum reply creation error:', error);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
