import { prisma } from "@/lib/prisma";
import ClassDashboard from "./ClassDashboard";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ classId: string }>;
}

export default async function ClassHub({ params }: Props) {
  const { classId: rawClassId } = await params;
  const classId = decodeURIComponent(rawClassId);

  const isSpecial = ['CUET', 'JEE', 'NEET'].includes(classId.toUpperCase());
  const fallbackClassName = isSpecial
    ? classId.toUpperCase()
    : classId.toLowerCase().startsWith('class')
      ? classId
      : `Class ${classId}`;

  // Run all DB queries in parallel for maximum speed
  const [course, subjectsData, announcements, premiumItems] = await Promise.all([
    // 1. Resolve exact class name from DB
    prisma.course.findFirst({
      where: {
        OR: [
          { name: { equals: classId, mode: 'insensitive' } },
          { name: { equals: `Class ${classId}`, mode: 'insensitive' } },
        ],
      },
      select: { name: true },
    }),

    // 2. Fetch all subjects with class-specific content
    prisma.subject.findMany({
      include: {
        chapters: {
          where: { className: { equals: fallbackClassName, mode: 'insensitive' } },
          orderBy: { number: 'asc' },
        },
        notes: {
          where: { className: { equals: fallbackClassName, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
        },
        papers: {
          where: { className: { equals: fallbackClassName, mode: 'insensitive' } },
          include: { year: true },
          orderBy: { createdAt: 'desc' },
        },
        videos: {
          where: { category: { equals: fallbackClassName, mode: 'insensitive' } },
          orderBy: { lectureNumber: 'asc' },
        },
        quizzes: {
          where: { className: { equals: fallbackClassName, mode: 'insensitive' } },
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
          { className: { equals: fallbackClassName, mode: 'insensitive' } },
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
          { className: { equals: fallbackClassName, mode: 'insensitive' } },
          { className: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const dbClassName = course ? course.name : fallbackClassName;

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
      displayTitle={dbClassName}
      subjects={activeSubjects}
      announcements={announcements}
      premiumItems={premiumItems}
    />
  );
}
