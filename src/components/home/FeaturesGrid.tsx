import Link from 'next/link';
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
    title: 'AI Doubt Solver',
    desc: 'Ask any question from your NBSE, JEE or NEET syllabus and get step-by-step mathematical solutions and explanations instantly.',
    href: '/ai-tutor',
    badge: 'Free',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
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
        <p className={styles.eyebrow}>Platform Utilities</p>
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
