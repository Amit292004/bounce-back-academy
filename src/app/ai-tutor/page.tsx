import type { Metadata } from 'next';
import AskClient from '../ask/AskClient';

export const metadata: Metadata = {
  title: 'Bounce Back AI Tutor – 24/7 Smart Doubt Solver | Classes 8–12, JEE, NEET',
  description:
    'Instant step-by-step solutions for NBSE, CBSE, JEE, NEET, and CUET. Solve complex Mathematics derivations, Physics equations, Chemistry mechanisms, and practical skill queries.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/ai-tutor' },
  openGraph: {
    title: 'Bounce Back AI Tutor – 24/7 Smart Doubt Solver | Bounce Back Academy',
    description:
      'Instant step-by-step solutions for NBSE, CBSE, JEE, NEET, and CUET. Free 24/7 academic AI tutor.',
    url: 'https://bouncebackacademy.vercel.app/ai-tutor',
    type: 'website',
  },
};

export default function AITutorPage() {
  return <AskClient />;
}
