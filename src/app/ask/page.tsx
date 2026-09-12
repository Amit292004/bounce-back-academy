import type { Metadata } from 'next';
import AskClient from './AskClient';

export const metadata: Metadata = {
  title: 'Ask a Doubt – NBSE Classes 8–12 | Bounce Back Academy',
  description:
    'Ask your NBSE doubts and get answers for Maths, Science and all subjects. Free doubt-solving for Classes 8–12 at Bounce Back Academy.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/ask' },
  openGraph: {
    title: 'Ask a Doubt – NBSE Classes 8–12 | Bounce Back Academy',
    description:
      'Ask your NBSE doubts and get answers for all subjects. Free doubt-solving for Classes 8–12.',
    url: 'https://bouncebackacademy.vercel.app/ask',
    type: 'website',
  },
};

export default function AskPage() {
  return <AskClient />;
}
