"use client";

import React from 'react';
import Link from 'next/link';
import styles from './ClassExamFinder.module.css';
import { trackClassExamSelect } from '@/lib/analytics';

export interface CurriculumTrackItem {
  id: string;
  category: 'school' | 'exams' | 'skills';
  title: string;
  badge: string;
  desc: string;
  href: string;
  actionLabel: string;
  analyticsType: 'school_class' | 'competitive_exam' | 'practical_skills';
  icon: React.ReactNode;
}

export const CURRICULUM_TRACKS: CurriculumTrackItem[] = [
  {
    id: 'class-8',
    category: 'school',
    title: 'Class 8',
    badge: 'NBSE',
    desc: 'NBSE Middle Stage foundation notes, chapter summaries, textbook solutions, and previous model question papers.',
    href: '/class/Class%208',
    actionLabel: 'Launch Class 8',
    analyticsType: 'school_class',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    id: 'class-9',
    category: 'school',
    title: 'Class 9',
    badge: 'NBSE',
    desc: 'Secondary Phase 1 curriculum: Science, Mathematics, English, and Social Sciences with revision guides and practice sheets.',
    href: '/class/Class%209',
    actionLabel: 'Launch Class 9',
    analyticsType: 'school_class',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
  },
  {
    id: 'class-10',
    category: 'school',
    title: 'Class 10',
    badge: 'HSLC Board',
    desc: 'NBSE HSLC Board examination hub: 2016–2024 past board papers, model answer keys, chapter summaries, and high-yield question banks.',
    href: '/class/Class%2010',
    actionLabel: 'Launch Class 10',
    analyticsType: 'school_class',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
  {
    id: 'class-11',
    category: 'school',
    title: 'Class 11',
    badge: 'HSSLC',
    desc: 'Higher Secondary foundation: Science (Physics, Chemistry, Maths, Biology), Commerce, and Arts core notes and syllabus breakdowns.',
    href: '/class/Class%2011',
    actionLabel: 'Launch Class 11',
    analyticsType: 'school_class',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2v7.31"/>
        <path d="M14 9.3V2"/>
        <path d="M8.5 2h7"/>
        <path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
        <path d="M5.52 16h12.96"/>
      </svg>
    ),
  },
  {
    id: 'class-12',
    category: 'school',
    title: 'Class 12',
    badge: 'HSSLC Board',
    desc: 'Complete NBSE Class 12 board preparation: previous year question papers, step-by-step model solutions, formula booklets, and video lectures.',
    href: '/class/Class%2012',
    actionLabel: 'Launch Class 12',
    analyticsType: 'school_class',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    id: 'jee',
    category: 'exams',
    title: 'JEE Main & Advanced',
    badge: 'Engineering',
    desc: 'NTA & IIT curriculum problem sets, formula reference sheets, high-difficulty numericals, and full-length CBT mock tests.',
    href: '/class/JEE',
    actionLabel: 'Launch JEE Prep',
    analyticsType: 'competitive_exam',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: 'cuet',
    category: 'exams',
    title: 'CUET UG',
    badge: 'Entrance',
    desc: 'Central Universities Entrance Test portal: Domain subjects, general aptitude prep, language section exercises, and past NTA papers.',
    href: '/class/CUET',
    actionLabel: 'Launch CUET Prep',
    analyticsType: 'competitive_exam',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="21" x2="21" y2="21"/>
        <line x1="6" y1="21" x2="6" y2="10"/>
        <line x1="18" y1="21" x2="18" y2="10"/>
        <line x1="12" y1="21" x2="12" y2="10"/>
        <path d="M2 10l10-7 10 7"/>
      </svg>
    ),
  },
  {
    id: 'neet',
    category: 'exams',
    title: 'NEET UG',
    badge: 'Medical',
    desc: 'Comprehensive NCERT line-by-line revision guides, high-yield Biology diagrams, chemistry roadmaps, and timed physics tests.',
    href: '/class/NEET',
    actionLabel: 'Launch NEET Prep',
    analyticsType: 'competitive_exam',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: 'skills',
    category: 'skills',
    title: 'Practical Skills',
    badge: 'Career & Tech',
    desc: 'Practical career competencies, AI tools, and programming fundamentals with hands-on projects and guides.',
    href: '/class/Skills',
    actionLabel: 'Launch Practical Skills',
    analyticsType: 'practical_skills',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
];

export default function ClassExamFinder() {
  return (
    <section className={styles.section} id="class-finder" aria-labelledby="finder-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>01 //</span> CURRICULUM DIRECTORY
        </p>
        <h2 className={styles.title} id="finder-heading">
          Explore by Class &amp; Exam
        </h2>
        <p className={styles.sub}>
          Syllabus-aligned study packs, past question papers, and video series curated for Nagaland students.
        </p>
      </div>

      {/* 3x3 Bento Grid */}
      <div className={styles.grid}>
        {CURRICULUM_TRACKS.map((item) => {
          const targetClassName =
            item.category === 'school'
              ? item.title
              : item.id === 'jee'
                ? 'JEE'
                : item.id === 'cuet'
                  ? 'CUET'
                  : item.id === 'neet'
                    ? 'NEET'
                    : 'Skills';

          return (
            <Link
              key={item.id}
              href={item.href}
              className={styles.card}
              onClick={() => {
                try {
                  localStorage.setItem('selectedClass', targetClassName);
                  document.cookie = `selected_class=${encodeURIComponent(targetClassName)}; path=/; max-age=31536000; SameSite=Lax`;
                  window.dispatchEvent(new CustomEvent('classChanged', { detail: targetClassName }));
                  window.dispatchEvent(new Event('profileUpdated'));
                } catch {}

                trackClassExamSelect({
                  name: item.title,
                  type: item.analyticsType,
                  destination: item.href,
                });
              }}
              aria-label={`Open ${item.title} hub`}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>{item.icon}</div>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>

              <div className={styles.cardFooter}>
                <span className={styles.link}>{item.actionLabel}</span>
                <svg
                  className={styles.arrow}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
