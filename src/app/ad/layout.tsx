import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  let imageUrl = '/logo.png';
  let description = 'Check out this special offer from Bounce Back Academy!';
  let title = 'Bounce Back Academy – Special Offer';

  try {
    const branding = await prisma.branding.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (branding) {
      if (branding.adImageUrl) imageUrl = branding.adImageUrl;
      if (branding.adMessage) description = branding.adMessage;
    }
  } catch (e) {
    console.error('Error fetching ad branding:', e);
  }

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
