import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://bouncebackacademy.vercel.app';
  const now = new Date();

  // Fetch subjects and courses to create dynamic category URLs
  let subjects: { id: string; name: string }[] = [];
  let courses: { id: string; name: string }[] = [];

  try {
    subjects = await prisma.subject.findMany({ select: { id: true, name: true } });
    courses = await prisma.course.findMany({ select: { id: true, name: true } });
  } catch (error) {
    console.error("Error fetching data for sitemap:", error);
  }

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
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
      priority: 0.8,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamically add URLs for each Course (Class) in Notes, Papers, and Videos
  courses.forEach((course) => {
    const courseEncoded = encodeURIComponent(course.name);
    sitemapEntries.push({
      url: `${base}/notes?class=${courseEncoded}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
    sitemapEntries.push({
      url: `${base}/papers?class=${courseEncoded}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
    sitemapEntries.push({
      url: `${base}/videos?class=${courseEncoded}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // Dynamically add URLs for each Subject
  subjects.forEach((subject) => {
    sitemapEntries.push({
      url: `${base}/notes?subject=${subject.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
    sitemapEntries.push({
      url: `${base}/papers?subject=${subject.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  return sitemapEntries;
}
