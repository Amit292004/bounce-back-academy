import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Rate limit: 5 password reset attempts per IP per minute
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 5, 60);
  if (limited) return limited;

  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Hash the new password and clear the OTP
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
    }, { status: 200 });
  } catch (error) {
    logger.error('[student/reset-password] error:', error);
    return NextResponse.json({ error: 'Password reset failed. Please try again.' }, { status: 500 });
  }
}
