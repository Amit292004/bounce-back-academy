import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ExamsClient, { ExamResource } from './ExamsClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Competitive Exam Preparation – JEE Main, Advanced, NEET UG & CUET | Bounce Back Academy',
  description:
    'Dedicated national entrance examination preparation for JEE Main, JEE Advanced, NEET UG, and CUET. Access question papers, formula sheets, mock tests, and AI doubt solving.',
  alternates: {
    canonical: '/exams',
  },
};

export default async function ExamsPage() {
  const examKeywords = ['JEE', 'NEET', 'CUET'];

  const [notesData, papersData, videosData] = await Promise.all([
    prisma.note.findMany({
      where: {
        OR: examKeywords.map((k) => ({
          className: { contains: k, mode: 'insensitive' },
        })),
      },
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.questionPaper.findMany({
      where: {
        OR: examKeywords.map((k) => ({
          className: { contains: k, mode: 'insensitive' },
        })),
      },
      include: { subject: true, year: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.video.findMany({
      where: {
        OR: examKeywords.map((k) => ({
          category: { contains: k, mode: 'insensitive' },
        })),
      },
      include: { subject: true, chapter: true },
      orderBy: { lectureNumber: 'asc' },
      take: 50,
    }),
  ]);

  const allNotes: ExamResource[] = notesData.map((n) => ({
    id: n.id,
    title: n.title,
    type: 'NOTE',
    className: n.className,
    subjectName: n.subject?.name || 'General',
    viewUrl: n.viewUrl,
    downloadFile: n.downloadFile,
  }));

  const allPapers: ExamResource[] = papersData.map((p) => ({
    id: p.id,
    title: p.title,
    type: 'PAPER',
    className: p.className,
    subjectName: p.subject?.name || 'General',
    year: p.year?.year || null,
    viewUrl: p.viewUrl,
    downloadFile: p.downloadFile,
  }));

  const allVideos: ExamResource[] = videosData.map((v) => ({
    id: v.id,
    title: v.title,
    type: 'VIDEO',
    className: v.category,
    subjectName: v.subject?.name || 'General',
    youtubeLink: v.youtubeLink,
  }));

  return (
    <ExamsClient
      allNotes={allNotes}
      allPapers={allPapers}
      allVideos={allVideos}
    />
  );
}
