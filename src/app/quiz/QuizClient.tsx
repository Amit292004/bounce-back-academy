"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaGraduationCap, FaHourglassHalf, FaPlay, FaCheckCircle, FaTimesCircle, FaTrophy, FaArrowRight, FaRedo, FaRegFileAlt, FaKeyboard, FaEye, FaArrowLeft, FaListOl, FaTimes, FaSearch, FaLayerGroup } from 'react-icons/fa';
import { Sparkles } from 'lucide-react';
import InteractionButtons from '@/components/InteractionButtons';
import styles from './page.module.css';
import { logger } from '@/lib/logger'

interface Question {
  id: string;
  questionText?: string | null;
  imageUrl?: string | null;
  type: string; // "MCQ" or "TEXT"
  options?: string | null;
  answer: string;
  explanation?: string | null;
  timeLimit?: number | null;
}

interface Chapter {
  id: string;
  name: string;
  number: number;
}

interface Quiz {
  id: string;
  title: string;
  className: string;
  subject?: {
    name: string;
  } | null;
  chapter?: Chapter | null;
  questions: Question[];
  createdAt: string;
  likesCount?: number;
  sharesCount?: number;
  favoritesCount?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

function getSubjectColor(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('math'))    return { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' };
  if (n.includes('science')) return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  if (n.includes('english')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (n.includes('social'))  return { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' };
  if (n.includes('hindi'))   return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  if (n.includes('physics')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' };
  if (n.includes('chem'))    return { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
  if (n.includes('bio'))     return { color: '#84cc16', bg: 'rgba(132,204,22,0.1)' };
  return { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' };
}

function stripEmojis(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
    .trim();
}

// Pre-seeded fallback quizzes in case the database is empty
const STATIC_FALLBACK_QUIZZES: Quiz[] = [
  {
    id: 'static-maths-10',
    title: 'Trigonometry & Algebra Essentials',
    className: '10',
    subject: { name: 'Maths' },
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-m-1',
        questionText: 'In a right-angled triangle, if sin θ = 3/5, what is the value of cos θ? (Express in fractional form like a/b)',
        type: 'TEXT',
        answer: '4/5',
        explanation: 'By the Pythagorean identity, sin² θ + cos² θ = 1. Therefore, cos θ = sqrt(1 - (3/5)²) = sqrt(16/25) = 4/5.'
      },
      {
        id: 'q-m-2',
        questionText: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
        type: 'MCQ',
        options: '-8 | 8 | -4 | 16',
        answer: '0',
        explanation: 'The discriminant formula is D = b² - 4ac. Here, D = (-4)² - 4(2)(3) = 16 - 24 = -8. The correct choice is Option A (-8).'
      }
    ]
  },
  {
    id: 'static-science-10',
    title: 'Electricity & Chemical Elements',
    className: '10',
    subject: { name: 'Science' },
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-s-1',
        questionText: 'Which device is used to measure electrical current in a circuit?',
        type: 'MCQ',
        options: 'Ammeter | Voltmeter | Ohm-meter | Galvanometer',
        answer: '0',
        explanation: 'An ammeter is connected in series in a circuit to measure the rate of flow of electric charge (current). Correct choice is Option A.'
      },
      {
        id: 'q-s-2',
        questionText: 'What is the chemical formula of common rust?',
        type: 'TEXT',
        answer: 'Fe2O3',
        explanation: 'Rust is hydrated iron(III) oxide, represented by the formula Fe2O3.'
      }
    ]
  }
];

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<'dashboard' | 'playing' | 'summary'>('dashboard');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Interactive Play states
  const [typedAnswer, setTypedAnswer] = useState('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [isAnswerValidated, setIsAnswerValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [score, setScore] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'chapter-wise' | 'board-mocks'>('chapter-wise');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; name: string; number: number; className: string; subjectId: string }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cachedMe = sessionStorage.getItem('bb_student_me');
        if (cachedMe) {
          const data = JSON.parse(cachedMe);
          setIsAuthenticated(data.authenticated);
        }
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('bb_student_me', JSON.stringify(data));
          setIsAuthenticated(data.authenticated);
        }
      } catch {
        // silent
      }
    })();
  }, []);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question for text input
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchClasses();
    fetchMeta();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) setCourses(await res.json());
    } catch (err) {
      logger.error('Failed to load courses:', err);
    }
  };

  const fetchMeta = async () => {
    try {
      const [subRes, chapRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/chapters'),
      ]);
      if (subRes.ok) setSubjects(await subRes.json());
      if (chapRes.ok) setChapters(await chapRes.json());
    } catch (err) {
      logger.error('Failed to load subjects/chapters:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setQuizzes(data);
        } else {
          setQuizzes(STATIC_FALLBACK_QUIZZES);
        }
      } else {
        setQuizzes(STATIC_FALLBACK_QUIZZES);
      }
    } catch (err) {
      logger.error('Failed to load quizzes:', err);
      setQuizzes(STATIC_FALLBACK_QUIZZES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizState === 'playing' && selectedQuiz && selectedQuiz.questions[currentQuestionIdx]) {
      const qDuration = selectedQuiz.questions[currentQuestionIdx].timeLimit || 30;
      setTimeLeft(qDuration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, currentQuestionIdx, selectedQuiz]);

  const handleTimeOut = () => {
    setIsCorrect(false);
    setIsAnswerValidated(true);
    setWrongAnswersCount((prev) => prev + 1);
  };

  const startQuiz = (quiz: Quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      alert('This quiz has no questions yet. Please check back later!');
      return;
    }
    setSelectedQuiz(quiz);
    setCurrentQuestionIdx(0);
    setScore(0);
    setWrongAnswersCount(0);
    setTypedAnswer('');
    setSelectedMcqOption(null);
    setIsAnswerValidated(false);
    setIsCorrect(false);
    setQuizState('playing');
  };

  const validateAnswer = () => {
    if (isAnswerValidated) return;
    
    const question = selectedQuiz!.questions[currentQuestionIdx];
    const isMCQ = question.type === 'MCQ';

    if (isMCQ) {
      if (selectedMcqOption === null) return;
      
      // Stop the timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      const correctIdx = parseInt(question.answer);
      const matches = selectedMcqOption === correctIdx;
      
      setIsCorrect(matches);
      setIsAnswerValidated(true);
      
      if (matches) {
        setScore((prev) => prev + 1);
      } else {
        setWrongAnswersCount((prev) => prev + 1);
      }
    } else {
      if (!typedAnswer.trim()) return;
      
      // Stop the timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      const studentAns = typedAnswer.trim().toLowerCase();
      const correctAns = question.answer.trim().toLowerCase();
      
      const matches = studentAns === correctAns;
      setIsCorrect(matches);
      setIsAnswerValidated(true);
      
      if (matches) {
        setScore((prev) => prev + 1);
      } else {
        setWrongAnswersCount((prev) => prev + 1);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx + 1 < selectedQuiz!.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setTypedAnswer('');
      setSelectedMcqOption(null);
      setIsAnswerValidated(false);
      setIsCorrect(false);
    } else {
      // Calculate XP
      const calculatedXp = score * 50;
      setEarnedXp(calculatedXp);

      // Persist quiz performance in localStorage for dashboard tracking
      try {
        if (typeof window !== 'undefined' && selectedQuiz) {
          const attempt = {
            id: selectedQuiz.id + '_' + Date.now(),
            quizId: selectedQuiz.id,
            title: stripEmojis(selectedQuiz.title) || 'Practice Assessment',
            className: selectedQuiz.className,
            subject: selectedQuiz.subject?.name || 'General',
            score,
            total: selectedQuiz.questions.length,
            percentage: Math.round((score / selectedQuiz.questions.length) * 100),
            xp: calculatedXp,
            completedAt: new Date().toISOString(),
          };
          const rawHistory = localStorage.getItem('bba_quiz_history');
          const history = rawHistory ? JSON.parse(rawHistory) : [];
          const sanitizedHistory = Array.isArray(history)
            ? history.map((h: any) => ({ ...h, title: stripEmojis(h.title) || 'Practice Assessment' }))
            : [];
          const updated = [attempt, ...sanitizedHistory.filter((h: any) => h.quizId !== attempt.quizId)].slice(0, 15);
          localStorage.setItem('bba_quiz_history', JSON.stringify(updated));
        }
      } catch (err) {
        logger.error('Failed to save quiz attempt history:', err);
      }

      setQuizState('summary');
    }
  };

  const restartQuiz = () => {
    startQuiz(selectedQuiz!);
  };

  const BOARD_MOCKS = [
    {
      id: 'mock-maths-10',
      title: 'NBSE Class 10 Mathematics Complete Model Board Mock 2026',
      className: '10',
      subject: { name: 'Mathematics' },
      questionsCount: 30,
      time: '3 Hours',
      year: '2026',
      href: '/papers?subject=Mathematics',
    },
    {
      id: 'mock-science-10',
      title: 'NBSE Class 10 Science Full Syllabus Blueprint Mock 2026',
      className: '10',
      subject: { name: 'Science' },
      questionsCount: 30,
      time: '3 Hours',
      year: '2026',
      href: '/papers?subject=Science',
    },
    {
      id: 'mock-social-10',
      title: 'NBSE Class 10 Social Science Board Standard Mock 2026',
      className: '10',
      subject: { name: 'Social Science' },
      questionsCount: 28,
      time: '3 Hours',
      year: '2026',
      href: '/papers?subject=Social+Science',
    },
    {
      id: 'mock-english-10',
      title: 'NBSE Class 10 English Language & Literature Mock Paper 2026',
      className: '10',
      subject: { name: 'English' },
      questionsCount: 25,
      time: '3 Hours',
      year: '2026',
      href: '/papers?subject=English',
    },
  ];

  const filteredQuizzes = quizzes.filter(q => {
    const normalize = (name: string) => name.toLowerCase().replace('class', '').trim();
    const matchesClass = selectedClassFilter === 'all' || normalize(q.className) === normalize(selectedClassFilter);
    const matchesSubject = !selectedSubjectFilter || q.subject?.name === selectedSubjectFilter;
    const matchesChapter = !selectedChapterFilter || q.chapter?.id === selectedChapterFilter;
    const qText = search.trim().toLowerCase();
    const matchesSearch = !qText || 
      q.title.toLowerCase().includes(qText) || 
      (q.subject?.name && q.subject.name.toLowerCase().includes(qText)) ||
      (q.chapter?.name && q.chapter.name.toLowerCase().includes(qText));
    return matchesClass && matchesSubject && matchesChapter && matchesSearch;
  });

  const filteredMocks = BOARD_MOCKS.filter((m) => {
    const normalize = (name: string) => name.toLowerCase().replace('class', '').trim();
    const matchesClass = selectedClassFilter === 'all' || normalize(m.className) === normalize(selectedClassFilter);
    const matchesSubject = !selectedSubjectFilter || m.subject.name.toLowerCase().includes(selectedSubjectFilter.toLowerCase());
    const qText = search.trim().toLowerCase();
    const matchesSearch = !qText || m.title.toLowerCase().includes(qText) || m.subject.name.toLowerCase().includes(qText);
    return matchesClass && matchesSubject && matchesSearch;
  });

  const selectedSubjectId = subjects.find(s => s.name === selectedSubjectFilter)?.id;
  const filteredChapterOptions = chapters.filter(ch =>
    (selectedClassFilter !== 'all' ? ch.className === selectedClassFilter : true) &&
    (selectedSubjectId ? ch.subjectId === selectedSubjectId : true)
  );

  const hasFilters = search.trim() !== '' || selectedClassFilter !== 'all' || !!selectedSubjectFilter || !!selectedChapterFilter;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading dynamic quiz modules...</p>
      </div>
    );
  }

  const currentQuestion = selectedQuiz?.questions[currentQuestionIdx];
  const isMCQ = currentQuestion?.type === 'MCQ';
  const optionsList = (isMCQ && currentQuestion?.options) ? currentQuestion.options.split('|').map(o => o.trim()) : [];

  return (
    <div className={styles.container}>
      {/* 1. QUIZ DASHBOARD VIEW */}
      {quizState === 'dashboard' && (
        <div>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>NBSE Board Quizzes</span>
            </div>
            <h1 className={styles.title}>Practice Quizzes</h1>
            <p className={styles.subtitle}>
              Official NBSE past board examination papers and chapter practice tests from 2016 onwards. Free online interactive challenges and instant evaluations.
            </p>
          </div>

          {/* Mode Toggle + Search Toolbar */}
          <div className={styles.toolbar}>
            {/* Mode Toggle */}
            <div className={styles.segmentedControl} role="tablist" aria-label="Quiz grouping mode">
              <button
                role="tab"
                aria-selected={mode === 'chapter-wise'}
                onClick={() => setMode('chapter-wise')}
                className={`${styles.segmentedBtn} ${mode === 'chapter-wise' ? styles.segmentedBtnActive : ''}`}
              >
                <FaLayerGroup size={13} />
                <span>Chapter Quizzes</span>
              </button>
              <button
                role="tab"
                aria-selected={mode === 'board-mocks'}
                onClick={() => setMode('board-mocks')}
                className={`${styles.segmentedBtn} ${mode === 'board-mocks' ? styles.segmentedBtnActive : ''}`}
              >
                <FaRegFileAlt size={13} />
                <span>Board Mocks</span>
              </button>
            </div>

            {/* Search Input */}
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by title, subject or chapter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                aria-label="Search quizzes"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className={styles.searchClear}
                  aria-label="Clear search"
                >
                  <FaTimes size={13} />
                </button>
              )}
            </div>
          </div>

          {/* SaaS Filter Bar */}
          <div className={styles.filterBarWrapper}>
            <div className={styles.filterBar}>
              {/* Filter icon */}
              <div className={styles.filterBarIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </div>

              {/* Class */}
              <div className={styles.filterBarSegment}>
                <span className={styles.filterBarLabel}>Class</span>
                <select
                  value={selectedClassFilter}
                  onChange={e => {
                    setSelectedClassFilter(e.target.value);
                    setSelectedSubjectFilter('');
                    setSelectedChapterFilter('');
                  }}
                  className={styles.filterBarSelect}
                >
                  <option value="all">All Classes</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className={styles.filterBarSegment}>
                <span className={styles.filterBarLabel}>Subject</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={e => {
                    setSelectedSubjectFilter(e.target.value);
                    setSelectedChapterFilter('');
                  }}
                  className={styles.filterBarSelect}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div className={styles.filterBarSegment}>
                <span className={styles.filterBarLabel}>Chapter</span>
                <select
                  value={selectedChapterFilter}
                  onChange={e => setSelectedChapterFilter(e.target.value)}
                  className={styles.filterBarSelect}
                  disabled={mode === 'board-mocks' || (!selectedSubjectFilter && selectedClassFilter === 'all')}
                >
                  <option value="">All Chapters</option>
                  {filteredChapterOptions.map((ch) => (
                    <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.name}</option>
                  ))}
                </select>
              </div>

              {/* Clear — only when filters active */}
              {hasFilters && (
                <button
                  className={styles.clearSegment}
                  onClick={() => {
                    setSearch('');
                    setSelectedClassFilter('all');
                    setSelectedSubjectFilter('');
                    setSelectedChapterFilter('');
                  }}
                >
                  <FaTimes size={10} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Results Count Bar */}
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {mode === 'chapter-wise' ? (
                <>
                  {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} available
                  {search ? ` matching "${search}"` : ''}
                </>
              ) : (
                <>
                  {filteredMocks.length} mock paper{filteredMocks.length !== 1 ? 's' : ''} available
                  {search ? ` matching "${search}"` : ''}
                </>
              )}
            </span>
          </div>

          {/* Featured Cards Grid */}
          <div className={styles.quizGrid}>
            {mode === 'chapter-wise' ? (
              <>
                {filteredQuizzes.map((quiz) => {
                  const { color, bg } = getSubjectColor(quiz.subject?.name || '');
                  const displayClass = quiz.className.toLowerCase().includes('class') || ['cuet', 'jee', 'neet'].includes(quiz.className.toLowerCase())
                    ? quiz.className
                    : `Class ${quiz.className}`;
                  const isChapterRedundant = !quiz.chapter?.name || quiz.title.toLowerCase().includes(quiz.chapter.name.toLowerCase());

                  return (
                    <div key={quiz.id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div
                          className={styles.cardIconBox}
                          style={{
                            color,
                            background: bg,
                            borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                          }}
                        >
                          <Sparkles size={16} />
                        </div>

                        <div className={styles.cardBadges}>
                          <span className={styles.cardBadge}>{displayClass}</span>
                          <span className={styles.cardBadge} style={{ color }}>{quiz.subject?.name || 'General'}</span>
                          {quiz.chapter && (
                            <span className={styles.cardBadge}>Ch {quiz.chapter.number}</span>
                          )}
                        </div>

                        <div className={styles.cardYearBadge}>
                          {quiz.questions.length} Qs
                        </div>
                      </div>

                      <h3 className={styles.cardTitle} title={quiz.title}>
                        {quiz.title}
                      </h3>
                      <p className={styles.cardMeta}>
                        {!isChapterRedundant && quiz.chapter?.name
                          ? `${quiz.chapter.name} • Practice MCQs & Explanations`
                          : 'Official NBSE Curriculum • Chapter Practice MCQs'}
                      </p>

                      <div className={styles.cardDivider} />

                      <div className={styles.cardFooter}>
                        <div className={styles.cardInteractions}>
                          <InteractionButtons
                            targetId={quiz.id}
                            targetType="QUIZ"
                            initialLikes={quiz.likesCount || 0}
                            initialShares={quiz.sharesCount || 0}
                            initialFavorites={quiz.favoritesCount || 0}
                            isLiked={quiz.isLiked}
                            isFavorited={quiz.isFavorited}
                            isAuthenticated={isAuthenticated}
                          />
                        </div>

                        <div className={styles.cardActions}>
                          <button
                            onClick={() => startQuiz(quiz)}
                            className={styles.btnView}
                            aria-label={`Preview ${quiz.title}`}
                          >
                            <FaEye size={13} /> View
                          </button>
                          <button
                            onClick={() => startQuiz(quiz)}
                            className={styles.btnDownload}
                            aria-label={`Start Quiz ${quiz.title}`}
                          >
                            <FaPlay size={10} fill="currentColor" /> Start Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredQuizzes.length === 0 && (
                  <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem', opacity: 0.6 }}>
                      <Sparkles size={36} />
                    </div>
                    <h3 className={styles.emptyStateTitle}>No quizzes found</h3>
                    <p className={styles.emptyStateText}>
                      {search
                        ? `No quizzes match "${search}". Try a different keyword or reset your filters.`
                        : 'No quizzes available for the selected filters. Check back soon for new questions!'}
                    </p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedClassFilter('all');
                        setSelectedSubjectFilter('');
                        setSelectedChapterFilter('');
                      }}
                      className={styles.btnDownload}
                      style={{ width: 'auto', padding: '0 1.25rem', margin: '0 auto' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredMocks.map((mock) => {
                  const { color, bg } = getSubjectColor(mock.subject.name);
                  const displayClass = `Class ${mock.className}`;

                  return (
                    <div key={mock.id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div
                          className={styles.cardIconBox}
                          style={{
                            color,
                            background: bg,
                            borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                          }}
                        >
                          <FaRegFileAlt size={16} />
                        </div>

                        <div className={styles.cardBadges}>
                          <span className={styles.cardBadge}>{displayClass}</span>
                          <span className={styles.cardBadge} style={{ color }}>{mock.subject.name}</span>
                        </div>

                        <div className={styles.cardYearBadge}>
                          {mock.year}
                        </div>
                      </div>

                      <h3 className={styles.cardTitle} title={mock.title}>
                        {mock.title}
                      </h3>
                      <p className={styles.cardMeta}>
                        Official NBSE Model Blueprint • {mock.questionsCount} Questions • {mock.time}
                      </p>

                      <div className={styles.cardDivider} />

                      <div className={styles.cardFooter}>
                        <div className={styles.cardInteractions}>
                          <InteractionButtons
                            targetId={mock.id}
                            targetType="QUIZ"
                            initialLikes={12}
                            initialShares={4}
                            initialFavorites={8}
                            isLiked={false}
                            isFavorited={false}
                            isAuthenticated={isAuthenticated}
                          />
                        </div>

                        <div className={styles.cardActions}>
                          <Link
                            href={mock.href}
                            className={styles.btnView}
                            aria-label={`View ${mock.title}`}
                          >
                            <FaEye size={13} /> View
                          </Link>
                          <Link
                            href={mock.href}
                            className={styles.btnDownload}
                            aria-label={`Start ${mock.title}`}
                          >
                            <FaPlay size={10} fill="currentColor" /> Start Paper
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredMocks.length === 0 && (
                  <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem', opacity: 0.6 }}>
                      <FaRegFileAlt size={36} />
                    </div>
                    <h3 className={styles.emptyStateTitle}>No mock papers found</h3>
                    <p className={styles.emptyStateText}>
                      {search
                        ? `No mock papers match "${search}". Try a different keyword or reset filters.`
                        : 'No mock papers available for the selected filters.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedClassFilter('all');
                        setSelectedSubjectFilter('');
                        setSelectedChapterFilter('');
                      }}
                      className={styles.btnDownload}
                      style={{ width: 'auto', padding: '0 1.25rem', margin: '0 auto' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. LIVE INTERACTIVE PLAY MODULE */}
      {quizState === 'playing' && selectedQuiz && currentQuestion && (
        <div className={styles.quizContainer}>
          <div className={styles.quizPanelHeader}>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to exit? Progress will be lost.')) {
                  setQuizState('dashboard');
                }
              }} 
              className={styles.exitBtn}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FaArrowLeft /> Exit
            </button>
            <div className={styles.timerPill} style={{ borderColor: timeLeft <= 5 ? '#ff4040' : 'var(--surface-border)' }}>
              <FaHourglassHalf style={{ color: timeLeft <= 5 ? '#ff4040' : 'var(--primary)' }} />
              <span style={{ color: timeLeft <= 5 ? '#ff4040' : 'var(--foreground)' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressBox}>
            <div className={styles.progressText}>
              <span>Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${((currentQuestionIdx + 1) / selectedQuiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamic Question Card */}
          <div className={`glass-panel ${styles.questionCard}`}>
            
            <div style={{ marginBottom: '1rem', display: 'flex' }}>
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: isMCQ ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: isMCQ ? 'var(--primary)' : '#f59e0b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                {isMCQ ? 'Selectable MCQ' : 'Text Input Match'}
              </span>
            </div>

            {/* 1. Question Text */}
            {currentQuestion.questionText && (
              <h2 className={styles.questionText} style={{ marginBottom: currentQuestion.imageUrl ? '1.5rem' : '2.5rem' }}>
                {currentQuestion.questionText}
              </h2>
            )}

            {/* 2. Question Image Form */}
            {currentQuestion.imageUrl && (
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'center', marginBottom: '2rem', border: '1px solid var(--surface-border)' }}>
                <img 
                  src={currentQuestion.imageUrl!} 
                  alt="Question Diagram" 
                  style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px' }} 
                />
              </div>
            )}

            {/* 3. Render playing inputs based on type */}
            {isMCQ ? (
              /* MCQ Choices Buttons Grid */
              <div className={styles.optionsGrid}>
                {optionsList.map((option, idx) => {
                  const isSelected = selectedMcqOption === idx;
                  const correctIdx = parseInt(currentQuestion.answer);
                  const isCorrectChoice = idx === correctIdx;
                  const isWrongChoice = isSelected && !isCorrectChoice;

                  let optionClass = styles.optionItem;
                  if (isSelected) optionClass += ` ${styles.optionSelected}`;
                  if (isAnswerValidated) {
                    if (isCorrectChoice) optionClass += ` ${styles.optionCorrect}`;
                    if (isWrongChoice) optionClass += ` ${styles.optionWrong}`;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isAnswerValidated) return;
                        setSelectedMcqOption(idx);
                      }}
                      disabled={isAnswerValidated}
                      className={optionClass}
                    >
                      <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <span className={styles.optionContent}>{option}</span>
                      {isAnswerValidated && isCorrectChoice && <FaCheckCircle className={styles.correctIcon} />}
                      {isAnswerValidated && isWrongChoice && <FaTimesCircle className={styles.wrongIcon} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Text Input form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaKeyboard /> Enter Your Answer:
                </label>
                
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    disabled={isAnswerValidated}
                    placeholder={isAnswerValidated ? '' : "Type your answer here..."}
                    style={{
                      flex: 1,
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: '1.5px solid var(--surface-border)',
                      background: 'var(--surface-highlight)',
                      color: 'var(--foreground)',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    className={
                      isAnswerValidated 
                        ? isCorrect 
                          ? styles.inputCorrect 
                          : styles.inputWrong 
                        : ''
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && typedAnswer.trim() && !isAnswerValidated) {
                        validateAnswer();
                      }
                    }}
                  />
                  
                  {isAnswerValidated && (
                    <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isCorrect ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          <FaCheckCircle /> Correct
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          <FaTimesCircle /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Wrong Answer Recap for Text Inputs */}
            {isAnswerValidated && !isCorrect && !isMCQ && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1.25rem', color: '#ef4444', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaTimesCircle /> Correct Answer was:
                </span>{' '}
                <span style={{ textDecoration: 'underline', color: 'var(--foreground)', marginLeft: '0.25rem' }}>{currentQuestion.answer}</span>
              </div>
            )}

            {/* 5. Short Explanation Slide-in Box */}
            {isAnswerValidated && currentQuestion.explanation && (
              <div className={styles.explanationBox} style={{ marginTop: '2rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaEye /> Explanation
                </h4>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className={styles.actionRow}>
            {isAnswerValidated ? (
              <button onClick={nextQuestion} className={styles.actionBtn}>
                {currentQuestionIdx + 1 === selectedQuiz.questions.length ? 'Show Results' : 'Next Question'} <FaArrowRight />
              </button>
            ) : (
              <button 
                onClick={validateAnswer} 
                disabled={isMCQ ? selectedMcqOption === null : !typedAnswer.trim()} 
                className={`${styles.actionBtn} ${(isMCQ ? selectedMcqOption === null : !typedAnswer.trim()) ? styles.actionDisabled : ''}`}
              >
                Submit Answer
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SCORE SUMMARY / WIN SHEET */}
      {quizState === 'summary' && selectedQuiz && (
        <div className={`glass-panel ${styles.summaryCard}`}>
          <div className={styles.trophyWrapper}>
            <FaTrophy className={styles.trophyIcon} />
          </div>
          <h1 className={styles.summaryTitle}>Quiz Completed!</h1>
          <p className={styles.summarySubtitle}>Excellent attempt in {selectedQuiz.title}!</p>

          <div className={styles.summaryStatsGrid}>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Correct</span>
              <span className={styles.sumValue} style={{ color: '#10b981' }}>{score}</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Wrong</span>
              <span className={styles.sumValue} style={{ color: '#ef4444' }}>{wrongAnswersCount}</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.sumLabel}>Accuracy</span>
              <span className={styles.sumValue} style={{ color: 'var(--primary)' }}>
                {Math.round((score / selectedQuiz.questions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Award message */}
          <div className={styles.xpAwardCard}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
              <FaTrophy /> You Earned
            </h3>
            <div className={styles.xpText}>{earnedXp} XP Points</div>
            <p>Calculated and updated to your profile rankings!</p>
          </div>

          <div className={styles.summaryActions}>
            <button onClick={restartQuiz} className={styles.restartBtn}>
              <FaRedo /> Try Again
            </button>
            <button onClick={() => setQuizState('dashboard')} className={styles.dashboardBtn}>
              Return to Arena
            </button>
            <a href="/dashboard" className={styles.dashboardBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              View Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
