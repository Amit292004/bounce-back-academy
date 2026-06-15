import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  try {
    const { qId } = await params;
    await prisma.quizQuestion.delete({
      where: { id: qId }
    });
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    logger.error('Delete quiz question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
