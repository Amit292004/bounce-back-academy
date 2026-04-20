import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Instead of full token, set a temporary pre-auth cookie
    const preAuthToken = await signAdminToken({ adminId: admin.id, username: admin.username, preAuth: true });

    const response = NextResponse.json({ 
      success: true, 
      requiresGoogle: true,
      adminId: admin.id 
    }, { status: 200 });
    
    // Set temporary pre-auth cookie (short lived)
    response.cookies.set({
      name: 'admin_pre_auth',
      value: preAuthToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
