import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium Courses, Study Bundles & Masterclasses',
  description:
    'Explore premium study materials, structured video courses, and specialized coaching bundles by Bounce Back Academy.',
  alternates: {
    canonical: '/premium',
  },
  openGraph: {
    title: 'Premium Courses & Study Materials | Bounce Back Academy',
    description:
      'Explore premium study materials and masterclasses for NBSE exams.',
    url: '/premium',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
