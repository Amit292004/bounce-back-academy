import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (category && category !== 'All Topics') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const posts = await (prisma as any).forumPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { replies: true } }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    logger.error('Forum posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to create a post' }, { status: 401 });
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

    const { title, content, category, tags } = await request.json();
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.length > 200) return NextResponse.json({ error: 'Title is too long' }, { status: 400 });
    if (content.length > 5000) return NextResponse.json({ error: 'Content is too long' }, { status: 400 });

    const tagArray = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean).slice(0, 10)
      : typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10)
        : [category || 'General'];

    const post = await (prisma as any).forumPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || 'General',
        authorName: user.name,
        authorClass: `Class ${user.class}`,
        upvotes: 1,
        upvotedBy: [userId],
        tags: tagArray
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error('Forum post creation error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
