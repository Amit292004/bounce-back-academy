import type { Metadata } from 'next';
import StudentQuizPage from './QuizClient';

export const metadata: Metadata = {
  title: 'Free Online Quiz – NBSE Classes 8–12 | Bounce Back Academy',
  description:
    'Test your knowledge with free online quizzes for NBSE Classes 8 to 12. Practice MCQs for Maths, Science, English and more.',
  alternates: { canonical: 'https://bouncebackacademy.vercel.app/quiz' },
  openGraph: {
    title: 'Free Online Quiz – NBSE Classes 8–12 | Bounce Back Academy',
    description:
      'Test your knowledge with free online quizzes for NBSE Classes 8 to 12. Practice MCQs for all subjects.',
    url: 'https://bouncebackacademy.vercel.app/quiz',
    type: 'website',
  },
};

export default function QuizPage() {
  return <StudentQuizPage />;
}
