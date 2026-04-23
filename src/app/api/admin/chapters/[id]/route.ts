import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (prisma as any).chapter.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Chapter deleted' });
  } catch (error: any) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter', details: error.message }, { status: 500 });
  }
}
