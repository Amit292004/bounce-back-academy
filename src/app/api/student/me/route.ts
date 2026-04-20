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

    const user = await (prisma as any).user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, class: true, email: true, mobile: true, image: true, createdAt: true, emailVerified: true }
    });

    if (!user || !user.emailVerified) return NextResponse.json({ authenticated: false });
    
    const { emailVerified, ...userData } = user;
    return NextResponse.json({ authenticated: true, ...userData });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
