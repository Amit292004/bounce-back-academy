import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signStudentToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger'

// Fix #3: Rate limit — 8 login attempts per IP per minute
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 8, 60);
  if (limited) return limited;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({
        error: 'Please verify your email to login',
        requiresVerification: true,
        email: user.email
      }, { status: 403 });
    }

    const token = await signStudentToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ success: true, user: { name: user.name, class: user.class, email: user.email } }, { status: 200 });

    response.cookies.set({
      name: 'student_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    // Fix #8: Log internally, never expose raw error to client
    logger.error('[student/login] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
