import type { Metadata } from 'next';
import PremiumStorePage from './PremiumClient';

export const metadata: Metadata = {
  title: 'Premium Study Material – NBSE Classes 8–12 | Bounce Back Academy',
  description:
    'Unlock premium NBSE study material, video courses, notes and question papers for Classes 8–12, CUET, JEE & NEET. Affordable plans by Bounce Back Academy.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/premium' },
  openGraph: {
    title: 'Premium Study Material – NBSE Classes 8–12 | Bounce Back Academy',
    description:
      'Unlock premium NBSE study material, video courses, notes and question papers for Classes 8–12.',
    url: 'https://bouncebackacademy.vercel.app/premium',
    type: 'website',
  },
};

export default function PremiumPage() {
  return <PremiumStorePage />;
}
