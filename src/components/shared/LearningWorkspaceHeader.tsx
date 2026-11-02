'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  LayoutGrid,
  BookOpen,
  Star,
  Bell,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import styles from './LearningWorkspaceHeader.module.css';

export type WorkspaceTab = 'home' | 'study' | 'premium' | 'notices';

interface LearningWorkspaceHeaderProps {
  className: string;
  displayTitle: string;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenClassSwitcher: () => void;
  backHref?: string;
  backLabel?: string;
  counts?: {
    study?: number;
    premium?: number;
    notices?: number;
  };
}

export default function LearningWorkspaceHeader({
  className,
  displayTitle,
  activeTab,
  onTabChange,
  onOpenClassSwitcher,
  backHref = '/school',
  backLabel = 'Back to School Learning',
  counts,
}: LearningWorkspaceHeaderProps) {
  const upper = className.toUpperCase();
  const isSkills = ['SKILLS', 'PRACTICAL SKILLS', 'PRACTICAL-SKILLS'].includes(upper);
  const isSpecialExam = ['CUET', 'JEE', 'NEET'].includes(upper);

  const categoryBadge = isSkills
    ? 'Career & Tech'
    : isSpecialExam
      ? 'Competitive Prep'
      : className.includes('10')
        ? 'HSLC Board'
        : className.includes('12')
          ? 'HSSLC Board'
          : 'NBSE Curriculum';

  const subtitle = isSkills
    ? 'Practical career competencies, AI tools, and programming fundamentals'
    : isSpecialExam
      ? 'Comprehensive syllabus notes, mock test papers, and high-yield video lectures'
      : `Official syllabus notes, solved board papers, and video lessons for ${displayTitle}`;

  const resolvedBackHref = isSkills ? '/#class-finder' : isSpecialExam ? '/exams' : backHref;
  const resolvedBackLabel = isSkills ? 'Back to Curriculum Directory' : isSpecialExam ? 'Back to Competitive Exams' : backLabel;

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'home', label: 'Overview', icon: <LayoutGrid size={18} /> },
    { id: 'study', label: 'Study Material', icon: <BookOpen size={18} />, count: counts?.study },
    { id: 'premium', label: 'Premium Store', icon: <Star size={18} />, count: counts?.premium },
    { id: 'notices', label: 'Notices', icon: <Bell size={18} />, count: counts?.notices },
  ];

  return (
    <header className={styles.workspaceHeader}>
      <div className={styles.headerCard}>
        {/* Top row: Identity & Actions */}
        <div className={styles.topRow}>
          <div className={styles.identityArea}>
            <Link
              href={resolvedBackHref}
              className={styles.backBtn}
              title={resolvedBackLabel}
              aria-label={resolvedBackLabel}
            >
              <ChevronLeft size={20} />
            </Link>

            <div className={styles.titles}>
              <div className={styles.titleRow}>
                <h1 className={styles.className}>{displayTitle}</h1>
                <span className={styles.badge}>{categoryBadge}</span>
              </div>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
          </div>

          <div className={styles.actionsArea}>
            <button
              type="button"
              className={styles.switchClassBtn}
              onClick={onOpenClassSwitcher}
              aria-label={`Change class or exam from ${displayTitle}`}
            >
              <GraduationCap size={16} />
              <span>Change Class</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom row: Workspace Navigation Tabs */}
        <nav className={styles.tabsRow} aria-label="Class workspace navigation">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className={styles.tabCount}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
