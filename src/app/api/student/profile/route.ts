import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { name, className, mobile } = await request.json();

    if (!name || !className) {
      return NextResponse.json({ error: 'Name and class are required' }, { status: 400 });
    }

    const updated = await (prisma.user.update as any)({
      where: { id: payload.userId as string },
      data: { name, class: className, mobile: mobile || null },
      select: { id: true, name: true, class: true, email: true, mobile: true, createdAt: true },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
