"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

import AnimatedTitle, { ROTATING_TOPICS } from './AnimatedTitle';

interface Stats {
  users: number;
  papers: number;
  notes: number;
  videos: number;
  activeNow: number;
}

interface HeroSectionProps {
  userClass?: string | null;
}

function AnimatedNumber({ value, isLoading }: { value: number; isLoading: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (isLoading || value === 0) return;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.floor(current));
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [value, isLoading]);
  if (isLoading) return <span className={styles.skeletonNum} />;
  return <span>{displayed.toLocaleString()}+</span>;
}

export default function HeroSection({ userClass: initialUserClass }: HeroSectionProps) {
  const [stats, setStats] = useState<Stats>({ users: 0, papers: 0, notes: 0, videos: 0, activeNow: 0 });
  const [loading, setLoading] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(initialUserClass || null);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));

    const syncClass = async () => {
      try {
        // 1. Check if user is logged in and fetch their profile selected class
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.class && data.class !== 'Not Selected') {
            setUserClass(data.class);
            localStorage.setItem('selectedClass', data.class);
            document.cookie = `selected_class=${encodeURIComponent(data.class)}; path=/; max-age=31536000; SameSite=Lax`;
            return;
          }
        }
      } catch {}

      // 2. Fall back to localStorage if not logged in or profile fetch failed
      const stored = localStorage.getItem('selectedClass');
      if (stored && stored !== 'Not Selected') {
        setUserClass(stored);
      }
    };

    syncClass();

    const handleProfileUpdate = () => {
      syncClass();
    };

    const handleClassChange = (e: any) => {
      if (e?.detail) {
        setUserClass(e.detail);
      } else {
        syncClass();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'selectedClass') {
        if (e.newValue && e.newValue !== 'Not Selected') {
          setUserClass(e.newValue);
        } else {
          setUserClass(null);
        }
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('classChanged', handleClassChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('classChanged', handleClassChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const activeTopic = ROTATING_TOPICS[activeTopicIndex % ROTATING_TOPICS.length] || ROTATING_TOPICS[0];

  const classDisplayName = userClass
    ? (userClass.toLowerCase().startsWith('class') || ['cuet', 'jee', 'neet'].includes(userClass.toLowerCase())
        ? userClass
        : `Class ${userClass}`)
    : null;

  return (
    <section className={styles.hero}>
      <div className={styles.noise} />
      <div
        className={styles.beam}
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${activeTopic.beamGlow} 0%, transparent 80%)`,
          transition: 'background 0.8s ease-in-out',
        }}
      />

      <div className={styles.inner}>
        {/* Live indicator */}
        <div className={styles.liveChip}>
          <span className={styles.liveDot} />
          <span>{loading ? '—' : stats.activeNow} {stats.activeNow === 1 ? 'student' : 'students'} studying right now</span>
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          <span className={styles.headlineLead}>The smartest way to prepare for</span>
          <span className={styles.headlineSubject}>
            <AnimatedTitle onIndexChange={setActiveTopicIndex} />
          </span>
        </h1>

        <p className={styles.sub}>
          Free question papers, study notes, video lectures, real-world skills, and AI-powered doubt solving for Classes 8–12, CUET, JEE &amp; NEET.
        </p>

        {/* CTAs */}
        <div className={styles.ctas}>
          <Link href={userClass ? `/class/${encodeURIComponent(userClass)}` : '/#classes'} className={styles.ctaPrimary}>
            {classDisplayName ? `${classDisplayName} Dashboard` : 'Classes Dashboard'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <div className={styles.ctaSecondaryGroup}>
            <Link href={userClass ? `/papers?class=${userClass}` : '/papers'} className={styles.ctaGhost}>Explore Papers</Link>
            <Link href="/ask" className={styles.ctaGhost}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/></svg>
              AI Tutor
              <span className={styles.freeBadge}>FREE</span>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {[
            { label: 'Students enrolled', value: stats.users },
            { label: 'Past papers', value: stats.papers },
            { label: 'Study notes', value: stats.notes },
            { label: 'Video lectures', value: stats.videos },
          ].map((s, i) => (
            <div key={s.label} className={styles.statCell}>
              <span className={styles.statNum}><AnimatedNumber value={s.value} isLoading={loading} /></span>
              <span className={styles.statLabel}>{s.label}</span>
              {i < 3 && <div className={styles.statDivider} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
