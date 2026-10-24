import { normalizeClassName } from '@/lib/classNormalizer';
import { FAQS } from '@/data/faqs';

export type SearchCategory =
  | 'all'
  | 'courses'
  | 'resources' // Notes, Question Papers
  | 'curriculum' // Chapters, Subjects, Class Hubs
  | 'videos_quizzes' // Video Lectures, Quizzes
  | 'exams' // JEE, NEET, CUET
  | 'pages'; // Platform sections, Tools, FAQs

export type ContentType =
  | 'course'
  | 'note'
  | 'paper'
  | 'video'
  | 'quiz'
  | 'chapter'
  | 'subject'
  | 'class'
  | 'exam'
  | 'tool'
  | 'page'
  | 'faq';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: ContentType;
  category: SearchCategory;
  href: string;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'default';
  className?: string;
  subject?: string;
  chapter?: string;
  year?: string;
  price?: number;
  originalPrice?: number;
  score: number;
  viewUrl?: string;
  downloadUrl?: string;
  matchedTerms?: string[];
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  category: SearchCategory;
  totalCount: number;
  results: SearchResultItem[];
  categoryCounts: Record<SearchCategory, number>;
}

// Static registry of competitive exams
export interface ExamDefinition {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  conductingBody: string;
  subjects: string[];
  href: string;
  desc: string;
}

export const EXAMS_REGISTRY: ExamDefinition[] = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    shortName: 'JEE Main',
    fullName: 'Joint Entrance Examination (Main)',
    conductingBody: 'National Testing Agency (NTA)',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    href: '/exams?exam=jee-main',
    desc: 'National engineering entrance gateway for admission to NITs, IIITs, and qualifying test for JEE Advanced.',
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    shortName: 'JEE Adv',
    fullName: 'Joint Entrance Examination (Advanced)',
    conductingBody: 'IIT Consortium',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    href: '/exams?exam=jee-advanced',
    desc: 'Benchmark entrance test for admission to the 23 Indian Institutes of Technology (IITs).',
  },
  {
    id: 'neet-ug',
    name: 'NEET UG',
    shortName: 'NEET UG',
    fullName: 'National Eligibility cum Entrance Test (Undergraduate)',
    conductingBody: 'National Testing Agency (NTA)',
    subjects: ['Physics', 'Chemistry', 'Biology (Botany & Zoology)'],
    href: '/exams?exam=neet-ug',
    desc: 'Unified national entrance test for MBBS, BDS, and AYUSH medical admissions across India.',
  },
  {
    id: 'cuet',
    name: 'CUET UG',
    shortName: 'CUET',
    fullName: 'Common University Entrance Test (UG)',
    conductingBody: 'National Testing Agency (NTA)',
    subjects: ['Languages', 'Domain Subjects', 'General Test'],
    href: '/exams?exam=cuet',
    desc: 'Standardized entrance examination for admission into undergraduate programs at Central and Top Universities.',
  },
];

// Static registry of key platform destinations
export interface PlatformPage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  keywords: string[];
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'default';
}

