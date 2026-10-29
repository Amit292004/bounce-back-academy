'use client';

import React from 'react';
import {
  BookOpen,
  FileText,
  Video as VideoIcon,
  Trophy,
  ChevronRight,
  Calculator,
  Atom,
  FlaskConical,
  Globe2,
  Code2,
  Languages,
} from 'lucide-react';
import styles from './SubjectCard.module.css';

interface SubjectCardProps {
  id: string;
  name: string;
  chaptersCount: number;
  notesCount: number;
  videosCount: number;
  papersCount: number;
  quizzesCount: number;
  onClick: () => void;
  featured?: boolean;
}

export function getSubjectMeta(name: string) {
  const n = name.toLowerCase();
  if (n.includes('math')) {
    return {
      icon: <Calculator size={26} />,
      bg: 'rgba(99, 102, 241, 0.12)',
      color: '#6366f1',
      category: 'STEM',
    };
  }
  if (n.includes('physics')) {
    return {
      icon: <Atom size={26} />,
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#3b82f6',
      category: 'Science',
    };
  }
  if (n.includes('chemistry')) {
    return {
      icon: <FlaskConical size={26} />,
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#10b981',
      category: 'Science',
    };
  }
  if (n.includes('science')) {
    return {
      icon: <FlaskConical size={26} />,
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#10b981',
      category: 'Science',
    };
  }
  if (n.includes('computer')) {
    return {
      icon: <Code2 size={26} />,
      bg: 'rgba(168, 85, 247, 0.12)',
      color: '#a855f7',
      category: 'Technology',
    };
  }
  if (n.includes('social')) {
    return {
      icon: <Globe2 size={26} />,
      bg: 'rgba(245, 158, 11, 0.12)',
      color: '#f59e0b',
      category: 'Humanities',
    };
  }
  if (n.includes('english') || n.includes('hindi')) {
    return {
      icon: <Languages size={26} />,
      bg: 'rgba(236, 72, 153, 0.12)',
      color: '#ec4899',
      category: 'Languages',
    };
  }
  return {
    icon: <BookOpen size={26} />,
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#6366f1',
    category: 'General',
  };
}

export default function SubjectCard({
  id,
  name,
  chaptersCount,
  notesCount,
  videosCount,
  papersCount,
  quizzesCount,
  onClick,
  featured = false,
}: SubjectCardProps) {
  const meta = getSubjectMeta(name);
  const totalResources = notesCount + videosCount + papersCount + quizzesCount;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open ${name} subject. ${chaptersCount} chapters, ${totalResources} resources available.`}
    >
      <div className={styles.cardTop}>
        <div
          className={styles.iconWrapper}
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>
        <span className={styles.badge}>{meta.category}</span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.stats}>
          {chaptersCount > 0
            ? `${chaptersCount} Chapter${chaptersCount > 1 ? 's' : ''}`
            : 'Curriculum Resources'}{' '}
          · {totalResources} Material{totalResources !== 1 ? 's' : ''}
        </p>

        <div className={styles.breakdownPills}>
          {notesCount > 0 && (
            <span className={styles.pill} title={`${notesCount} Notes`}>
              <FileText size={14} /> {notesCount} Notes
            </span>
          )}
          {videosCount > 0 && (
            <span className={styles.pill} title={`${videosCount} Lectures`}>
              <VideoIcon size={14} /> {videosCount} Videos
            </span>
          )}
          {papersCount > 0 && (
            <span className={styles.pill} title={`${papersCount} Papers`}>
              <BookOpen size={14} /> {papersCount} Papers
            </span>
          )}
          {quizzesCount > 0 && (
            <span className={styles.pill} title={`${quizzesCount} Quizzes`}>
              <Trophy size={14} /> {quizzesCount} Quizzes
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.actionText}>
          Explore Subject
          <ChevronRight size={18} className={styles.arrow} />
        </span>
      </div>
    </div>
  );
}
