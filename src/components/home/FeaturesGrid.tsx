import Link from 'next/link';
import { Bot } from 'lucide-react';
import styles from './FeaturesGrid.module.css';

interface ToolItem {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  icon: React.ReactNode;
}

const tools: ToolItem[] = [
  {
    title: 'Question Papers',
    desc: 'NBSE past papers from 2016 onwards — year-wise and chapter-wise, with instant PDF preview.',
    href: '/papers',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: 'Study Notes',
    desc: 'Structured, comprehensive notes for every subject and chapter — free to read, download after login.',
    href: '/notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Video Lectures',
    desc: 'Curated lectures by expert educators, organized by class and subject for focused learning.',
    href: '/videos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: 'AI Doubt Solver',
    desc: 'Ask any question from your NBSE, JEE or NEET syllabus and get step-by-step mathematical solutions and explanations instantly.',
    href: '/ai-tutor',
    badge: 'Free',
    icon: <Bot size={20} strokeWidth={1.75} />,
  },
  {
    title: 'Practice Quiz & Tests',
    desc: 'AI-generated and syllabus-aligned MCQ assessments with real-time scoring, timers, and detailed answer explanations.',
    href: '/quiz',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    title: 'Premium Store',
    desc: 'Unlock exclusive handwritten notes, curated past board papers with model solutions, and structured video courses.',
    href: '/premium',
    badge: 'Store',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
        <path d="M6 15h2M12 15h4"/>
      </svg>
    ),
  },
  {
    title: 'Discussion Forum',
    desc: 'Connect with peers across Nagaland: ask doubts, discuss exam strategies, and exchange study solutions.',
    href: '/forum',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: 'Study Library',
    desc: 'Universal indexed search across all syllabus materials, notes, model question papers, and video lectures.',
    href: '/library',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    title: 'Saved Favourites',
    desc: 'Bookmark any paper, chapter summary, or formula sheet to build your personal offline revision notebook.',
    href: '/favorites',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

export default function FeaturesGrid() {
  return (
    <section className={styles.section} id="platform-tools" aria-labelledby="tools-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>02 //</span> Platform Utilities
        </p>
        <h2 className={styles.title} id="tools-heading">Your Learning Toolkit</h2>
        <p className={styles.sub}>
          Specialized tools and interactive features designed to support your daily preparation beyond standard textbooks.
        </p>
      </div>

      <div className={styles.grid}>
        {tools.map((f) => (
          <Link key={f.title} href={f.href} className={styles.card} aria-label={`Open ${f.title}`}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>{f.icon}</div>
              {f.badge && <span className={styles.badge}>{f.badge}</span>}
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
            <div className={styles.cardFooter}>
              <span className={styles.link}>Launch Tool</span>
              <svg className={styles.arrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
