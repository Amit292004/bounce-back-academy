import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendBulkAnnouncement } from '@/lib/email';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Verify admin
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.adminId || payload.preAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, message, imageUrl, userIds } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Check if email is configured
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (!emailConfigured) {
      return NextResponse.json({ error: 'Email system is not configured on the server.' }, { status: 500 });
    }

    // Fetch targeted users
    const users = await prisma.user.findMany({
      where: userIds && userIds.length > 0 
        ? { id: { in: userIds }, emailVerified: true }
        : { emailVerified: true },
      select: { email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No verified users found to send email to.' }, { status: 400 });
    }

    const allEmails = users.map(user => user.email);

    // Chunk emails into groups of 50 to avoid SMTP limits/spam filters
    const chunkSize = 50;
    const emailChunks = [];
    for (let i = 0; i < allEmails.length; i += chunkSize) {
      emailChunks.push(allEmails.slice(i, i + chunkSize));
    }

    // Send emails in chunks sequentially to avoid overwhelming the SMTP server
    let sentCount = 0;
    for (const chunk of emailChunks) {
      await sendBulkAnnouncement(chunk, subject, message, imageUrl);
      sentCount += chunk.length;

      // Small delay between chunks if there are multiple
      if (emailChunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent to ${sentCount} users.`,
      sentCount
    });
  } catch (error: any) {
    console.error('Bulk email error:', error);
    return NextResponse.json({
      error: 'Failed to send bulk emails.',
      details: error.message
    }, { status: 500 });
  }
}
