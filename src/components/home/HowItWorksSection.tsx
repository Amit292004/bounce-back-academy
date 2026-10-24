import React from 'react';
import styles from './HowItWorksSection.module.css';
import { Search, Play, Trophy, Sparkles } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Discover Resources',
      desc: 'Search our verified study library for syllabus notes, chapter summaries, and authentic past question papers spanning 2016 to the present.',
      icon: <Search size={20} strokeWidth={1.75} />,
    },
    {
      num: '02',
      title: 'Watch & Master',
      desc: 'Learn through our high-performance PW Video Player with precision speed steppers (0.25x to 3x), quality selector, lecture chapters, and notes.',
      icon: <Play size={20} strokeWidth={1.75} />,
    },
    {
      num: '03',
      title: 'Practise & Test',
      desc: 'Solidify your exam readiness with timed interactive MCQ quizzes and previous year exam questions with immediate answer reviews.',
      icon: <Trophy size={20} strokeWidth={1.75} />,
    },
    {
      num: '04',
      title: 'Resolve Doubts with AI',
      desc: 'Never get stuck. Ask Bounce Back AI anytime for clear, step-by-step mathematical derivations and conceptual explanations in English or Hinglish.',
      icon: <Sparkles size={20} strokeWidth={1.75} />,
    },
  ];

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>The Student Journey</p>
        <h2 className={styles.title}>How Bounce Back Academy Works</h2>
        <p className={styles.subtitle}>
          A proven, disciplined 4-step framework engineered to take you from foundational understanding to exam mastery.
        </p>
      </div>

      <div className={styles.grid}>
        {steps.map((s) => (
          <div key={s.num} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>{s.icon}</div>
              <span className={styles.stepNumber}>{s.num}</span>
            </div>
            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.cardDesc}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
