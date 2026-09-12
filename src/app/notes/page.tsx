import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import NotesClient from './NotesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free NBSE Notes – Classes 8 to 12 | Bounce Back Academy',
  description:
    'Download free NBSE study notes for Class 8, 9, 10, 11 & 12 — Maths, Science, English and more. Quality notes by Amit Sharma, Bounce Back Academy.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/notes' },
  openGraph: {
    title: 'Free NBSE Notes – Classes 8 to 12 | Bounce Back Academy',
    description:
      'Download free NBSE study notes for Class 8, 9, 10, 11 & 12 — Maths, Science, English and more.',
    url: 'https://bouncebackacademy.vercel.app/notes',
    type: 'website',
  },
};

export default async function NotesPage() {
  let initialNotes: any[] = [];
  try {
    initialNotes = await prisma.note.findMany({
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    // DB unavailable during build — client will fetch on mount
  }
  return <NotesClient initialNotes={initialNotes} />;
}
