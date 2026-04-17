import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (!token) return NextResponse.json({ authenticated: false });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: true, userId: payload.userId, email: payload.email });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
