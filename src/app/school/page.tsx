import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import SchoolClient, { SchoolResource, SubjectItem, SchoolPremiumItem } from './SchoolClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'NBSE School Learning – Classes 8 to 12 | Bounce Back Academy',
  description:
    'Comprehensive NBSE curriculum study material for Classes 8, 9, 10, 11, and 12. Free chapter-wise notes, past question papers, video lectures, and syllabus revision.',
  alternates: {
    canonical: '/school',
  },
};

export default async function SchoolPage() {
  const [coursesData, subjectsData, notesData, papersData, videosData, premiumData] = await Promise.all([
    prisma.course.findMany({
      where: {
        name: {
          in: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', '8', '9', '10', '11', '12'],
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.subject.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.note.findMany({
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.questionPaper.findMany({
      include: { subject: true, year: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.video.findMany({
      include: { subject: true, chapter: true },
      orderBy: { lectureNumber: 'asc' },
      take: 100,
    }),
    prisma.premiumItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const initialClasses = coursesData.map((c) => c.name);
  const initialSubjects: SubjectItem[] = subjectsData;

  const allNotes: SchoolResource[] = notesData.map((n) => ({
    id: n.id,
    title: n.title,
    type: 'NOTE',
    className: n.className,
    subjectName: n.subject?.name || 'General',
    subjectId: n.subjectId,
    chapterName: n.chapter?.name || null,
    viewUrl: n.viewUrl,
    downloadFile: n.downloadFile,
  }));

  const allPapers: SchoolResource[] = papersData.map((p) => ({
    id: p.id,
    title: p.title,
    type: 'PAPER',
    className: p.className,
    subjectName: p.subject?.name || 'General',
    subjectId: p.subjectId,
    chapterName: p.chapter?.name || null,
    year: p.year?.year || null,
    viewUrl: p.viewUrl,
    downloadFile: p.downloadFile,
  }));

  const allVideos: SchoolResource[] = videosData.map((v) => ({
    id: v.id,
    title: v.title,
    type: 'VIDEO',
    className: v.category,
    subjectName: v.subject?.name || 'General',
    subjectId: v.subjectId || undefined,
    chapterName: v.chapter?.name || null,
    youtubeLink: v.youtubeLink,
    pdfUrl: v.pdfUrl,
  }));

  const premiumItems: SchoolPremiumItem[] = premiumData.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    features: p.features,
    className: p.className,
  }));

  return (
    <SchoolClient
      initialClasses={initialClasses}
      initialSubjects={initialSubjects}
      allNotes={allNotes}
      allPapers={allPapers}
      allVideos={allVideos}
      premiumItems={premiumItems}
    />
  );
}
