import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const materialType = await prisma.materialType.findUnique({
      where: { id }
    });

    if (!materialType) {
      return NextResponse.json({ error: 'Material type not found' }, { status: 404 });
    }

    // Protect default ones from being deleted
    const protectedCodes = ['NOTE', 'PYQ', 'COURSE', 'LECTURE'];
    if (protectedCodes.includes(materialType.code)) {
      return NextResponse.json({ error: 'Default material types cannot be deleted' }, { status: 400 });
    }

    await prisma.materialType.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Material type deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete material type:', error);
    return NextResponse.json({ error: 'Failed to delete material type' }, { status: 500 });
  }
}
