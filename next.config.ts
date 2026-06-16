import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // Suppress the red error overlay for server-side errors that are safely
  // caught in try/catch (e.g. DB unreachable). Real build errors still show.
  devIndicators: {
    position: 'bottom-right',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://drive.google.com https://*.googleusercontent.com https://*.usercontent.google.com https://*.google.com https://*.supabase.co https://res.cloudinary.com https://*.public.blob.vercel-storage.com",
              "connect-src 'self' https://*.supabase.co https://*.pooler.supabase.com wss://*.supabase.co https://api.razorpay.com https://accounts.google.com",
              "frame-src 'self' https://www.youtube.com https://drive.google.com https://docs.google.com https://api.razorpay.com https://accounts.google.com",
              "media-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
