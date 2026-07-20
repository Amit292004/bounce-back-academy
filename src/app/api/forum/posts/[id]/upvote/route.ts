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
      return NextResponse.json({ error: 'Please sign in to vote' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId as string;

    const post = await (prisma as any).forumPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const alreadyUpvoted = (post.upvotedBy as string[]).includes(userId);

    if (alreadyUpvoted) {
      await (prisma as any).forumPost.update({
        where: { id },
        data: {
          upvotes: { decrement: 1 },
          upvotedBy: (post.upvotedBy as string[]).filter((uid: string) => uid !== userId)
        }
      });
      return NextResponse.json({ upvoted: false });
    } else {
      await (prisma as any).forumPost.update({
        where: { id },
        data: {
          upvotes: { increment: 1 },
          upvotedBy: [...(post.upvotedBy as string[]), userId]
        }
      });
      return NextResponse.json({ upvoted: true });
    }
  } catch (error) {
    logger.error('Forum upvote error:', error);
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 });
  }
}
