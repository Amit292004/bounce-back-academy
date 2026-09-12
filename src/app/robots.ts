import { MetadataRoute } from 'next';

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
        '/favorites/',
        '/payment/',
        '/verify/',
        '/verify-email/',
        '/login',
        '/register',
        '/feedback/',
      ],
    },
    sitemap: 'https://bouncebackacademy.vercel.app/sitemap.xml',
  };
}
