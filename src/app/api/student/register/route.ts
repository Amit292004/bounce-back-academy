import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signStudentToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, className, email, mobile, password } = await request.json();

    if (!name || !className || !email || !mobile || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json({ error: 'Email already registered. Please sign in.' }, { status: 400 });
      }
      // If user exists but is not verified, we'll delete the old one and create a new one
      // (or we could update it, but deleting ensures a clean state with new OTP)
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

    const response = NextResponse.json({
      success: true,
      requiresVerification: true,
      email: user.email,
      emailSent,
      // Expose OTP when email is not configured or fails to send
      ...(!emailSent ? { devOtp: otp } : {})
    }, { status: 201 });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({
      error: 'Registration failed. Please try again.',
      details: error?.message || 'Unknown database error'
    }, { status: 500 });
  }
}
