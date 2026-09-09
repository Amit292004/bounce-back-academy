import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | Bounce Back Academy',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
