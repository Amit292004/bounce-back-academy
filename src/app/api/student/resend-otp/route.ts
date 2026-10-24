import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Rate limit: 3 resend attempts per IP per minute
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 3, 60);
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 200 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires,
      },
    });

    let emailSent = false;
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (emailConfigured) {
      try {
        const { sendOTP } = await import('@/lib/email');
        await sendOTP(normalizedEmail, otp);
        emailSent = true;
      } catch (err) {
        logger.error('Failed to resend OTP email:', err);
      }
    } else {
      console.warn(`[DEV] Email not configured. Resent OTP for ${normalizedEmail} is: ${otp}`);
    }

    const isDevMode = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      emailSent,
      ...(!emailSent && isDevMode ? { devOtp: otp } : {}),
      message: 'A new verification code has been sent.',
    }, { status: 200 });
  } catch (error) {
    logger.error('[student/resend-otp] error:', error);
    return NextResponse.json({ error: 'Failed to resend code. Please try again.' }, { status: 500 });
  }
}
