import type { Metadata } from 'next';
import AllReviewsPage from './ReviewsClient';

export const metadata: Metadata = {
  title: 'Student Reviews – Bounce Back Academy',
  description:
    'Read genuine student reviews and testimonials about Bounce Back Academy. See what students say about NBSE coaching for Classes 8–12 by Amit Sharma.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/reviews' },
  openGraph: {
    title: 'Student Reviews – Bounce Back Academy',
    description:
      'Read genuine student reviews and testimonials about Bounce Back Academy NBSE coaching.',
    url: 'https://bouncebackacademy.vercel.app/reviews',
    type: 'website',
  },
};

export default function ReviewsPage() {
  return <AllReviewsPage />;
}
