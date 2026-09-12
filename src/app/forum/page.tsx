import type { Metadata } from 'next';
import ForumClient from './ForumClient';

export const metadata: Metadata = {
  title: 'Student Forum – NBSE Discussion | Bounce Back Academy',
  description:
    'Join the Bounce Back Academy student forum. Discuss NBSE topics, share study tips, and get help with Maths, Science and all subjects for Classes 8–12.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/forum' },
  openGraph: {
    title: 'Student Forum – NBSE Discussion | Bounce Back Academy',
    description:
      'Join the Bounce Back Academy student forum. Discuss NBSE topics and get help for Classes 8–12.',
    url: 'https://bouncebackacademy.vercel.app/forum',
    type: 'website',
  },
};

export default function ForumPage() {
  return <ForumClient />;
}
