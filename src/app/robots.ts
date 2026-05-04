import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profile/', '/api/', '/ad/', '/verify/', '/login', '/register'],
    },
    sitemap: 'https://bouncebackacademy.vercel.app/sitemap.xml',
  };
}
