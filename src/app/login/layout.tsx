import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Login | Bounce Back Academy',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
