import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Reviews & Testimonials',
  description:
    'Read honest feedback and reviews from students and parents about Bounce Back Academy study materials and classes.',
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'Reviews & Testimonials | Bounce Back Academy',
    description:
      'Read genuine feedback from students of Bounce Back Academy.',
    url: '/reviews',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
