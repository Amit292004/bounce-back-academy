import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import CoursesClient from './CoursesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Courses & Learning Modules | Bounce Back Academy',
  description:
    'Explore comprehensive syllabus-aligned courses, past papers, notes, and video modules for Classes 8–12, JEE, and NEET.',
  alternates: {
    canonical: '/courses',
  },
};

export default async function CoursesPage() {
  let courses: any[] = [];
  let premiumItems: any[] = [];

  try {
    const [rawCourses, rawPremium] = await Promise.all([
      prisma.course.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.premiumItem.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    courses = rawCourses.map((c) => ({
      ...c,
      createdAt: c.createdAt?.toISOString ? c.createdAt.toISOString() : c.createdAt,
      // Hub destination route: /class/[name]
      hubPath: `/class/${encodeURIComponent(c.name)}`,
    }));

    premiumItems = rawPremium.map((p) => ({
      ...p,
      createdAt: p.createdAt?.toISOString ? p.createdAt.toISOString() : p.createdAt,
    }));
  } catch (err) {
    console.error('Error fetching courses page data:', err);
  }

  // Renders curriculum hubs that link to /class/[name] and featured courses
  return <CoursesClient initialCourses={courses} initialPremiumItems={premiumItems} />;
}
