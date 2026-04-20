import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signStudentToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.replace(/['"]/g, '');
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return NextResponse.json({ error: 'Google configuration missing' }, { status: 500 });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || 'Google User';

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user for Google login
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          class: 'Not Selected',
          emailVerified: true, // Mark Google users as verified
        },
      });
    } else if (!user.emailVerified) {
      // Ensure existing users are marked as verified if they sign in with Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }

    // Generate JWT session
    const sessionToken = await signStudentToken({ userId: user.id, email: user.email });

    const isNewOrIncomplete = !user.mobile || user.class === 'Not Selected';

    const response = NextResponse.json(
      { 
        success: true, 
        needsProfile: isNewOrIncomplete,
        user: { name: user.name, class: user.class, email: user.email } 
      },
      { status: 200 }
    );
    
    response.cookies.set({
      name: 'student_token',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}

