import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await prisma.announcement.delete({ where: { id: params.id }});
  return NextResponse.json({ success: true });
}
