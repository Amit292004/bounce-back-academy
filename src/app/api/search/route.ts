import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  SearchCategory,
  SearchResultItem,
  SearchResponse,
  normalizeSearchQuery,
  extractClassIntent,
  tokenizeQuery,
  calculateRelevanceScore,
  searchPlatformPagesAndFaqs,
} from '@/lib/search';
import { getViewLink } from '@/lib/utils';
import { normalizeClassName } from '@/lib/classNormalizer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const selectedCategory = (searchParams.get('category') || 'all') as SearchCategory;
    const limit = Math.min(parseInt(searchParams.get('limit') || '40', 10), 60);

    const cleanQuery = rawQuery.trim();
    if (!cleanQuery || cleanQuery.length < 1) {
      return NextResponse.json<SearchResponse>({
        query: '',
        category: selectedCategory,
        totalCount: 0,
        results: [],
        categoryCounts: {
          all: 0,
          courses: 0,
          resources: 0,
          curriculum: 0,
          videos_quizzes: 0,
          exams: 0,
          pages: 0,
        },
      });
    }

    const tokens = tokenizeQuery(cleanQuery);
    const detectedClass = extractClassIntent(cleanQuery);

    // Build database search queries
    // We search across Course, PremiumItem, Subject, Chapter, Note, QuestionPaper, Video, Quiz
    const [courses, premiumItems, subjects, chapters, notes, papers, videos, quizzes] =
      await Promise.all([
        // 1. Core Courses & Pathway courses
        prisma.course.findMany({
          take: 15,
        }),

        // 2. Premium Items (Courses, masterclasses, paid notes)
        prisma.premiumItem.findMany({
          where: { isActive: true },
          take: 20,
        }),

        // 3. Subjects
        prisma.subject.findMany({
          take: 25,
        }),

        // 4. Chapters
        prisma.chapter.findMany({
          include: { subject: true },
          take: 40,
        }),

        // 5. Notes
        prisma.note.findMany({
          include: { subject: true, chapter: true },
          take: 40,
        }),

        // 6. Question Papers
        prisma.questionPaper.findMany({
          include: { subject: true, year: true, chapter: true },
          take: 40,
        }),

        // 7. Videos
        prisma.video.findMany({
          include: { subject: true, chapter: true },
          take: 40,
        }),

        // 8. Quizzes
        prisma.quiz.findMany({
          include: { subject: true, chapter: true, questions: { select: { id: true } } },
          take: 30,
        }),
      ]);

    const candidateResults: SearchResultItem[] = [];

    // --- A. Process Core Courses ---
    for (const c of courses) {
      const isExam = ['jee', 'neet', 'cuet'].includes(c.name.toLowerCase());
      const isSkills = c.name.toLowerCase() === 'skills';
      const isSchool = c.name.toLowerCase().startsWith('class');

      let href = `/class/${encodeURIComponent(c.name)}`;
      let cat: SearchCategory = 'courses';
      let badge = 'Course';
      let badgeVariant: SearchResultItem['badgeVariant'] = 'purple';

      if (isSchool) {
        href = `/class/${encodeURIComponent(c.name)}`;
        cat = 'curriculum';
        badge = 'School Class';
        badgeVariant = 'primary';
      } else if (isExam) {
        const examParam = c.name.toLowerCase() === 'jee' ? 'jee-main' : c.name.toLowerCase();
        href = `/exams?exam=${examParam}`;
        cat = 'exams';
        badge = 'Exam Pathway';
        badgeVariant = 'danger';
      } else if (isSkills) {
        href = '/skills';
        cat = 'courses';
        badge = 'Skill Course';
        badgeVariant = 'warning';
      }

      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: c.name,
          description: c.caption || `Complete syllabus, study resources, and learning hub for ${c.name}`,
          keywords: [c.name, 'curriculum', 'pathway', 'course'],
          className: isSchool ? c.name : undefined,
          type: 'course',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 15) {
        candidateResults.push({
          id: `course-${c.id}`,
          title: c.name,
          subtitle: isSchool ? `NBSE ${c.name} Comprehensive Curriculum` : `Educational Pathway • ${c.name}`,
          description: c.caption || `Access structured notes, previous year papers, and video lectures for ${c.name}.`,
          type: 'course',
          category: cat,
          href,
          badge,
          badgeVariant,
          className: isSchool ? c.name : undefined,
          score: score + (isSchool && detectedClass === c.name ? 30 : 15),
          matchedTerms,
        });
      }
    }

    // --- B. Process Premium Items (Courses & Modules) ---
    for (const item of premiumItems) {
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: item.title,
          description: item.description,
          className: item.className || undefined,
          keywords: [item.type, ...(item.features ? item.features.split('|') : [])],
          type: 'course',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 15) {
        candidateResults.push({
          id: `premium-${item.id}`,
          title: item.title,
          subtitle: `${item.type} • ${item.price === 0 ? 'Free' : `₹${item.price}`}`,
          description: item.description,
          type: 'course',
          category: 'courses',
          href: `/premium/${item.id}`,
          badge: item.price === 0 ? 'Free Course' : `₹${item.price}`,
          badgeVariant: item.price === 0 ? 'success' : 'purple',
          className: item.className || undefined,
          price: item.price,
          originalPrice: item.originalPrice || undefined,
          score: score + 20,
          matchedTerms,
        });
      }
    }

    // --- C. Process Subjects ---
    for (const s of subjects) {
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: s.name,
          subtitle: 'Academic Subject',
          description: `Study materials, notes, and previous year papers for ${s.name}`,
          subject: s.name,
          type: 'subject',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        const destClass = detectedClass || 'Class 10';
        candidateResults.push({
          id: `subject-${s.id}`,
          title: s.name,
          subtitle: `Subject • NBSE Curriculum`,
          description: `All chapter notes, board question papers, and video lessons for ${s.name}.`,
          type: 'subject',
          category: 'curriculum',
          href: `/school?subject=${encodeURIComponent(s.name)}&class=${encodeURIComponent(destClass)}`,
          badge: 'Subject',
          badgeVariant: 'primary',
          subject: s.name,
          score: score + 10,
          matchedTerms,
        });
      }
    }

    // --- D. Process Chapters ---
    for (const ch of chapters) {
      const normClass = normalizeClassName(ch.className);
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: ch.name,
          subtitle: `${normClass} • ${ch.subject.name}`,
          description: `Chapter notes, questions, and learning resources for ${ch.name}`,
          className: normClass,
          subject: ch.subject.name,
          chapter: ch.name,
          type: 'chapter',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        candidateResults.push({
          id: `chapter-${ch.id}`,
          title: ch.name,
          subtitle: `${normClass} • ${ch.subject.name}`,
          description: `Explore chapter notes, video lectures, and practice problems for ${ch.name}.`,
          type: 'chapter',
          category: 'curriculum',
          href: `/school?class=${encodeURIComponent(normClass)}&subject=${encodeURIComponent(ch.subject.name)}`,
          badge: 'Chapter',
          badgeVariant: 'success',
          className: normClass,
          subject: ch.subject.name,
          chapter: ch.name,
          score: score + 25, // boost specific chapter matching
          matchedTerms,
        });
      }
    }

    // --- E. Process Notes ---
    for (const n of notes) {
      const normClass = normalizeClassName(n.className);
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: n.title,
          className: normClass,
          subject: n.subject?.name,
          chapter: n.chapter?.name,
          type: 'note',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        const viewLink = getViewLink(n.viewUrl);
        candidateResults.push({
          id: `note-${n.id}`,
          title: n.title,
          subtitle: `${normClass} • ${n.subject?.name || 'General'}${n.chapter ? ` • ${n.chapter.name}` : ''}`,
          description: `Verified study notes with clear definitions, diagrams, and revision highlights.`,
          type: 'note',
          category: 'resources',
          href: viewLink || `/notes?class=${encodeURIComponent(normClass)}`,
          badge: 'Study Note',
          badgeVariant: 'primary',
          className: normClass,
          subject: n.subject?.name,
          chapter: n.chapter?.name,
          viewUrl: n.viewUrl,
          downloadUrl: n.downloadFile,
          score: score + 15,
          matchedTerms,
        });
      }
    }

    // --- F. Process Question Papers ---
    for (const p of papers) {
      const normClass = normalizeClassName(p.className);
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: p.title,
          className: normClass,
          subject: p.subject?.name,
          chapter: p.chapter?.name,
          keywords: [p.year?.year || '', 'pyq', 'question paper', 'board paper'],
          type: 'paper',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        const viewLink = getViewLink(p.viewUrl);
        candidateResults.push({
          id: `paper-${p.id}`,
          title: p.title,
          subtitle: `${normClass} • ${p.subject?.name || 'General'}${p.year ? ` • ${p.year.year}` : ''}`,
          description: `Official past board question paper with full markings scheme and PDF view.`,
          type: 'paper',
          category: 'resources',
          href: viewLink || `/papers?class=${encodeURIComponent(normClass)}`,
          badge: p.year?.year ? `${p.year.year} Paper` : 'Question Paper',
          badgeVariant: 'primary',
          className: normClass,
          subject: p.subject?.name,
          chapter: p.chapter?.name,
          year: p.year?.year,
          viewUrl: p.viewUrl,
          downloadUrl: p.downloadFile,
          score: score + 18,
          matchedTerms,
        });
      }
    }

    // --- G. Process Video Lectures ---
    for (const v of videos) {
      const normCat = normalizeClassName(v.category);
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: v.title,
          className: normCat,
          subject: v.subject?.name,
          chapter: v.chapter?.name,
          type: 'video',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        candidateResults.push({
          id: `video-${v.id}`,
          title: v.title,
          subtitle: `${normCat} • ${v.subject?.name || 'Video Lecture'}${v.chapter ? ` • ${v.chapter.name}` : ''}`,
          description: `High-definition video lecture covering concepts, problem-solving, and explanations.`,
          type: 'video',
          category: 'videos_quizzes',
          href: `/videos?class=${encodeURIComponent(normCat)}`,
          badge: 'Video Lesson',
          badgeVariant: 'secondary',
          className: normCat,
          subject: v.subject?.name,
          chapter: v.chapter?.name,
          score: score + 10,
          matchedTerms,
        });
      }
    }

    // --- H. Process Quizzes ---
    for (const q of quizzes) {
      const normClass = normalizeClassName(q.className);
      const qCount = q.questions?.length || 0;
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: q.title,
          className: normClass,
          subject: q.subject?.name,
          chapter: q.chapter?.name,
          keywords: ['quiz', 'test', 'mcq', 'practice', `${qCount} questions`],
          type: 'quiz',
        },
        cleanQuery,
        tokens,
        detectedClass
      );

      if (score > 20) {
        candidateResults.push({
          id: `quiz-${q.id}`,
          title: q.title,
          subtitle: `${normClass} • ${q.subject?.name || 'General'} • ${qCount} Questions`,
          description: `Interactive MCQ practice test with real-time scoring and instant step solutions.`,
          type: 'quiz',
          category: 'videos_quizzes',
          href: `/quiz`,
          badge: 'Practice Quiz',
          badgeVariant: 'success',
          className: normClass,
          subject: q.subject?.name,
          chapter: q.chapter?.name,
          score: score + 12,
          matchedTerms,
        });
      }
    }

    // --- I. Process Platform Pages, Tools & FAQs ---
    const staticResults = searchPlatformPagesAndFaqs(cleanQuery, tokens, detectedClass);
    candidateResults.push(...staticResults);

    // --- J. De-duplicate and Sort ---
    // Deduplicate by href or id
    const seenHrefs = new Set<string>();
    const deduplicated: SearchResultItem[] = [];

    // Sort initially by score descending
    candidateResults.sort((a, b) => b.score - a.score);

    for (const item of candidateResults) {
      // Use clean href without tracking hash as unique key, or item.id
      const key = `${item.type}:${item.href}`;
      if (!seenHrefs.has(key)) {
        seenHrefs.add(key);
        deduplicated.push(item);
      }
    }

    // Calculate category counts across all matched items
    const categoryCounts: Record<SearchCategory, number> = {
      all: deduplicated.length,
      courses: 0,
      resources: 0,
      curriculum: 0,
      videos_quizzes: 0,
      exams: 0,
      pages: 0,
    };

    for (const item of deduplicated) {
      if (categoryCounts[item.category] !== undefined) {
        categoryCounts[item.category]++;
      }
    }

    // Filter by selected category if not 'all'
    let filteredResults = deduplicated;
    if (selectedCategory !== 'all') {
      filteredResults = deduplicated.filter((item) => item.category === selectedCategory);
    }

    // Slice to limit
    const finalResults = filteredResults.slice(0, limit);

    return NextResponse.json<SearchResponse>({
      query: cleanQuery,
      category: selectedCategory,
      totalCount: filteredResults.length,
      results: finalResults,
      categoryCounts,
    });
  } catch (error) {
    logger.error('Universal Search API failure:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute universal search query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
