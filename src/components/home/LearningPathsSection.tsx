import React from 'react';
import Link from 'next/link';
import styles from './LearningPathsSection.module.css';
import { GraduationCap, BookOpen, Sparkles, Code2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function LearningPathsSection() {
  const paths = [
    {
      title: 'NBSE School Learning',
      desc: 'Aligned with the Nagaland Board of School Education for Classes 8 through 12. Full subject coverage with chapter notes and past board exams.',
      href: '/school',
      actionLabel: 'Select Your Class & Browse',
      icon: <GraduationCap size={20} strokeWidth={1.75} />,
      badges: ['Class 8–10', 'Class 11–12', 'NBSE Syllabus', 'Past Papers'],
    },
    {
      title: 'Competitive Exam Prep',
      desc: 'Strategic preparation for national entrance tests: JEE Main & Advanced, NEET UG, and CUET with formula sheets and previous mock papers.',
      href: '/exams',
      actionLabel: 'Explore Exam Paths',
      icon: <BookOpen size={20} strokeWidth={1.75} />,
      badges: ['JEE Main', 'NEET UG', 'CUET', 'Mock Tests'],
    },
    {
      title: 'Bounce Back AI Tutor',
      desc: 'Instant academic doubt resolution powered by modern AI. Step-by-step mathematical derivations, concept summaries, and multi-language support.',
      href: '/ai-tutor',
      actionLabel: 'Launch Free AI Tutor',
      badge: 'Free',
      icon: <Sparkles size={20} strokeWidth={1.75} />,
      badges: ['Step-by-Step', 'LaTeX Math', 'Hinglish & English'],
    },
    {
      title: 'Practical Skill Courses',
      desc: 'Real-world career competencies beyond textbooks. Master modern AI tools, full-stack programming, and essential digital workflows.',
      href: '/skills',
      actionLabel: 'Browse Skill Courses',
      badge: 'New',
      icon: <Code2 size={20} strokeWidth={1.75} />,
      badges: ['AI Tools Mastery', 'Web Dev', 'Coding', 'AI Productivity'],
    },
  ];

  return (
    <section className={styles.section} id="learning-paths">
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>Connected Learning Ecosystem</p>
        <h2 className={styles.title}>Four Pathways. One Cohesive Platform.</h2>
        <p className={styles.subtitle}>
          Whether you are preparing for NBSE board exams, cracking competitive entrance tests,
          clearing tricky doubts, or acquiring career skills — choose your path below.
        </p>
      </div>

      <div className={styles.grid}>
        {paths.map((p) => (
          <Link key={p.title} href={p.href} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>{p.icon}</div>
              {p.badge && <span className={styles.badge}>{p.badge}</span>}
            </div>
            <h3 className={styles.cardTitle}>{p.title}</h3>
            <p className={styles.cardDesc}>{p.desc}</p>
            <div className={styles.pillsRow}>
              {p.badges.map((b) => (
                <Badge key={b} variant="default" size="sm">
                  {b}
                </Badge>
              ))}
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.link}>{p.actionLabel}</span>
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
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
