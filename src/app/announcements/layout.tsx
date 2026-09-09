import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Announcements & Important Exam Notifications',
  description:
    'Stay updated with the latest news, exam routines, study material releases, and updates from Bounce Back Academy.',
  alternates: {
    canonical: '/announcements',
  },
  openGraph: {
    title: 'Announcements & Updates | Bounce Back Academy',
    description:
      'Latest notifications and academic announcements from Bounce Back Academy.',
    url: '/announcements',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
