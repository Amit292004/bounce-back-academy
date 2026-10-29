"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './ClassExamFinder.module.css';
import { trackClassExamSelect } from '@/lib/analytics';
import { ArrowRight, GraduationCap, Award } from 'lucide-react';

interface SchoolClassItem {
  id: string;
  name: string;
  displayName: string;
  caption: string;
  accent: string;
  href: string;
  tags: string[];
}

interface ExamItem {
  id: string;
  name: string;
  fullName: string;
  caption: string;
  accent: string;
  href: string;
  tags: string[];
}

const SCHOOL_CLASSES: SchoolClassItem[] = [
  {
    id: 'class-8',
    name: 'Class 8',
    displayName: 'Class 8',
    caption: 'NBSE Middle Stage foundation notes, model papers & revision.',
    accent: '#6366f1',
    href: '/class/Class%208',
    tags: ['Papers', 'Notes', 'Videos'],
  },
  {
    id: 'class-9',
    name: 'Class 9',
    displayName: 'Class 9',
    caption: 'Secondary Phase 1 curriculum: Science, Maths & Social Sciences.',
    accent: '#8b5cf6',
    href: '/class/Class%209',
    tags: ['Papers', 'Notes', 'Videos'],
  },
  {
    id: 'class-10',
    name: 'Class 10',
    displayName: 'Class 10',
    caption: 'NBSE Board Exam hub: 2016–2024 PYQs, solutions & chapter notes.',
    accent: '#0ea5e9',
    href: '/class/Class%2010',
    tags: ['Board PYQs', 'Solutions', 'Videos'],
  },
  {
    id: 'class-11',
    name: 'Class 11',
    displayName: 'Class 11',
    caption: 'Higher Secondary: Science, Commerce & Arts core subject notes.',
    accent: '#f59e0b',
    href: '/class/Class%2011',
    tags: ['Science', 'Commerce', 'Arts'],
  },
  {
    id: 'class-12',
    name: 'Class 12',
    displayName: 'Class 12',
    caption: 'HSSLC Board examinations: chapterwise study packs & video series.',
    accent: '#10b981',
    href: '/class/Class%2012',
    tags: ['HSSLC Papers', 'Notes', 'Videos'],
  },
];

const EXAMS: ExamItem[] = [
  {
    id: 'jee',
    name: 'JEE Main & Advanced',
    fullName: 'Engineering Entrance',
    caption: 'NTA & IIT curriculum problem sets, formula sheets & chapter mock tests.',
    accent: '#f97316',
    href: '/exams?exam=jee-main',
    tags: ['Physics', 'Chemistry', 'Maths'],
  },
  {
    id: 'neet',
    name: 'NEET UG',
    fullName: 'Medical Entrance',
    caption: 'Comprehensive NCERT line-by-line revision, Biology PYQs & chemistry problem sets.',
    accent: '#ef4444',
    href: '/exams?exam=neet-ug',
    tags: ['Biology', 'Physics', 'Chemistry'],
  },
  {
    id: 'cuet',
    name: 'CUET UG',
    fullName: 'Central Universities Entrance',
    caption: 'Domain subject tests, general aptitude prep & past standardized questions.',
    accent: '#06b6d4',
    href: '/exams?exam=cuet',
    tags: ['Domain Subjects', 'General Test', 'PYQs'],
  },
];

export default function ClassExamFinder() {
  const [activeTab, setActiveTab] = useState<'school' | 'exams'>('school');

  return (
    <section className={styles.section} id="class-finder" aria-labelledby="finder-heading">
      {/* ── Section Header ── */}
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>CURRICULUM DIRECTORY</p>
        <h2 className={styles.title} id="finder-heading">
          Find Your Class or Exam
        </h2>
        <p className={styles.subtitle}>
          Choose your learning level and go directly to the resources you need.
        </p>
      </div>

      {/* ── Segmented Control / Tabs ── */}
      <div className={styles.tabsWrapper}>
        <div className={styles.segmentedControl} role="tablist" aria-label="Curriculum category switcher">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'school'}
            aria-controls="school-panel"
            id="tab-school"
            className={`${styles.segmentBtn} ${activeTab === 'school' ? styles.segmentBtnActive : ''}`}
            onClick={() => setActiveTab('school')}
          >
            <GraduationCap size={16} aria-hidden="true" />
            <span>NBSE School Classes</span>
            <span className={styles.segmentBadge}>8–12</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'exams'}
            aria-controls="exams-panel"
            id="tab-exams"
            className={`${styles.segmentBtn} ${activeTab === 'exams' ? styles.segmentBtnActive : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <Award size={16} aria-hidden="true" />
            <span>Competitive Exams</span>
            <span className={styles.segmentBadge}>JEE • NEET • CUET</span>
          </button>
        </div>
      </div>

      {/* ── Content Panes ── */}
      {activeTab === 'school' && (
        <div
          id="school-panel"
          role="tabpanel"
          aria-labelledby="tab-school"
          className={`${styles.grid} ${styles.gridSchool}`}
        >
          {SCHOOL_CLASSES.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={styles.card}
              onClick={() =>
                trackClassExamSelect({
                  name: item.displayName,
                  type: 'school_class',
                  destination: item.href,
                })
              }
              aria-label={`Open ${item.displayName} study hub`}
            >
              <div className={styles.accentStrip} style={{ background: item.accent }} />

              <div className={styles.cardTop}>
                <span className={styles.classBadge}>NBSE Board</span>
              </div>

              <h3 className={styles.cardTitle}>{item.displayName}</h3>
              <p className={styles.cardCaption}>{item.caption}</p>

              <div className={styles.tagsRow}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.actionLabel}>View Syllabus &amp; Notes</span>
                <ArrowRight size={14} className={styles.arrowIcon} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'exams' && (
        <div
          id="exams-panel"
          role="tabpanel"
          aria-labelledby="tab-exams"
          className={`${styles.grid} ${styles.gridExams}`}
        >
          {EXAMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={styles.card}
              onClick={() =>
                trackClassExamSelect({
                  name: item.name,
                  type: 'competitive_exam',
                  destination: item.href,
                })
              }
              aria-label={`Open ${item.name} preparation portal`}
            >
              <div className={styles.accentStrip} style={{ background: item.accent }} />

              <div className={styles.cardTop}>
                <span className={styles.classBadge}>{item.fullName}</span>
              </div>

              <h3 className={styles.cardTitle}>{item.name}</h3>
              <p className={styles.cardCaption}>{item.caption}</p>

              <div className={styles.tagsRow}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.actionLabel}>Explore Preparation</span>
                <ArrowRight size={14} className={styles.arrowIcon} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
