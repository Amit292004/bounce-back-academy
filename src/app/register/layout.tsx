import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Student Account | Bounce Back Academy',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
