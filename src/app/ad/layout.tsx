import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = '/logo.png';
  const description = 'Check out this special offer from Bounce Back Academy!';
  const title = 'Bounce Back Academy – Special Offer';

  return {
    title,
    description,
    metadataBase: new URL('https://bouncebackacademy.vercel.app'),
    openGraph: {
      title,
      description,
      url: 'https://bouncebackacademy.vercel.app/ad',
      siteName: 'Bounce Back Academy',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function AdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
