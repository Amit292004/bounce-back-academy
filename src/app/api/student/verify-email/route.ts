import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({
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

    if (new Date() > new Date(user.otpExpires)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Mark as verified and clear OTP
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otp: null,
        otpExpires: null
      }
    });

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
