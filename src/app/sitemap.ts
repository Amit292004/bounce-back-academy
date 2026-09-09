import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://bouncebackacademy.vercel.app';
  const now = new Date();

  // Fetch courses (classes) to create clean, dedicated class hub URLs
  let courses: { id: string; name: string }[] = [];

  try {
    courses = await prisma.course.findMany({ select: { id: true, name: true } });
  } catch (error) {
    logger.error("Error fetching data for sitemap:", error);
  }

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/notes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/papers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/videos`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${base}/quiz`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${base}/ask`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/premium`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/announcements`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${base}/forum`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${base}/reviews`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamically add clean authoritative URLs for each Class Hub (Class 8, 9, 10, 11, 12, CUET, JEE, NEET)
  courses.forEach((course) => {
    sitemapEntries.push({
      url: `${base}/class/${encodeURIComponent(course.name)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  });

  return sitemapEntries;
}
