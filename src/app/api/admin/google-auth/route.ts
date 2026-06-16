import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';
import { verifyToken, signAdminToken } from '@/lib/auth';
import { logger } from '@/lib/logger'

// OAuth2Client is instantiated inside the handler to prevent build-time crashes if Client ID is missing


export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      logger.error('[/api/admin/google-auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
      return NextResponse.json({ error: 'Google configuration error' }, { status: 500 });
    }
    const client = new OAuth2Client(clientId);

    const { token } = await request.json();
    const cookieStore = await cookies();
    const preAuthToken = cookieStore.get('admin_pre_auth')?.value;

    if (!preAuthToken) {
      return NextResponse.json({ error: 'Session expired or invalid. Please login again.' }, { status: 401 });
    }

    // Verify pre-auth token
    const payload = await verifyToken(preAuthToken);
    if (!payload || !payload.adminId || !payload.preAuth) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const adminId = payload.adminId as string;

    if (!token) {
      return NextResponse.json({ error: 'Google token is required' }, { status: 400 });
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const googleEmail = googlePayload.email;

    // Fetch admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Handle Google Account Locking
    if (!admin.googleEmail) {
      // First time Google login - Lock the account
      await prisma.admin.update({
        where: { id: adminId },
        data: { googleEmail }
      });
    } else if (admin.googleEmail !== googleEmail) {
      // Not the locked account
      return NextResponse.json({ 
        error: 'Access denied. You must login with the Google account associated with this admin.' 
      }, { status: 403 });
    }

    // Success! Issue full admin token
    const fullToken = await signAdminToken({ adminId: admin.id, username: admin.username });

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Set final admin_token cookie
    response.cookies.set({
      name: 'admin_token',
      value: fullToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Remove pre-auth cookie
    response.cookies.delete('admin_pre_auth');

    return response;
  } catch (error) {
    logger.error('Admin Google auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
