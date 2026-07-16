"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

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
  const [userClass, setUserClass] = useState(initialUserClass || null);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));

    if (!userClass) {
      const stored = localStorage.getItem('selectedClass');
      if (stored) setUserClass(stored);
    }
  }, [userClass]);

  return (
    <section className={styles.hero}>
      <div className={styles.noise} />
      <div className={styles.beam} />

      <div className={styles.inner}>
        {/* Live indicator */}
        <div className={styles.liveChip}>
          <span className={styles.liveDot} />
          <span>{loading ? '—' : stats.activeNow} students studying right now</span>
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          The smartest way to<br />
          <span className={styles.accent}>prepare for NBSE</span>
        </h1>

        <p className={styles.sub}>
          Free question papers, study notes, video lectures and AI-powered doubt solving for Classes 8–12, CUET, JEE &amp; NEET.
        </p>

        {/* CTAs */}
        <div className={styles.ctas}>
          <Link href={userClass ? `/papers?class=${userClass}` : '/papers'} className={styles.ctaPrimary}>
            Explore Papers
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href={userClass ? `/notes?class=${userClass}` : '/notes'} className={styles.ctaGhost}>Study Notes</Link>
          <Link href="/ask" className={styles.ctaGhost}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/></svg>
            AI Tutor
            <span className={styles.freeBadge}>FREE</span>
          </Link>
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