export const PLATFORM_PAGES: PlatformPage[] = [
  {
    id: 'page-school',
    title: 'School Learning Hub',
    subtitle: 'NBSE Classes 8–12',
    description: 'Complete NBSE curriculum with verified chapter notes, past question papers, and video lessons.',
    href: '/school',
    keywords: ['school', 'nbse', 'class 8', 'class 9', 'class 10', 'class 11', 'class 12', 'curriculum', 'board'],
    badge: 'NBSE',
    badgeVariant: 'primary',
  },
  {
    id: 'page-exams',
    title: 'Competitive Exams Hub',
    subtitle: 'JEE, NEET & CUET Prep',
    description: 'Dedicated national entrance tracks with exam patterns, formula sheets, mock papers, and guides.',
    href: '/exams',
    keywords: ['exams', 'competitive', 'jee', 'neet', 'cuet', 'entrance', 'mock test', 'prep', 'iit', 'medical'],
    badge: 'Prep',
    badgeVariant: 'danger',
  },
  {
    id: 'page-skills',
    title: 'Practical Career Skills',
    subtitle: 'Coding, AI Tools & Web Development',
    description: 'Hands-on tracks covering AI prompt engineering, modern web engineering, and programming basics.',
    href: '/skills',
    keywords: ['skills', 'practical', 'coding', 'programming', 'ai tools', 'chatgpt', 'web development', 'career'],
    badge: 'Career',
    badgeVariant: 'warning',
  },
  {
    id: 'page-ai-tutor',
    title: 'Bounce Back AI Tutor',
    subtitle: '24/7 Smart Academic Doubt Solver',
    description: 'Instant step-by-step mathematical derivations, physics mechanics, chemistry concepts, and doubts.',
    href: '/ai-tutor',
    keywords: ['ai tutor', 'doubt', 'solver', 'ask', 'ai', 'math solver', 'step-by-step', 'homework', 'tutor'],
    badge: 'Free AI',
    badgeVariant: 'success',
  },
  {
    id: 'page-library',
    title: 'Study Library & Universal Catalog',
    subtitle: 'Browse all Notes, Papers & Videos',
    description: 'Filterable archive of all verified study resources across all classes and subjects.',
    href: '/library',
    keywords: ['library', 'catalog', 'all notes', 'all papers', 'all videos', 'browse', 'archive'],
    badge: 'Catalog',
    badgeVariant: 'cyan',
  },
  {
    id: 'page-courses',
    title: 'Learning Pathways & Courses',
    subtitle: 'Explore all learning pathways',
    description: 'Structured educational curriculum paths and premium courses with lifetime access.',
    href: '/courses',
    keywords: ['courses', 'pathways', 'syllabus', 'modules', 'masterclass', 'curriculum'],
    badge: 'Explore',
    badgeVariant: 'purple',
  },
  {
    id: 'page-premium',
    title: 'Premium Store',
    subtitle: 'Paid Notes, Masterclasses & Bundles',
    description: 'Unlock specialized courses, complete syllabus bundles, and downloadable PDF packages.',
    href: '/premium',
    keywords: ['premium', 'store', 'shop', 'paid', 'buy', 'bundles', 'courses', 'price'],
    badge: 'Store',
    badgeVariant: 'purple',
  },
  {
    id: 'page-papers',
    title: 'Question Papers Archive',
    subtitle: 'Past Board & Exam Papers',
    description: 'Official NBSE previous year papers from 2016 to 2025 with PDF download and viewer.',
    href: '/papers',
    keywords: ['papers', 'pyq', 'previous year', 'hslc', 'board exam', 'question paper', 'past papers'],
    badge: 'PYQ',
    badgeVariant: 'primary',
  },
  {
    id: 'page-notes',
    title: 'Study Notes Hub',
    subtitle: 'Structured Chapter Notes',
    description: 'Comprehensive, revision-friendly notes arranged by class and chapter.',
    href: '/notes',
    keywords: ['notes', 'study notes', 'revision', 'formula sheet', 'summary', 'chapters'],
    badge: 'Notes',
    badgeVariant: 'primary',
  },
  {
    id: 'page-videos',
    title: 'Video Lectures Hub',
    subtitle: 'Expert Video Lessons',
    description: 'Topic-wise video explanations, one-shot revision sessions, and visual demonstrations.',
    href: '/videos',
    keywords: ['videos', 'lectures', 'lessons', 'classes', 'one shot', 'youtube', 'explanation'],
    badge: 'Video',
    badgeVariant: 'secondary',
  },
  {
    id: 'page-quiz',
    title: 'Online Quizzes & Assessments',
    subtitle: 'AI-Generated Practice Tests',
    description: 'Test your understanding with timed chapter quizzes and instant answer explanations.',
    href: '/quiz',
    keywords: ['quiz', 'test', 'mcq', 'practice', 'assessment', 'mock', 'questions'],
    badge: 'Practice',
    badgeVariant: 'success',
  },
  {
    id: 'page-forum',
    title: 'Student Discussion Forum',
    subtitle: 'Community Academic Doubts',
    description: 'Ask questions, share study tips, and discuss solutions with fellow students and mentors.',
    href: '/forum',
    keywords: ['forum', 'community', 'discussion', 'questions', 'chat', 'study group'],
    badge: 'Community',
    badgeVariant: 'default',
  },
  {
    id: 'page-announcements',
    title: 'Platform Announcements & News',
    subtitle: 'Latest Board & Academy Updates',
    description: 'Stay updated with timetable releases, exam notices, and new course announcements.',
    href: '/announcements',
    keywords: ['announcements', 'news', 'updates', 'notice', 'timetable', 'exam dates'],
    badge: 'Updates',
    badgeVariant: 'danger',
  },
  {
    id: 'page-favorites',
    title: 'Saved Favourites & Bookmarks',
    subtitle: 'Your Bookmarked Resources',
    description: 'Quickly access notes, papers, and lectures you have saved for revision.',
    href: '/favorites',
    keywords: ['favorites', 'bookmarks', 'saved', 'my list'],
    badge: 'Saved',
    badgeVariant: 'secondary',
  },
  {
    id: 'page-dashboard',
    title: 'Student Dashboard',
    subtitle: 'My Enrolled Courses & Progress',
    description: 'Track course completions, continue watching lessons, and review test performance.',
    href: '/dashboard',
    keywords: ['dashboard', 'my courses', 'enrolled', 'progress', 'student profile'],
    badge: 'Account',
    badgeVariant: 'primary',
  },
  {
    id: 'page-profile',
    title: 'Student Profile & Settings',
    subtitle: 'Manage Account Information',
    description: 'Update your registered class, name, password, and communication preferences.',
    href: '/profile',
    keywords: ['profile', 'settings', 'account', 'password', 'class change'],
    badge: 'Account',
    badgeVariant: 'default',
  },
  {
    id: 'page-cart',
    title: 'Shopping Cart',
    subtitle: 'Course & Material Checkout',
    description: 'Review selected courses, apply discount coupons, and complete enrollment.',
    href: '/cart',
    keywords: ['cart', 'checkout', 'basket', 'order', 'coupons'],
    badge: 'Cart',
    badgeVariant: 'purple',
  },
  {
    id: 'page-contact',
    title: 'Contact Support & Help Desk',
    subtitle: 'Direct Academic & Tech Assistance',
    description: 'Get in touch with the Bounce Back Academy support team for inquiries and technical help.',
    href: '/contact',
    keywords: ['contact', 'help', 'support', 'email', 'phone', 'feedback', 'inquiry'],
    badge: 'Help',
    badgeVariant: 'default',
  },
];

