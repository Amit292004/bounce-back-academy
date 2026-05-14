import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signStudentToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

// Fix #3: Rate limit — 3 registrations per IP per 10 minutes
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 3, 600);
  if (limited) return limited;

  try {
    const { name, className, email, mobile, password } = await request.json();

    if (!name || !className || !email || !mobile || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Fix #18: Server-side input length limits
    if (name.length > 100) return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    if (email.length > 254) return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    if (mobile.length > 20) return NextResponse.json({ error: 'Mobile number is too long' }, { status: 400 });

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json({ error: 'Email already registered. Please sign in.' }, { status: 400 });
      }
      // If user exists but is not verified, delete the old one and create fresh with new OTP
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name,
        class: className,
        email,
        mobile,
        password: hashedPassword,
        otp,
        otpExpires,
        emailVerified: false
      }
    });

    // Try to send OTP email — failure must NOT block registration
    let emailSent = false;
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (emailConfigured) {
      try {
        const { sendOTP } = await import('@/lib/email');
        await sendOTP(email, otp);
        emailSent = true;
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
      }
    } else {
      // Log OTP to server console so you can verify in development
      console.warn(`[DEV] Email not configured. OTP for ${email} is: ${otp}`);
    }

    // Fix #2: Never expose the OTP in the response in production,
    // even if email fails to send — log it server-side only.
    const isDevMode = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: user.email,
      emailSent,
      // Only expose devOtp in non-production environments
      ...(!emailSent && isDevMode ? { devOtp: otp } : {}),
    }, { status: 201 });

  } catch (error) {
    // Fix #8: Never send raw error details to the client
    console.error('[register] error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
