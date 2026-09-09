import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Discussion Forum & Doubts Community',
  description:
    'Join the Bounce Back Academy student community. Ask academic doubts, discuss exam questions, and share study tips with peers.',
  alternates: {
    canonical: '/forum',
  },
  openGraph: {
    title: 'Student Discussion Forum | Bounce Back Academy',
    description:
      'Ask doubts, discuss questions, and collaborate with other NBSE students.',
    url: '/forum',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