// Popular search suggestions shown when query input is empty
export const POPULAR_SEARCHES = [
  'Class 10 Science',
  'Chemical Reactions',
  'Arithmetic Progression',
  'JEE Main',
  'NEET UG',
  'NBSE HSLC 2025',
  'AI Tutor',
  'Polynomial',
  'Class 12 Physics',
  'ChatGPT Mastery',
];

/**
 * Normalizes search text: removes extra spaces, lowercases, strips trailing punctuation
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\d\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts class intent from search string (e.g. "class 10", "10th", "class-12")
 */
export function extractClassIntent(query: string): string | null {
  const norm = query.toLowerCase();
  const match = norm.match(/(?:class|grade)?\s*(8|9|10|11|12)(?:th|nd|rd|st)?(?:\b|$)/i);
  if (match && match[1]) {
    return `Class ${match[1]}`;
  }
  return null;
}

/**
 * Extracts token words from query for multi-word matching
 */
export function tokenizeQuery(query: string): string[] {
  const norm = normalizeSearchQuery(query);
  if (!norm) return [];
  return norm.split(' ').filter((w) => w.length > 0);
}

/**
 * Calculates a multi-factor relevance ranking score for a candidate item
 */
export function calculateRelevanceScore(
  item: {
    title: string;
    subtitle?: string;
    description?: string;
    className?: string;
    subject?: string;
    chapter?: string;
    keywords?: string[];
    type: ContentType;
  },
  query: string,
  tokens: string[],
  detectedClass: string | null
): { score: number; matchedTerms: string[] } {
  const cleanQ = normalizeSearchQuery(query);
  if (!cleanQ || tokens.length === 0) return { score: 0, matchedTerms: [] };

  let score = 0;
  const matchedTermsSet = new Set<string>();

  const titleLower = (item.title || '').toLowerCase();
  const descLower = (item.description || '').toLowerCase();
  const subLower = (item.subject || '').toLowerCase();
  const chLower = (item.chapter || '').toLowerCase();
  const classLower = (item.className || '').toLowerCase();
  const normItemClass = item.className ? normalizeClassName(item.className) : '';

  // 1. Exact phrase matches
  if (titleLower === cleanQ) {
    score += 150;
    matchedTermsSet.add(cleanQ);
  } else if (titleLower.startsWith(cleanQ)) {
    score += 100;
    matchedTermsSet.add(cleanQ);
  } else if (titleLower.includes(cleanQ)) {
    score += 75;
    matchedTermsSet.add(cleanQ);
  }

  // 2. Class-specific affinity boost (critical for e.g. "class 10 chemical reactions")
  if (detectedClass && normItemClass) {
    if (normItemClass.toLowerCase() === detectedClass.toLowerCase()) {
      score += 60;
      matchedTermsSet.add(detectedClass);
    }
  }

  // 3. Subject & Chapter exact/partial phrase match
  if (chLower && chLower.includes(cleanQ)) {
    score += 70;
    matchedTermsSet.add(cleanQ);
  }
  if (subLower && subLower.includes(cleanQ)) {
    score += 50;
    matchedTermsSet.add(cleanQ);
  }

  // 4. Token-level matching across all fields
  let titleTokensMatched = 0;
  let anyFieldTokensMatched = 0;

  for (const token of tokens) {
    if (token.length < 2 && !/^\d+$/.test(token)) continue;

    let tokenMatched = false;

    if (titleLower.includes(token)) {
      titleTokensMatched++;
      score += 25;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (chLower.includes(token)) {
      score += 20;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (subLower.includes(token)) {
      score += 15;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (classLower.includes(token) || (normItemClass && normItemClass.toLowerCase().includes(token))) {
      score += 15;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (descLower.includes(token)) {
      score += 8;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(token))) {
      score += 12;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    if (tokenMatched) {
      anyFieldTokensMatched++;
    }
  }

  // Bonus if all tokens in query were matched
  if (tokens.length > 1 && anyFieldTokensMatched === tokens.length) {
    score += 40;
  }
  if (tokens.length > 1 && titleTokensMatched === tokens.length) {
    score += 50;
  }

  // Type-specific weights to prioritize canonical learning materials (only if relevant terms matched)
  if (matchedTermsSet.size > 0) {
    switch (item.type) {
      case 'course':
      case 'chapter':
        score += 15;
        break;
      case 'note':
      case 'paper':
        score += 12;
        break;
      case 'exam':
      case 'tool':
        score += 10;
        break;
      case 'video':
      case 'quiz':
        score += 8;
        break;
      default:
        break;
    }
  }

  return { score, matchedTerms: Array.from(matchedTermsSet) };
}

/**
 * Matches platform pages, tools, and FAQ entries against a query
 */
export function searchPlatformPagesAndFaqs(query: string, tokens: string[], detectedClass: string | null): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  // Match platform pages
  for (const page of PLATFORM_PAGES) {
    const { score, matchedTerms } = calculateRelevanceScore(
      {
        title: page.title,
        subtitle: page.subtitle,
        description: page.description,
        keywords: page.keywords,
        type: page.id === 'page-ai-tutor' ? 'tool' : 'page',
      },
      query,
      tokens,
      detectedClass
    );

    if (score > 15) {
      results.push({
        id: page.id,
        title: page.title,
        subtitle: page.subtitle,
        description: page.description,
        type: page.id === 'page-ai-tutor' ? 'tool' : 'page',
        category: 'pages',
        href: page.href,
        badge: page.badge,
        badgeVariant: page.badgeVariant || 'default',
        score,
        matchedTerms,
      });
    }
  }

  // Match competitive exams
  for (const exam of EXAMS_REGISTRY) {
    const { score, matchedTerms } = calculateRelevanceScore(
      {
        title: exam.name,
        subtitle: exam.fullName,
        description: exam.desc,
        keywords: [exam.shortName, exam.fullName, exam.conductingBody, ...exam.subjects],
        type: 'exam',
      },
      query,
      tokens,
      detectedClass
    );

    if (score > 15) {
      results.push({
        id: `exam-${exam.id}`,
        title: exam.name,
        subtitle: `${exam.conductingBody} • ${exam.shortName}`,
        description: exam.desc,
        type: 'exam',
        category: 'exams',
        href: exam.href,
        badge: 'Competitive Exam',
        badgeVariant: 'danger',
        score: score + 20, // boost canonical exams
        matchedTerms,
        metadata: {
          subjects: exam.subjects,
        },
      });
    }
  }

  // Match FAQs
  if (FAQS && Array.isArray(FAQS)) {
    for (const faq of FAQS) {
      const { score, matchedTerms } = calculateRelevanceScore(
        {
          title: faq.q,
          description: faq.a,
          keywords: faq.keywords,
          type: 'faq',
        },
        query,
        tokens,
        detectedClass
      );

      if (score > 25) {
        results.push({
          id: `faq-${faq.id}`,
          title: faq.q,
          subtitle: 'Help & Knowledge Base FAQ',
          description: faq.a,
          type: 'faq',
          category: 'pages',
          href: `/contact#faq`,
          badge: 'FAQ',
          badgeVariant: 'cyan',
          score,
          matchedTerms,
        });
      }
    }
  }

  return results;
}
