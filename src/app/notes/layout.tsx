import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free NBSE Study Notes for Classes 8–12, CUET, JEE & NEET',
  description:
    'Download free chapter-wise NBSE study notes, revision summaries, formulas, and textbook solutions for Classes 8, 9, 10, 11, and 12.',
  alternates: {
    canonical: '/notes',
  },
  openGraph: {
    title: 'Free NBSE Study Notes – Classes 8 to 12 | Bounce Back Academy',
    description:
      'Download free chapter-wise study notes, formulas, and revision guides for NBSE students.',
    url: '/notes',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
