import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Course } from '@prisma/client';
import { redirect } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';
import FeaturesGrid from '@/components/home/FeaturesGrid';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import AnnouncementBadge from '@/components/home/AnnouncementBadge';
import { Megaphone } from 'lucide-react';
import styles from './page.module.css';
import React from 'react';
import { logger } from '@/lib/logger'

export const revalidate = 60;

const COURSE_ACCENT: Record<string, string> = {
  '8':   '#6366f1',
  '9':   '#8b5cf6',
  '10':  '#0ea5e9',
  '11':  '#f59e0b',
  '12':  '#10b981',
  'cuet':'#06b6d4',
  'jee': '#f97316',
  'neet':'#ef4444',
};

function getCourseAccent(name: string): string {
  const n = name.toLowerCase();
  for (const [key, color] of Object.entries(COURSE_ACCENT)) {
    if (n.includes(key)) return color;
  }
  return '#6366f1';
}

export default async function Home({ searchParams }: { searchParams: Promise<{ noredirect?: string }> }) {
  let userClass: string | null = null;
  let courses: Course[] = [];
  let bannerMessage: string | null = null;

  try {
    const [announcementsData, coursesData] = await Promise.all([
      prisma.announcement.findMany({
        where: { isActive: true, type: 'BANNER' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 1,
      }),
      prisma.course.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);
    courses = coursesData;
    bannerMessage = announcementsData[0]?.message ?? null;
  } catch (error) {
    logger.error('Failed to fetch initial data:', error);
  }

  return (
    <div className={styles.page}>
      {/* Top Banner */}
      {bannerMessage && (
        <div className={styles.banner}>
          <Megaphone size={14} className={styles.bannerIcon} />
          <span>{bannerMessage}</span>
          <AnnouncementBadge />
        </div>
      )}

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Separator ── */}
      <div className={styles.sep} />

      {/* ── Quick Access ── */}
      <section className={styles.quickSection}>
        <div className={styles.quickInner}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
              Swipe / Scroll to explore &rarr;
            </div>
            <p className={styles.quickLabel} style={{ marginBottom: 0 }}>Quick Access</p>
          </div>
          <div className={styles.quickGrid}>
            {[
              { href: '/papers',       label: 'Question Papers',    tag: 'Study' },
              { href: '/notes',        label: 'Study Notes',        tag: 'Study' },
              { href: '/videos',       label: 'Video Lectures',     tag: 'Study' },
              { href: '/ask',          label: 'AI Doubt Solver',    tag: 'Free' },
              { href: '/quiz',         label: 'Quiz & Tests',       tag: 'Practice' },
              { href: '/leaderboard',  label: 'Leaderboard',        tag: 'Compete' },
              { href: '/forum',        label: 'Discussion Forum',   tag: 'Community' },
              { href: '/favorites',    label: 'Saved Favourites',   tag: 'Library' },
              { href: '/announcements',label: 'Announcements',      tag: 'News' },
              { href: '/contact',      label: 'Contact Us',         tag: 'Support' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className={styles.quickItem}>
                <span className={styles.quickItemLabel}>{item.label}</span>
                <span className={styles.quickItemTag}>{item.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className={styles.sep} />

      {/* ── Features ── */}
      <FeaturesGrid />

      {/* ── Separator ── */}
      <div className={styles.sep} />

      {/* ── Class selection ── */}
      <section id="classes" className={styles.classSection}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Browse by Class</p>
          <h2 className={styles.sectionTitle}>Select your level</h2>
          <p className={styles.sectionSub}>Jump straight to your class-specific papers, notes and videos.</p>
        </div>

        <div className={styles.classTable}>
          {courses.map((course) => {
            const accent = getCourseAccent(course.name);
            const displayName = course.name.toLowerCase().includes('class')
              ? course.name
              : `Class ${course.name}`;
            return (
              <Link key={course.id} href={`/class/${encodeURIComponent(course.name)}`} className={styles.classRow}>
                <div className={styles.classRowLeft}>
                  <div className={styles.classAccentBar} style={{ background: accent }} />
                  <span className={styles.classLabel}>{displayName}</span>
                  {course.caption && <span className={styles.classMeta}>{course.caption}</span>}
                </div>
                <div className={styles.classRowRight}>
                  {/* Desktop: show all three tags */}
                  <span className={`${styles.classTag} ${styles.tagDesktop}`}>Papers</span>
                  <span className={`${styles.classTag} ${styles.tagDesktop}`}>Notes</span>
                  <span className={`${styles.classTag} ${styles.tagDesktop}`}>Videos</span>
                  {/* Mobile: single combined tag */}
                  <span className={`${styles.classTag} ${styles.tagMobile}`}>Study Material</span>
                  <svg className={styles.classArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Separator ── */}
      <div className={styles.sep} />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Separator ── */}
      <div className={styles.sep} />

      {/* ── Connect ── */}
      <section className={styles.connectSection}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Community</p>
          <h2 className={styles.sectionTitle}>Connect with us</h2>
        </div>

        <div className={styles.connectGrid}>
          <a href="https://www.youtube.com/@BounceBackAcademy" target="_blank" rel="noopener noreferrer" className={styles.connectCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FF0000' }}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <div>
              <div className={styles.connectName}>YouTube</div>
              <div className={styles.connectDesc}>Free video lectures &amp; exam tips</div>
            </div>
            <svg className={styles.connectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="https://www.instagram.com/bouncebackacdemy" target="_blank" rel="noopener noreferrer" className={styles.connectCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#E4405F' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <div>
              <div className={styles.connectName}>Instagram</div>
              <div className={styles.connectDesc}>Study tips &amp; motivation</div>
            </div>
            <svg className={styles.connectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <Link href="/contact" className={styles.connectCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--foreground)', opacity: 0.7 }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <div>
              <div className={styles.connectName}>Contact Us</div>
              <div className={styles.connectDesc}>Questions or suggestions</div>
            </div>
            <svg className={styles.connectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/feedback" className={styles.connectCard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--foreground)', opacity: 0.7 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div>
              <div className={styles.connectName}>Support Tickets</div>
              <div className={styles.connectDesc}>Get help or report issues</div>
            </div>
            <svg className={styles.connectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
