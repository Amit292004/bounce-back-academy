import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, class: true, email: true, createdAt: true }
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
