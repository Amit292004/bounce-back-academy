import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Video Lectures & Tutorials – NBSE, JEE, NEET & CUET',
  description:
    'Watch curated video lectures, step-by-step problem solutions, and exam preparation classes by Amit Sharma at Bounce Back Academy.',
  alternates: {
    canonical: '/videos',
  },
  openGraph: {
    title: 'Video Lectures & Concepts | Bounce Back Academy',
    description:
      'Watch free video lectures and exam preparation tutorials for NBSE, JEE, and NEET.',
    url: '/videos',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
