import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { emailVerified: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, class: true, email: true, mobile: true, image: true, adSent: true, welcomeSent: true, createdAt: true } as any
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, adSent, welcomeSent } = await request.json();
    const data: any = {};
    if (adSent !== undefined) data.adSent = adSent;
    if (welcomeSent !== undefined) data.welcomeSent = welcomeSent;

    await prisma.user.update({
      where: { id },
      data: data
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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
