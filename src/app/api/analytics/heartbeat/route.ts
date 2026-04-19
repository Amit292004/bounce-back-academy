import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    // Upsert the session to mark it as active
    await (prisma as any).activeSession.upsert({
      where: { id: sessionId },
      update: { lastSeen: new Date() },
      create: { id: sessionId, lastSeen: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}
