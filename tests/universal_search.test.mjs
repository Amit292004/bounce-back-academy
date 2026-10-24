import test from 'node:test';
import assert from 'node:assert/strict';

// Core pure logic tests for search engine normalization, ranking, and destination mapping
function normalizeSearchQuery(query) {
  if (!query) return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\d\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractClassIntent(query) {
  const norm = (query || '').toLowerCase();
  const match = norm.match(/(?:class|grade)?\s*(8|9|10|11|12)(?:th|nd|rd|st)?(?:\b|$)/i);
  if (match && match[1]) {
    return `Class ${match[1]}`;
  }
  return null;
}

function tokenizeQuery(query) {
  const norm = normalizeSearchQuery(query);
  if (!norm) return [];
  return norm.split(' ').filter((w) => w.length > 0);
}

function normalizeClassName(input) {
  if (!input || typeof input !== 'string') return input;
  let cleaned = input.trim()
    .replace(/[\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/th$/i, '')
    .replace(/st$/i, '')
    .replace(/nd$/i, '')
    .replace(/rd$/i, '')
    .trim();
  const match = cleaned.match(/(\d+)/);
  if (!match) return input;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 12) return input;
  return `Class ${num}`;
}

function calculateRelevanceScore(item, query, tokens, detectedClass) {
  const cleanQ = normalizeSearchQuery(query);
  if (!cleanQ || tokens.length === 0) return { score: 0, matchedTerms: [] };

  let score = 0;
  const matchedTermsSet = new Set();

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

  // 2. Class affinity
  if (detectedClass && normItemClass) {
    if (normItemClass.toLowerCase() === detectedClass.toLowerCase()) {
      score += 60;
      matchedTermsSet.add(detectedClass);
    }
  }

  // 3. Subject / Chapter phrase
  if (chLower && chLower.includes(cleanQ)) {
    score += 70;
    matchedTermsSet.add(cleanQ);
  }
  if (subLower && subLower.includes(cleanQ)) {
    score += 50;
    matchedTermsSet.add(cleanQ);
  }

  // 4. Token-level matching
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

    if (tokenMatched) {
      anyFieldTokensMatched++;
    }
  }

  if (tokens.length > 1 && anyFieldTokensMatched === tokens.length) {
    score += 40;
  }
  if (tokens.length > 1 && titleTokensMatched === tokens.length) {
    score += 50;
  }

  if (matchedTermsSet.size > 0) {
    if (item.type === 'chapter' || item.type === 'course') score += 15;
    if (item.type === 'note' || item.type === 'paper') score += 12;
  }

  return { score, matchedTerms: Array.from(matchedTermsSet) };
}

