import styles from './TestimonialsSection.module.css';

const testimonials = [
  {
    name: 'Priya Sharma',
    class: 'Class 12, Science',
    quote: 'Bounce Back Academy helped me score 92% in my NBSE boards. Having all the past papers in one place and the AI doubt solver made a huge difference in my preparation.',
    score: '92%',
    initials: 'PS',
  },
  {
    name: 'Rohan Das',
    class: 'Class 10',
    quote: 'The AI Doubt Solver is genuinely useful. I used to spend hours stuck on a single problem — now I get clear, step-by-step solutions in seconds.',
    score: '88%',
    initials: 'RD',
  },
  {
    name: 'Anjali Thapa',
    class: 'Class 11, Mathematics',
    quote: 'Finally a platform with proper NBSE material. The notes are well-organised, the video lecture links actually work, and everything is completely free.',
    score: '95%',
    initials: 'AT',
  },
];

export default function TestimonialsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Student Reviews</p>
        <h2 className={styles.title}>What students say</h2>
        <p className={styles.sub}>
          Thousands of Nagaland students use Bounce Back Academy to prepare for their board exams.
        </p>
      </div>

      <div className={styles.grid}>
        {testimonials.map((t) => (
          <div key={t.name} className={styles.card}>
            <p className={styles.quote}>{t.quote}</p>
            <div className={styles.author}>
              <div className={styles.avatar}>{t.initials}</div>
              <div>
                <div className={styles.authorName}>{t.name}</div>
                <div className={styles.authorMeta}>{t.class}</div>
              </div>
              <div className={styles.score}>{t.score}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
