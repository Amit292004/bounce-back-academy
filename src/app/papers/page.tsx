import type { Metadata } from 'next';
import PapersClient from './PapersClient';

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

export default function PapersPage() {
  return <PapersClient />;
}
