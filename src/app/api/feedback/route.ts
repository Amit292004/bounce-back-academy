import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Fix #18: Add input length validation to prevent oversized payloads
export async function POST(request: Request) {
  try {
    const { name, className, message } = await request.json();
    if (!name || !className || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (name.length > 100) return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    if (className.length > 50) return NextResponse.json({ error: 'Class is too long' }, { status: 400 });
    if (message.length > 2000) return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 });

    await prisma.feedback.create({
      data: { name, className, message }
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
