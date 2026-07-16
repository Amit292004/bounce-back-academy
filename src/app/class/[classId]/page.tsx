import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ClassDashboard from "./ClassDashboard";

interface Props {
  params: Promise<{ classId: string }>;
}

export default async function ClassHub({ params }: Props) {
  const { classId: rawClassId } = await params;
  const classId = decodeURIComponent(rawClassId);

  // Find the matching course in the database to get its exact name/case
  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { name: { equals: classId, mode: 'insensitive' } },
        { name: { equals: `Class ${classId}`, mode: 'insensitive' } }
      ]
    }
  });

  const isSpecial = ['CUET', 'JEE', 'NEET'].includes(classId.toUpperCase());
  const fallbackClassName = isSpecial ? classId.toUpperCase() : (classId.toLowerCase().startsWith('class') ? classId : `Class ${classId}`);
  
  const dbClassName = course ? course.name : fallbackClassName;
  const displayTitle = dbClassName;

  // Fetch all subjects, along with all class-specific resources inside them
  const subjectsData = await prisma.subject.findMany({
    include: {
      chapters: {
        where: { className: dbClassName },
        orderBy: { number: 'asc' },
      },
      notes: {
        where: { className: dbClassName },
        orderBy: { createdAt: 'desc' },
      },
      papers: {
        where: { className: dbClassName },
        include: { year: true },
        orderBy: { createdAt: 'desc' },
      },
      videos: {
        where: { category: dbClassName },
        orderBy: { lectureNumber: 'asc' },
      },
      quizzes: {
        where: { className: dbClassName },
        include: {
          questions: {
            orderBy: { id: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
      }
    }
  });

  // Announcements are either global (null) or class-specific
  const announcements = await prisma.announcement.findMany({
    where: { 
      isActive: true,
      OR: [
        { className: dbClassName },
        { className: null }
      ]
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  // Premium items show class-specific listings or global ones (with no className)
  const premiumItems = await prisma.premiumItem.findMany({
    where: { 
      isActive: true,
      OR: [
        { className: dbClassName },
        { className: null }
      ]
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter out subjects that have absolutely no content for this class
  const activeSubjects = subjectsData.filter(subject => 
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
