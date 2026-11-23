"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Video as VideoIcon,
  Bot,
  Heart,
  ArrowRight,
  Send,
  User,
  Trophy,
  Play,
  Sparkles,
  MessageSquare,
  Bell,
  LifeBuoy,
  Layers,
} from 'lucide-react';
import ClassSwitcherModal from '@/components/layout/ClassSwitcherModal';

interface StudentData {
  authenticated: boolean;
  name?: string;
  email?: string;
  class?: string;
}

function stripEmojis(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
    .trim();
}

export default function DashboardClient() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [localClass, setLocalClass] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('selectedClass');
        if (stored) {
          setLocalClass(stored);
        }
      }
    } catch {}

    const handleClassChange = (e: any) => {
      if (e?.detail) {
        setLocalClass(e.detail);
      } else {
        const stored = localStorage.getItem('selectedClass');
        if (stored) setLocalClass(stored);
      }
    };

    window.addEventListener('classChanged', handleClassChange);
    window.addEventListener('profileUpdated', handleClassChange);

    fetch('/api/student/me')
      .then((res) => res.json())
      .then((data) => {
        setStudent(data);
        setLoading(false);
      })
      .catch(() => {
        setStudent({ authenticated: false });
        setLoading(false);
      });

    // Check quiz history from localStorage
    try {
      if (typeof window !== 'undefined') {
        const rawHistory = localStorage.getItem('bba_quiz_history');
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map((item: any) => ({
              ...item,
              title: stripEmojis(item.title) || 'Practice Assessment',
            }));
            setQuizHistory(sanitized);
            localStorage.setItem('bba_quiz_history', JSON.stringify(sanitized));
          }
        }
      }
    } catch {}

    // Check favorites count
    fetch('/api/interactions/favorites')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((favData) => {
        if (favData) {
          const total =
            (favData.videos?.length || 0) +
            (favData.notes?.length || 0) +
            (favData.papers?.length || 0) +
            (favData.quizzes?.length || 0);
          setFavoritesCount(total);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('classChanged', handleClassChange);
      window.removeEventListener('profileUpdated', handleClassChange);
    };
  }, []);

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    router.push(`/ai-tutor?q=${encodeURIComponent(aiQuestion.trim())}`);
  };

  const selectedClass =
    student?.class && student.class !== 'Not Selected'
      ? student.class
      : mounted
      ? localClass
      : null;

  const displayClassName = selectedClass
    ? selectedClass.toLowerCase().startsWith('class') ||
      ['cuet', 'jee', 'neet', 'skills'].includes(selectedClass.toLowerCase())
      ? selectedClass.toLowerCase() === 'skills'
        ? 'Practical Skills'
        : selectedClass
      : `Class ${selectedClass}`
    : 'Select Your Class';

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Student Learning Workspace</span>
        </div>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              {student?.authenticated
                ? `Welcome back, ${student.name?.split(' ')[0] || 'Learner'}!`
                : 'Welcome to your Learning Space!'}
            </h1>
            <p className={styles.subtitle} suppressHydrationWarning>
              {student?.authenticated
                ? `Enrolled in ${displayClassName}. Track syllabus progress, explore verified notes, and practice past papers.`
                : 'Sign in to sync your study notes, save lecture favorites, and track quiz progress.'}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setShowClassModal(true)}
              className={styles.btnClassSwitch}
            >
              <GraduationCap size={15} />
              <span suppressHydrationWarning>{displayClassName}</span>
              <span className={styles.btnClassSwitchHint}>(Change)</span>
            </button>

            {student?.authenticated ? (
              <Link href="/profile" className={styles.btnActionPrimary}>
                <User size={14} />
                <span>Profile</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.btnActionPrimary}>
                <User size={14} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats & Curriculum Jumps ── */}
      <div className={styles.statsRow}>
        <Link
          href={selectedClass ? `/class/${encodeURIComponent(selectedClass)}` : '/#classes'}
          className={styles.statCard}
        >
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <GraduationCap size={18} />
            </div>
            <span className={styles.statBadge}>Curriculum</span>
          </div>
          <div className={styles.statValue} suppressHydrationWarning>{displayClassName}</div>
          <div className={styles.statLabel}>Active Class Hub</div>
          <div className={styles.statAction}>
            <span>Open Hub</span>
            <ArrowRight size={12} />
          </div>
        </Link>

        <Link href="/notes" className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <FileText size={18} />
            </div>
            <span className={styles.statBadge}>Verified</span>
          </div>
          <div className={styles.statValue}>Study Notes</div>
          <div className={styles.statLabel}>Chapter Summaries</div>
          <div className={styles.statAction}>
            <span>Browse Notes</span>
            <ArrowRight size={12} />
          </div>
        </Link>

        <Link href="/papers" className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <BookOpen size={18} />
            </div>
            <span className={styles.statBadge}>Archive</span>
          </div>
          <div className={styles.statValue}>Past Papers</div>
          <div className={styles.statLabel}>2016 – Present</div>
          <div className={styles.statAction}>
            <span>View Papers</span>
            <ArrowRight size={12} />
          </div>
        </Link>

        <Link href="/favorites" className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <Heart size={18} />
            </div>
            <span className={styles.statBadge}>Bookmarks</span>
          </div>
          <div className={styles.statValue}>{favoritesCount}</div>
          <div className={styles.statLabel}>Saved Favourites</div>
          <div className={styles.statAction}>
            <span>View Saved</span>
            <ArrowRight size={12} />
          </div>
        </Link>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className={styles.gridTwoCol}>
        {/* Left Column: Learning Hubs & AI Doubt Solver */}
        <div>
          {/* AI Doubt Solver Box */}
          <div className={styles.aiBox}>
            <div className={styles.aiHeader}>
              <div className={styles.aiIcon}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 className={styles.aiTitle}>Bounce Back AI Doubt Solver</h3>
                  <span className={styles.aiBadge}>Free 24/7</span>
                </div>
                <p className={styles.aiDesc}>
                  Ask any physics derivation, chemistry equation, or maths problem for instant explanations.
                </p>
              </div>
            </div>

            <form onSubmit={handleAskAI} className={styles.aiInputRow}>
              <input
                type="text"
                placeholder="Type your academic doubt or topic here..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className={styles.aiInput}
              />
              <button type="submit" className={styles.btnAskAI}>
                <span>Ask Doubt</span>
                <Send size={13} />
              </button>
            </form>
          </div>

          {/* Continue Learning Hubs */}
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BookOpen size={16} />
              <h2 className={styles.sectionTitle}>Continue Learning</h2>
            </div>
          </div>

          <div className={styles.cardGrid}>
            <Link
              href={selectedClass ? `/class/${encodeURIComponent(selectedClass)}` : '/#classes'}
              className={styles.studyCard}
            >
              <div className={styles.cardTop}>
                <div className={styles.studyIconBox}>
                  <GraduationCap size={16} />
                </div>
                <span className={styles.cardBadge}>Curriculum Hub</span>
              </div>
              <h3 className={styles.cardTitle} suppressHydrationWarning>{displayClassName} Dashboard</h3>
              <p className={styles.cardMeta}>
                Full access to syllabus notes, past question papers, video lectures, and quizzes.
              </p>
              <div className={styles.cardDivider} />
              <div className={styles.cardFooterAction}>
                <span>Open Hub</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            <Link href="/quiz" className={styles.studyCard}>
              <div className={styles.cardTop}>
                <div className={styles.studyIconBox}>
                  <Trophy size={16} />
                </div>
                <span className={styles.cardBadge}>Assessment</span>
              </div>
              <h3 className={styles.cardTitle}>Practice Quizzes &amp; Tests</h3>
              <p className={styles.cardMeta}>
                Instant MCQ practice with automated timers, scoring, and step-by-step explanations.
              </p>
              <div className={styles.cardDivider} />
              <div className={styles.cardFooterAction}>
                <span>Take Quiz</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            <Link href="/videos" className={styles.studyCard}>
              <div className={styles.cardTop}>
                <div className={styles.studyIconBox}>
                  <VideoIcon size={16} />
                </div>
                <span className={styles.cardBadge}>Video Lessons</span>
              </div>
              <h3 className={styles.cardTitle}>PW Video Lectures</h3>
              <p className={styles.cardMeta}>
                High-yield video lessons with precision speed control, lecture chapters, and notes.
              </p>
              <div className={styles.cardDivider} />
              <div className={styles.cardFooterAction}>
                <span>Watch Lectures</span>
                <ArrowRight size={13} />
              </div>
            </Link>

            <Link href="/courses" className={styles.studyCard}>
              <div className={styles.cardTop}>
                <div className={styles.studyIconBox}>
                  <Layers size={16} />
                </div>
                <span className={styles.cardBadge}>Skill Courses</span>
              </div>
              <h3 className={styles.cardTitle}>Courses &amp; Masterclasses</h3>
              <p className={styles.cardMeta}>
                Curated curriculum tracks and practical courses in AI tool mastery and productivity.
              </p>
              <div className={styles.cardDivider} />
              <div className={styles.cardFooterAction}>
                <span>Explore Tracks</span>
                <ArrowRight size={13} />
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Quiz Performance & Community Help */}
        <div>
          {/* Quiz Performance Widget */}
          <div className={styles.sideWidget}>
            <div className={styles.sideWidgetHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Trophy size={16} />
                <h2 className={styles.sideWidgetTitle}>Quiz Performance</h2>
              </div>
              <Link href="/quiz" className={styles.sideWidgetLink}>
                Practice Arena &rarr;
              </Link>
            </div>

            {quizHistory.length > 0 ? (
              <div className={styles.quizList}>
                {quizHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.quizHistoryItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                      <div className={styles.quizIconBadge}>
                        <Trophy size={13} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className={styles.quizTitleText}>{stripEmojis(item.title) || 'Practice Assessment'}</div>
                        <div className={styles.quizMetaText}>
                          Score: {item.score}/{item.total} &bull; +{item.xp || item.score * 50} XP
                        </div>
                      </div>
                    </div>
                    <span className={styles.quizScoreBadge}>
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyQuizBox}>
                <p className={styles.emptyQuizText}>
                  No quizzes attempted yet. Test your knowledge in our timed practice arena!
                </p>
                <Link href="/quiz" className={styles.btnTakeQuiz}>
                  <Play size={12} />
                  <span>Take a Quiz</span>
                </Link>
              </div>
            )}
          </div>

          {/* Community & Academic Notices */}
          <div className={styles.sideWidget} style={{ marginTop: '1.5rem' }}>
            <div className={styles.sideWidgetHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MessageSquare size={16} />
                <h2 className={styles.sideWidgetTitle}>Community &amp; Support</h2>
              </div>
            </div>

            <div className={styles.noticeList}>
              <Link href="/forum" className={styles.noticeCard}>
                <div className={styles.noticeIconBox}>
                  <MessageSquare size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.noticeTitle}>Student Discussion Forum</div>
                  <div className={styles.noticeDesc}>
                    Collaborate with fellow students and ask academic queries.
                  </div>
                </div>
                <ArrowRight size={13} className={styles.noticeArrow} />
              </Link>

              <Link href="/announcements" className={styles.noticeCard}>
                <div className={styles.noticeIconBox}>
                  <Bell size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.noticeTitle}>Academic Notices</div>
                  <div className={styles.noticeDesc}>
                    Exam schedules, routine updates, and new study material.
                  </div>
                </div>
                <ArrowRight size={13} className={styles.noticeArrow} />
              </Link>

              <Link href="/contact" className={styles.noticeCard}>
                <div className={styles.noticeIconBox}>
                  <LifeBuoy size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.noticeTitle}>Student Support Desk</div>
                  <div className={styles.noticeDesc}>
                    Need help with notes, videos, or access? Reach Amit Sharma &amp; team.
                  </div>
                </div>
                <ArrowRight size={13} className={styles.noticeArrow} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showClassModal && (
        <ClassSwitcherModal
          isOpen={showClassModal}
          currentClass={selectedClass || undefined}
          onClose={() => setShowClassModal(false)}
        />
      )}
    </div>
  );
}
