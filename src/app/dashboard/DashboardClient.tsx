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
  Sparkles,
  Heart,
  ArrowRight,
  Send,
  User,
  Settings,
  AlertCircle,
  HelpCircle,
  Trophy,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ClassSwitcherModal from '@/components/layout/ClassSwitcherModal';

interface StudentData {
  authenticated: boolean;
  name?: string;
  email?: string;
  class?: string;
}

export default function DashboardClient() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);

  useEffect(() => {
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

    // Check quiz history
    try {
      if (typeof window !== 'undefined') {
        const rawHistory = localStorage.getItem('bba_quiz_history');
        if (rawHistory) {
          setQuizHistory(JSON.parse(rawHistory));
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
  }, []);

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    router.push(`/ai-tutor?q=${encodeURIComponent(aiQuestion.trim())}`);
  };

  const selectedClass =
    student?.class && student.class !== 'Not Selected'
      ? student.class
      : typeof window !== 'undefined'
      ? localStorage.getItem('selectedClass') || null
      : null;

  const displayClassName = selectedClass
    ? selectedClass.toLowerCase().startsWith('class') ||
      ['cuet', 'jee', 'neet'].includes(selectedClass.toLowerCase())
      ? selectedClass
      : `Class ${selectedClass}`
    : 'Select Your Class';

  return (
    <div className={styles.container}>
      {/* Welcome Card */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeTop}>
          <div>
            <h1 className={styles.welcomeGreeting}>
              {student?.authenticated
                ? `Welcome back, ${student.name?.split(' ')[0] || 'Learner'}!`
                : 'Welcome to your Learning Space!'}
            </h1>
            <p className={styles.welcomeSubtitle}>
              {student?.authenticated
                ? `You are currently enrolled in ${displayClassName}. Ready to excel today?`
                : 'Sign in to sync your study notes, save lecture favorites, and track quiz progress.'}
            </p>
          </div>
          <div className={styles.quickActions}>
            <button
              onClick={() => setShowClassModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <GraduationCap size={15} color="#818cf8" />
              <span>{displayClassName}</span>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>(Change)</span>
            </button>
            {student?.authenticated ? (
              <Button href="/profile" variant="secondary" size="sm" leftIcon={<User size={14} />}>
                Profile
              </Button>
            ) : (
              <Button href="/login" variant="primary" size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats / Quick Numbers */}
      <div className={styles.statsRow}>
        <Link
          href={selectedClass ? `/class/${encodeURIComponent(selectedClass)}` : '/#classes'}
          className={styles.statCard}
          style={{ textDecoration: 'none' }}
        >
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{displayClassName}</div>
            <div className={styles.statLabel}>Current Curriculum</div>
          </div>
        </Link>

        <Link href="/notes" className={styles.statCard} style={{ textDecoration: 'none' }}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className={styles.statValue}>Study Notes</div>
            <div className={styles.statLabel}>Chapter Summaries</div>
          </div>
        </Link>

        <Link href="/papers" className={styles.statCard} style={{ textDecoration: 'none' }}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className={styles.statValue}>Past Papers</div>
            <div className={styles.statLabel}>2016 – Present</div>
          </div>
        </Link>

        <Link href="/favorites" className={styles.statCard} style={{ textDecoration: 'none' }}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <Heart size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{favoritesCount}</div>
            <div className={styles.statLabel}>Saved Favourites</div>
          </div>
        </Link>
      </div>

      {/* Main Two Column Workspace */}
      <div className={styles.gridTwoCol}>
        {/* Left Column: Learning Activities */}
        <div>
          {/* Ask AI Doubt Box */}
          <div className={styles.aiBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>
              <Sparkles size={18} />
              <span>Bounce Back AI Doubt Solver</span>
              <Badge variant="success" size="sm">Free</Badge>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              Have a physics derivation, chemistry equation, or maths question? Ask instantly.
            </p>
            <form onSubmit={handleAskAI} className={styles.aiInputRow}>
              <input
                type="text"
                placeholder="Type your academic doubt or topic here..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className={styles.aiInput}
              />
              <Button type="submit" variant="primary" size="sm" rightIcon={<Send size={14} />}>
                Ask
              </Button>
            </form>
          </div>

          {/* Continue Learning Hubs */}
          <h2 className={styles.sectionTitle}>
            <BookOpen size={18} color="#818cf8" />
            <span>Continue Learning</span>
          </h2>

          <div className={styles.cardGrid}>
            <Link
              href={selectedClass ? `/class/${encodeURIComponent(selectedClass)}` : '/#classes'}
              className={styles.studyCard}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant="primary" size="sm">Curriculum Hub</Badge>
                <ArrowRight size={15} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                {displayClassName} Dashboard
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Full access to syllabus notes, past question papers, video lectures, and quizzes.
              </p>
            </Link>

            <Link href="/quiz" className={styles.studyCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant="purple" size="sm">Assessment</Badge>
                <ArrowRight size={15} color="#c084fc" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                Practice Quizzes &amp; Tests
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Instant MCQ practice with automated timers, scoring, and step-by-step explanations.
              </p>
            </Link>

            <Link href="/videos" className={styles.studyCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant="cyan" size="sm">Video Lectures</Badge>
                <ArrowRight size={15} color="#22d3ee" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                PW Video Lectures
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                High-yield video lessons with precision speed control, lecture chapters, and notes.
              </p>
            </Link>

            <Link href="/courses" className={styles.studyCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant="warning" size="sm">Skill Courses</Badge>
                <ArrowRight size={15} color="#fbbf24" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                Career &amp; AI Skills
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Practical courses in AI Tool Mastery, programming, and essential modern tools.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Quiz Performance & Community */}
        <div>
          {/* Quiz Performance Widget */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Trophy size={18} color="#fbbf24" />
                <span>Quiz Performance</span>
              </h2>
              <Link href="/quiz" style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                Practice Arena &rarr;
              </Link>
            </div>

            {quizHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quizHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--surface-card, #141414)',
                      border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        Score: {item.score}/{item.total} &bull; +{item.xp || (item.score * 50)} XP
                      </div>
                    </div>
                    <Badge variant={item.percentage >= 75 ? 'success' : item.percentage >= 50 ? 'warning' : 'danger'} size="sm">
                      {item.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface-card, #141414)',
                  border: '1px dashed var(--surface-border, rgba(255,255,255,0.15))',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.75rem' }}>
                  No quizzes attempted yet. Test your knowledge in our timed practice arena!
                </p>
                <Button href="/quiz" variant="secondary" size="sm" rightIcon={<Play size={12} />}>
                  Take a Quiz
                </Button>
              </div>
            )}
          </div>

          <h2 className={styles.sectionTitle}>
            <Trophy size={18} color="#818cf8" />
            <span>Community &amp; Help</span>
          </h2>

          <div className={styles.announcementList}>
            <Link
              href="/forum"
              style={{
                background: 'var(--surface-card, #141414)',
                border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                borderRadius: '10px',
                padding: '1rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Student Discussion Forum</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Collaborate with fellow students and ask academic queries.
              </div>
            </Link>

            <Link
              href="/announcements"
              style={{
                background: 'var(--surface-card, #141414)',
                border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                borderRadius: '10px',
                padding: '1rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Academic Notices</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Exam schedules, routine updates, and new study material additions.
              </div>
            </Link>

            <Link
              href="/contact"
              style={{
                background: 'var(--surface-card, #141414)',
                border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                borderRadius: '10px',
                padding: '1rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Student Support Desk</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Need help or have questions regarding notes or lectures? Contact Amit Sharma &amp; team.
              </div>
            </Link>
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
