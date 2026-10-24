import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Student Dashboard | Bounce Back Academy',
  description: 'Your personal learning space. Access your class curriculum, study notes, past papers, video lectures, and AI tutor.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
