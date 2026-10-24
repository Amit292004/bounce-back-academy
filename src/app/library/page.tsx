import type { Metadata } from 'next';
import { Suspense } from 'react';
import LibraryClient from './LibraryClient';

export const metadata: Metadata = {
  title: 'Study Library & Universal Catalog | Bounce Back Academy',
  description:
    'Search and discover all free and verified NBSE study notes, question papers, video lectures, and online quizzes.',
  alternates: {
    canonical: '/library',
  },
};

export default function LibraryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', padding: '4rem 1rem', textAlign: 'center', opacity: 0.6 }}>Loading Study Library...</div>}>
      <LibraryClient />
    </Suspense>
  );
}
