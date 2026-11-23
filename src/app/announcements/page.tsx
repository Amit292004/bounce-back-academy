import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import AnnouncementsClient, { AnnouncementItem } from './AnnouncementsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Announcements & Official Notices | Bounce Back Academy',
  description:
    'Stay updated with official academic notices, exam routines, study material releases, and platform updates from Bounce Back Academy.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/announcements' },
  openGraph: {
    title: 'Announcements & Official Notices | Bounce Back Academy',
    description: 'Official academic notices and platform updates from Bounce Back Academy.',
    url: 'https://bouncebackacademy.vercel.app/announcements',
    type: 'website',
  },
};

export default async function AnnouncementsPage() {
  let announcements: AnnouncementItem[] = [];

  try {
    const rawAnnouncements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      message: a.message,
      imageUrl: a.imageUrl,
      type: a.type,
      isActive: a.isActive,
      priority: a.priority,
      className: a.className,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to fetch announcements:', error);
  }

  return <AnnouncementsClient initialAnnouncements={announcements} />;
}
