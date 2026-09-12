import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PapersClient from './PapersClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free NBSE Question Papers – Classes 8–12 | Bounce Back Academy',
  description:
    'Download free NBSE past question papers for Class 8, 9, 10, 11 & 12. Previous year papers for Maths, Science, English and all subjects.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/papers' },
  openGraph: {
    title: 'Free NBSE Question Papers – Classes 8–12 | Bounce Back Academy',
    description:
      'Download free NBSE past question papers for Class 8, 9, 10, 11 & 12. Previous year papers for all subjects.',
    url: 'https://bouncebackacademy.vercel.app/papers',
    type: 'website',
  },
};

export default async function PapersPage() {
  let initialPapers: any[] = [];
  try {
    initialPapers = await prisma.questionPaper.findMany({
      include: { subject: true, year: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    // DB unavailable during build — client will fetch on mount
  }
  return <PapersClient initialPapers={initialPapers} />;
}
