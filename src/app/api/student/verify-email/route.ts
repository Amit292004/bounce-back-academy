import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signStudentToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 200 });
    }

    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Mark as verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otp: null,
        otpExpires: null
      }
    });

    const token = await signStudentToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ success: true, message: 'Email verified successfully!' });

    response.cookies.set({
      name: 'student_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    logger.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
