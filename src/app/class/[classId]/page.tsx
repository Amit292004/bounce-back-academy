import { prisma } from "@/lib/prisma";
import ClassDashboard from "./ClassDashboard";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ classId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { classId: rawClassId } = await params;
  const classId = decodeURIComponent(rawClassId);
  const upper = classId.toUpperCase();
  const isSkills = ['SKILLS', 'PRACTICAL-SKILLS', 'PRACTICAL SKILLS'].includes(upper);
  const isSpecial = ['CUET', 'JEE', 'NEET', 'SKILLS', 'PRACTICAL-SKILLS', 'PRACTICAL SKILLS'].includes(upper);
  const displayName = isSkills
    ? 'Practical Skills'
    : upper === 'JEE'
      ? 'JEE Main & Advanced'
      : upper === 'NEET'
        ? 'NEET UG'
        : upper === 'CUET'
          ? 'CUET UG'
          : classId.toLowerCase().startsWith('class')
            ? classId
            : `Class ${classId}`;

  const isExam = ['CUET', 'JEE', 'NEET'].includes(upper);
  const metaTitle = isSkills
    ? 'Practical Skills & Tech Competencies | Bounce Back Academy'
    : isExam
      ? `${displayName} Competitive Exam Study Material & Practice | Bounce Back Academy`
      : `${displayName} NBSE Study Material, Notes & Question Papers`;

  const metaDesc = isSkills
    ? 'Hands-on practical skills in AI tools, full-stack programming, prompt engineering, and digital workflows.'
    : isExam
      ? `Comprehensive preparation resources for ${displayName}: high-yield question papers, formula sheets, mock tests, and video lectures.`
      : `Comprehensive free study material for ${displayName} NBSE students. Download question papers, chapter notes, watch video lectures, and practice quizzes.`;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: `/class/${encodeURIComponent(classId)}`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `/class/${encodeURIComponent(classId)}`,
      siteName: 'Bounce Back Academy',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function ClassHub({ params }: Props) {
  const { classId: rawClassId } = await params;
  const classId = decodeURIComponent(rawClassId);
  const upper = classId.toUpperCase();

  const isSkills = ['SKILLS', 'PRACTICAL-SKILLS', 'PRACTICAL SKILLS'].includes(upper);
  const isSpecial = ['CUET', 'JEE', 'NEET', 'SKILLS', 'PRACTICAL-SKILLS', 'PRACTICAL SKILLS'].includes(upper);

  const fallbackClassName = isSkills
    ? 'Skills'
    : isSpecial
      ? upper
      : classId.toLowerCase().startsWith('class')
        ? classId
        : `Class ${classId}`;

  const extraCandidates: string[] = [];
  if (upper === 'JEE') {
    extraCandidates.push('JEE', 'JEE Main', 'JEE Advanced', 'JEE Main & Advanced', 'jee', 'jee-main');
  } else if (upper === 'NEET') {
    extraCandidates.push('NEET', 'NEET UG', 'NEET-UG', 'neet', 'neet-ug');
  } else if (upper === 'CUET') {
    extraCandidates.push('CUET', 'CUET UG', 'CUET-UG', 'cuet');
  } else if (isSkills) {
    extraCandidates.push('Skills', 'Practical Skills', 'practical-skills', 'Skill', 'skills');
  }

  const classCandidates = Array.from(new Set([
    fallbackClassName,
    classId,
    classId.replace(/^Class\s+/i, '').trim(),
    classId.toLowerCase().startsWith('class') ? classId : `Class ${classId}`,
    ...extraCandidates,
  ])).filter(Boolean);

  // Run all DB queries in parallel for maximum speed
  const [course, subjectsData, announcements, premiumItems] = await Promise.all([
    // 1. Resolve exact class name from DB
    prisma.course.findFirst({
      where: {
        OR: [
          { name: { equals: classId, mode: 'insensitive' as const } },
          { name: { equals: fallbackClassName, mode: 'insensitive' as const } },
          { name: { equals: `Class ${classId}`, mode: 'insensitive' as const } },
          ...(isSkills ? [{ name: { equals: 'Skills', mode: 'insensitive' as const } }] : []),
        ],
      },
      select: { name: true },
    }),

    // 2. Fetch all subjects with class-specific content
    prisma.subject.findMany({
      include: {
        chapters: {
          where: { className: { in: classCandidates, mode: 'insensitive' } },
          orderBy: { number: 'asc' },
        },
        notes: {
          where: { className: { in: classCandidates, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
        },
        papers: {
          where: { className: { in: classCandidates, mode: 'insensitive' } },
          include: { year: true },
          orderBy: { createdAt: 'desc' },
        },
        videos: {
          where: { category: { in: classCandidates, mode: 'insensitive' } },
          orderBy: { lectureNumber: 'asc' },
        },
        quizzes: {
          where: { className: { in: classCandidates, mode: 'insensitive' } },
          include: {
            questions: { orderBy: { id: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),

    // 3. Fetch announcements (global + class-specific)
    prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { className: { in: classCandidates, mode: 'insensitive' } },
          { className: null },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),

    // 4. Fetch premium items (global + class-specific)
    prisma.premiumItem.findMany({
      where: {
        isActive: true,
        OR: [
          { className: { in: classCandidates, mode: 'insensitive' } },
          { className: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const dbClassName = course ? course.name : fallbackClassName;

  const displayTitle = isSkills
    ? 'Practical Skills'
    : dbClassName.toUpperCase() === 'JEE'
      ? 'JEE Main & Advanced'
      : dbClassName.toUpperCase() === 'NEET'
        ? 'NEET UG'
        : dbClassName.toUpperCase() === 'CUET'
          ? 'CUET UG'
          : dbClassName;

  // Filter subjects that have content for this class
  const activeSubjects = subjectsData.filter(
    (subject) =>
      subject.chapters.length > 0 ||
      subject.notes.length > 0 ||
      subject.papers.length > 0 ||
      subject.videos.length > 0 ||
      subject.quizzes.length > 0
  );

  return (
    <ClassDashboard
      className={dbClassName}
      displayTitle={displayTitle}
      subjects={activeSubjects}
      announcements={announcements}
      premiumItems={premiumItems}
    />
  );
}
