import Link from 'next/link';
import styles from './FeaturesGrid.module.css';

const features = [
  {
    title: 'Question Papers',
    desc: 'NBSE past papers from 2016 onwards — year-wise and chapter-wise, with instant PDF preview.',
    href: '/papers',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    title: 'Study Notes',
    desc: 'Structured, comprehensive notes for every subject and chapter — free to read, download after login.',
    href: '/notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    title: 'Video Lectures',
    desc: 'Curated lectures by expert educators, organized by class and subject for focused learning.',
    href: '/videos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    title: 'AI Doubt Solver',
    desc: 'Ask any question from your NBSE, JEE or NEET syllabus and get clear, step-by-step answers instantly.',
    href: '/ask',
    badge: 'Free',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
  },
  {
    title: 'Practice Quiz',
    desc: 'AI-generated MCQs from your syllabus. Test your knowledge topic-by-topic with instant scoring.',
    href: '/quiz',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    title: 'Leaderboard',
    desc: 'Earn XP for every activity, climb the weekly rankings, and see how you compare with your peers.',
    href: '/leaderboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    title: 'Discussion Forum',
    desc: 'Post questions, discuss problems and learn alongside thousands of NBSE students.',
    href: '/forum',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: 'Saved Favourites',
    desc: 'Bookmark any paper or note and build your own personal revision library.',
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
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Platform</p>
        <h2 className={styles.title}>Everything in one place</h2>
        <p className={styles.sub}>
          Every tool a Nagaland student needs — from past papers to AI tutoring.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((f) => (
          <Link key={f.title} href={f.href} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>{f.icon}</div>
              {f.badge && <span className={styles.badge}>{f.badge}</span>}
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
            <div className={styles.cardFooter}>
              <span className={styles.link}>Learn more</span>
              <svg className={styles.arrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
