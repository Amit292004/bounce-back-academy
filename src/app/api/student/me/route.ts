import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ authenticated: false });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ authenticated: false });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, class: true, email: true, mobile: true, createdAt: true } as any
    });

    if (!user) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, ...user });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
