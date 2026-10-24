import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Rate limit: 5 requests per IP per minute
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 5, 60);
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254) {
      return NextResponse.json({ error: 'Email address is too long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user does not exist, return a generic success message to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      }, { status: 200 });
    }

    // Generate 6-digit OTP valid for 10 minutes
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
        logger.error('Failed to send recovery OTP email:', err);
      }
    } else {
      console.warn(`[DEV] Email not configured. Password recovery OTP for ${normalizedEmail} is: ${otp}`);
    }

    const isDevMode = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      emailSent,
      ...(!emailSent && isDevMode ? { devOtp: otp } : {}),
      message: 'Verification code sent to your email.',
    }, { status: 200 });
  } catch (error) {
    logger.error('[student/forgot-password] error:', error);
    return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
  }
}
