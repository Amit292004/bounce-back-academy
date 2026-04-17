import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
