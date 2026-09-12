import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import VideosClient from './VideosClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free Video Lectures – NBSE Classes 8–12, JEE & NEET | Bounce Back Academy',
  description:
    'Watch free video lectures for NBSE Classes 8 to 12, CUET, JEE & NEET by Amit Sharma. Maths, Science and more — all on Bounce Back Academy.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/videos' },
  openGraph: {
    title: 'Free Video Lectures – NBSE Classes 8–12, JEE & NEET | Bounce Back Academy',
    description:
      'Watch free video lectures for NBSE Classes 8 to 12, CUET, JEE & NEET by Amit Sharma.',
    url: 'https://bouncebackacademy.vercel.app/videos',
    type: 'website',
  },
};

export default async function VideosPage() {
  let initialVideos: any[] = [];
  try {
    initialVideos = await prisma.video.findMany({
      include: { subject: true, chapter: true },
      orderBy: [{ lectureNumber: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  } catch {
    // DB unavailable during build — client will fetch on mount
  }
  return <VideosClient initialVideos={initialVideos} />;
}
