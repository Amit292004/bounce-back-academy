import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tutor – Instant Homework & Doubt Solver',
  description: 'Bounce Back Academy AI Tutor — instant step-by-step answers for NBSE, JEE, NEET & CUET. Powered by LLaMA 3.3 via Groq. Free for all students.',
  alternates: {
    canonical: '/ask',
  },
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