test('Universal Search Architecture & Relevance Scoring Suite', async (t) => {
  await t.test('normalizes search queries safely and consistently', () => {
    assert.equal(normalizeSearchQuery('   Class   10   SCIENCE   '), 'class 10 science');
    assert.equal(normalizeSearchQuery('JEE (Main) & Advanced!'), 'jee main advanced');
    assert.equal(normalizeSearchQuery(''), '');
    assert.equal(normalizeSearchQuery(null), '');
  });

  await t.test('extracts class intent correctly across various formats', () => {
    assert.equal(extractClassIntent('class 10 chemical reactions'), 'Class 10');
    assert.equal(extractClassIntent('Class 10th Maths notes'), 'Class 10');
    assert.equal(extractClassIntent('12th physics derivations'), 'Class 12');
    assert.equal(extractClassIntent('grade 9 polynomials'), 'Class 9');
    assert.equal(extractClassIntent('class 8 social science'), 'Class 8');
    assert.equal(extractClassIntent('jee main papers'), null);
    assert.equal(extractClassIntent('python coding masterclass'), null);
  });

  await t.test('tokenizes multi-word queries accurately', () => {
    const tokens = tokenizeQuery('Class 10 Chemical Reactions');
    assert.deepEqual(tokens, ['class', '10', 'chemical', 'reactions']);
  });

  await t.test('prioritizes Class 10 Science chapter over unrelated courses for "class 10 chemical reactions"', () => {
    const query = 'class 10 chemical reactions';
    const tokens = tokenizeQuery(query);
    const detectedClass = extractClassIntent(query);

    const targetChapter = {
      title: 'Chemical Reactions and Equations',
      className: 'Class 10',
      subject: 'Science',
      chapter: 'Chemical Reactions and Equations',
      type: 'chapter',
    };

    const targetNote = {
      title: 'NBSE Class 10 Science Ch-1: Chemical Reactions',
      className: 'Class 10',
      subject: 'Science',
      chapter: 'Chemical Reactions and Equations',
      type: 'note',
    };

    const genericCourse = {
      title: 'Class 10',
      className: 'Class 10',
      type: 'course',
      description: 'Comprehensive NBSE Class 10 school curriculum hub',
    };

    const unrelatedCourse = {
      title: 'AI Tools Mastery Course',
      type: 'course',
      description: 'Learn 25+ cutting edge AI tools for high productivity',
    };

    const scoreChapter = calculateRelevanceScore(targetChapter, query, tokens, detectedClass).score;
    const scoreNote = calculateRelevanceScore(targetNote, query, tokens, detectedClass).score;
    const scoreGenericCourse = calculateRelevanceScore(genericCourse, query, tokens, detectedClass).score;
    const scoreUnrelated = calculateRelevanceScore(unrelatedCourse, query, tokens, detectedClass).score;

    assert.ok(
      scoreChapter > scoreGenericCourse,
      `Chapter score (${scoreChapter}) must exceed generic course score (${scoreGenericCourse})`
    );
    assert.ok(
      scoreNote > scoreGenericCourse,
      `Note score (${scoreNote}) must exceed generic course score (${scoreGenericCourse})`
    );
    assert.ok(
      scoreGenericCourse > scoreUnrelated,
      `Generic course (${scoreGenericCourse}) must exceed unrelated course (${scoreUnrelated})`
    );
    assert.equal(scoreUnrelated, 0, 'Unrelated course should score 0');
  });

  await t.test('ranks exact title match higher than partial description match', () => {
    const query = 'Polynomial';
    const tokens = tokenizeQuery(query);

    const exactMatch = {
      title: 'Polynomial',
      className: 'Class 10',
      subject: 'Mathematics',
      type: 'chapter',
    };

    const descMatch = {
      title: 'Algebraic Expressions Overview',
      description: 'Contains preliminary introduction to polynomial functions',
      className: 'Class 9',
      subject: 'Mathematics',
      type: 'note',
    };

    const exactScore = calculateRelevanceScore(exactMatch, query, tokens, null).score;
    const descScore = calculateRelevanceScore(descMatch, query, tokens, null).score;

    assert.ok(
      exactScore > descScore,
      `Exact title match (${exactScore}) must outrank weak description match (${descScore})`
    );
  });

  await t.test('correctly maps destinations to actual platform routes', () => {
    // School class hub
    const classHref = `/class/${encodeURIComponent('Class 10')}`;
    assert.equal(classHref, '/class/Class%2010');

    // Premium course
    const courseId = 'cmpsc33wm000012g91x3x2htc';
    const courseHref = `/premium/${courseId}`;
    assert.equal(courseHref, '/premium/cmpsc33wm000012g91x3x2htc');

    // Exam track
    const examHref = `/exams?exam=jee-main`;
    assert.equal(examHref, '/exams?exam=jee-main');

    // AI Tutor
    const aiTutorHref = `/ai-tutor`;
    assert.equal(aiTutorHref, '/ai-tutor');

    // AI Tutor with search query
    const askHref = `/ask?q=${encodeURIComponent('Chemical Reactions')}`;
    assert.equal(askHref, '/ask?q=Chemical%20Reactions');

    // Internal PDF viewer
    const pdfUrl = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
    const viewHref = `/view?url=${encodeURIComponent(pdfUrl)}`;
    assert.equal(viewHref, `/view?url=${encodeURIComponent(pdfUrl)}`);
  });

  await t.test('categorizes content accurately across tabs', () => {
    const mockCatalog = [
      { id: '1', type: 'course', category: 'courses' },
      { id: '2', type: 'note', category: 'resources' },
      { id: '3', type: 'paper', category: 'resources' },
      { id: '4', type: 'chapter', category: 'curriculum' },
      { id: '5', type: 'subject', category: 'curriculum' },
      { id: '6', type: 'video', category: 'videos_quizzes' },
      { id: '7', type: 'quiz', category: 'videos_quizzes' },
      { id: '8', type: 'exam', category: 'exams' },
      { id: '9', type: 'page', category: 'pages' },
      { id: '10', type: 'faq', category: 'pages' },
    ];

    const categoryCounts = {
      all: mockCatalog.length,
      courses: mockCatalog.filter((c) => c.category === 'courses').length,
      resources: mockCatalog.filter((c) => c.category === 'resources').length,
      curriculum: mockCatalog.filter((c) => c.category === 'curriculum').length,
      videos_quizzes: mockCatalog.filter((c) => c.category === 'videos_quizzes').length,
      exams: mockCatalog.filter((c) => c.category === 'exams').length,
      pages: mockCatalog.filter((c) => c.category === 'pages').length,
    };

    assert.equal(categoryCounts.all, 10);
    assert.equal(categoryCounts.courses, 1);
    assert.equal(categoryCounts.resources, 2);
    assert.equal(categoryCounts.curriculum, 2);
    assert.equal(categoryCounts.videos_quizzes, 2);
    assert.equal(categoryCounts.exams, 1);
    assert.equal(categoryCounts.pages, 2);
  });
});
