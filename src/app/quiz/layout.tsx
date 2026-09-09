import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Practice Quizzes & Mock Tests – Classes 8–12',
  description:
    'Practice interactive chapter-wise quizzes, test your conceptual clarity, and prepare for NBSE exams with instant scoring.',
  alternates: {
    canonical: '/quiz',
  },
  openGraph: {
    title: 'Online Practice Quizzes & Tests | Bounce Back Academy',
    description:
      'Interactive online quizzes and mock tests for NBSE Classes 8–12.',
    url: '/quiz',
    siteName: 'Bounce Back Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
