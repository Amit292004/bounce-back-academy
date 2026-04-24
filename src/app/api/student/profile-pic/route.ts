import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: 'Image data is required' }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: payload.userId as string },
      data: { image },
      select: { id: true, name: true, image: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Profile pic upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.update({
      where: { id: payload.userId as string },
      data: { image: null },
      select: { id: true, name: true, image: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Profile pic removal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
