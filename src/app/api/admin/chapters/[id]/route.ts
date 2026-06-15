import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.chapter.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Chapter deleted' });
  } catch (error: any) {
    logger.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter', details: error.message }, { status: 500 });
  }
}
