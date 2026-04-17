import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(feedbacks);
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
