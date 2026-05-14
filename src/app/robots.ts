import { MetadataRoute } from 'next';

// Fix #23: Ensure /admin/* and /api/* are disallowed for crawlers
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/profile/',
        '/ad/',
        '/verify/',
        '/verify-email/',
        '/login',
        '/register',
      ],
    },
    sitemap: 'https://bouncebackacademy.vercel.app/sitemap.xml',
  };
}
