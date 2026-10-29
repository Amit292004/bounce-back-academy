"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import styles from './HeroSection.module.css';
import AnimatedTitle, { ROTATING_TOPICS } from './AnimatedTitle';
import PromoCarousel from './PromoCarousel';
import { HeroAdData } from '@/lib/adConfig';

interface Stats {
  users: number;
  papers: number;
  notes: number;
  videos: number;
  activeNow: number;
}

interface HeroSectionProps {
  userClass?: string | null;
  initialHeroAd?: HeroAdData | null;
  initialHeroAds?: HeroAdData[];
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
      if (current >= value) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [value, isLoading]);

  if (isLoading) return <span className={styles.skeletonNum} />;
  return <span>{displayed.toLocaleString()}+</span>;
}

export default function HeroSection({ userClass: initialUserClass, initialHeroAd, initialHeroAds }: HeroSectionProps) {
  const [stats, setStats] = useState<Stats>({ users: 0, papers: 0, notes: 0, videos: 0, activeNow: 0 });
  const [loading, setLoading] = useState(true);
  const [userClass, setUserClass] = useState<string | null>(initialUserClass || null);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const syncClass = async () => {
      try {
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

      <div className={styles.container}>
        {/* Asymmetric 2-Column Grid on Desktop */}
        <div className={styles.heroGrid}>

          {/* ─── Left Column: Proposition, Headline, Subtitle, CTAs ─── */}
          <div className={styles.leftCol}>
            {/* Live student activity indicator */}
            <div className={styles.liveChip}>
              <span className={styles.liveDot} aria-hidden="true" />
              <span className={styles.liveText}>
                {loading ? '—' : stats.activeNow} {stats.activeNow === 1 ? 'student' : 'students'} studying right now
              </span>
            </div>

            {/* Headline */}
            <h1 className={styles.headline}>
              <span className={styles.headlineLead}>The smartest way to prepare for</span>
              <span className={styles.headlineSubject}>
                <AnimatedTitle onIndexChange={setActiveTopicIndex} />
              </span>
            </h1>

            {/* Supporting description */}
            <p className={styles.sub}>
              Free question papers, study notes, video lectures, real-world skills, and AI-powered doubt solving for Classes 8–12, CUET, JEE &amp; NEET.
            </p>

            {/* CTAs */}
            <div className={styles.ctas}>
              <Link
                href={userClass ? `/class/${encodeURIComponent(userClass)}` : '/school'}
                className={styles.ctaPrimary}
              >
                <span>{classDisplayName ? `${classDisplayName} Dashboard` : 'School Learning Hub'}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>

              <div className={styles.ctaSecondaryGroup}>
                <Link
                  href={userClass ? `/papers?class=${encodeURIComponent(userClass)}` : '/papers'}
                  className={styles.ctaGhost}
                >
                  Explore Papers
                </Link>

                <Link href="/ai-tutor" className={styles.ctaGhost}>
                  <Sparkles size={14} strokeWidth={2} />
                  <span>AI Tutor</span>
                  <span className={styles.freeBadge}>FREE</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Numerical Analytics KPI Strip ─── */}
          <div className={styles.statsBar}>
            {[
              { label: 'Students enrolled', value: stats.users },
              { label: 'Past papers', value: stats.papers },
              { label: 'Study notes', value: stats.notes },
              { label: 'Video lectures', value: stats.videos },
            ].map((s, i) => (
              <div key={s.label} className={styles.statCell}>
                <span className={styles.statNum}>
                  <AnimatedNumber value={s.value} isLoading={loading} />
                </span>
                <span className={styles.statLabel}>{s.label}</span>
                {i < 3 && <div className={styles.statDivider} />}
              </div>
            ))}
          </div>

          {/* ─── Right Column: Advertisement & Promo Carousel ─── */}
          <div className={styles.rightCol}>
            <PromoCarousel userClass={userClass} initialAd={initialHeroAd} initialAds={initialHeroAds} />
          </div>

        </div>
      </div>
    </section>
  );
}
