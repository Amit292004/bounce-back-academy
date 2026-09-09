import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBSE Previous Years Question Papers & Model Papers (Classes 8–12)',
  description:
    'Download free NBSE previous year question papers, solved papers, and model question banks for Classes 8, 9, 10, 11, and 12.',
  alternates: {
    canonical: '/papers',
  },
  openGraph: {
    title: 'NBSE Question Papers (Classes 8–12) | Bounce Back Academy',
    description:
      'Download free NBSE previous years and model question papers with solutions.',
    url: '/papers',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function PapersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
