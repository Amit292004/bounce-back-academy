'use client';

import { useEffect, useState } from 'react';
import styles from './TestimonialsSection.module.css';

interface Review {
  id: string;
  name: string;
  className: string;
  quote: string;
  score?: string;
}

const FALLBACK: Review[] = [
  { id: 'f1', name: 'Priya Sharma', className: 'Class 12, Science', quote: 'Bounce Back Academy helped me score 92% in my NBSE boards. Having all the past papers in one place and the AI doubt solver made a huge difference.', score: '92%' },
  { id: 'f2', name: 'Rohan Das', className: 'Class 10', quote: 'The AI Doubt Solver is genuinely useful. I used to spend hours stuck on a single problem — now I get clear, step-by-step solutions in seconds.', score: '88%' },
  { id: 'f3', name: 'Anjali Thapa', className: 'Class 11, Mathematics', quote: 'Finally a platform with proper NBSE material. The notes are well-organised, the video lecture links actually work, and everything is completely free.', score: '95%' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
];

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', className: '10', quote: '', score: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.length > 0 ? data : FALLBACK);
      } else {
        setReviews(FALLBACK);
      }
    } catch {
      setReviews(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', className: '10', quote: '', score: '' });
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to submit. Try again.');
      }
    } catch {
      setError('Something went wrong. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = reviews.slice(0, 3);

  return (
    <section className={styles.section}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
        <div className={styles.head} style={{ margin: 0 }}>
          <p className={styles.eyebrow}>Student Reviews</p>
          <h2 className={styles.title}>What students say</h2>
          <p className={styles.sub}>
            Real feedback from Nagaland students preparing for their board exams.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSubmitted(false); setError(''); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: '8px',
            background: 'var(--gradient-primary)', color: 'white',
            fontWeight: 700, fontSize: '0.82rem', border: 'none',
            cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
            transition: 'var(--transition)', whiteSpace: 'nowrap',
          }}
        >
          ✍️ Write a Review
        </button>
      </div>

      {/* Review Cards */}
      <div className={styles.grid}>
        {loading
          ? [0, 1, 2].map(i => (
              <div key={i} className={styles.card}>
                <div style={{ height: '4rem', borderRadius: '6px', background: 'var(--skeleton-base)', marginBottom: '1rem' }} className="skeleton" />
                <div style={{ height: '1rem', borderRadius: '6px', background: 'var(--skeleton-base)', width: '60%' }} className="skeleton" />
              </div>
            ))
          : displayed.map((r, i) => (
              <div key={r.id} className={styles.card}>
                {/* Stars */}
                <div style={{ color: '#f59e0b', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.25rem' }}>
                  ★★★★★
                </div>
                <p className={styles.quote}>&ldquo;{r.quote}&rdquo;</p>
                <div className={styles.author}>
                  <div
                    className={styles.avatar}
                    style={{
                      background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      border: 'none',
                      opacity: 1,
                    }}
                  >
                    {getInitials(r.name)}
                  </div>
                  <div>
                    <div className={styles.authorName}>{r.name}</div>
                    <div className={styles.authorMeta}>{r.className}</div>
                  </div>
                  {r.score && <div className={styles.score}>{r.score}</div>}
                </div>
              </div>
            ))
        }
      </div>

      {/* Review submission modal */}
      {showForm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%', maxWidth: '480px',
            boxShadow: 'var(--shadow-md), var(--shadow-glow-lg)',
            position: 'relative',
          }}>
            {/* Close */}
            <button
              onClick={() => setShowForm(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'var(--surface-card)', border: '1px solid var(--surface-border)',
                borderRadius: '50%', width: '30px', height: '30px',
                cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, transition: 'var(--transition)',
              }}
            >✕</button>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                  Thank you for your review!
                </h3>
                <p style={{ opacity: 0.6, fontSize: '0.88rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
                  Your review is pending approval and will appear on the homepage soon.
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.55rem 1.5rem', borderRadius: '8px',
                    background: 'var(--gradient-primary)', color: 'white',
                    fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                  ✍️ Share Your Experience
                </h3>
                <p style={{ opacity: 0.55, fontSize: '0.82rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
                  Your review helps other students discover Bounce Back Academy.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, color: 'var(--foreground)', display: 'block', marginBottom: '0.35rem' }}>
                        YOUR NAME *
                      </label>
                      <input
                        required
                        placeholder="e.g. Priya Sharma"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        style={{
                          width: '100%', padding: '0.6rem 0.8rem',
                          borderRadius: '8px', border: '1px solid var(--surface-border)',
                          background: 'var(--surface-card)', color: 'var(--foreground)',
                          fontSize: '0.85rem', outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, color: 'var(--foreground)', display: 'block', marginBottom: '0.35rem' }}>
                        CLASS *
                      </label>
                      <select
                        value={form.className}
                        onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                        style={{
                          width: '100%', padding: '0.6rem 0.8rem',
                          borderRadius: '8px', border: '1px solid var(--surface-border)',
                          background: 'var(--surface-card)', color: 'var(--foreground)',
                          fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {['8','9','10','11','12','CUET','JEE','NEET'].map(c => (
                          <option key={c} value={`Class ${c}`}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, color: 'var(--foreground)', display: 'block', marginBottom: '0.35rem' }}>
                      YOUR REVIEW *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How has Bounce Back Academy helped you? (min 20 characters)"
                      value={form.quote}
                      onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                      style={{
                        width: '100%', padding: '0.6rem 0.8rem',
                        borderRadius: '8px', border: '1px solid var(--surface-border)',
                        background: 'var(--surface-card)', color: 'var(--foreground)',
                        fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                        minHeight: '100px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, color: 'var(--foreground)', display: 'block', marginBottom: '0.35rem' }}>
                      YOUR SCORE (Optional)
                    </label>
                    <input
                      placeholder="e.g. 92%"
                      value={form.score}
                      onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                      style={{
                        width: '100%', padding: '0.6rem 0.8rem',
                        borderRadius: '8px', border: '1px solid var(--surface-border)',
                        background: 'var(--surface-card)', color: 'var(--foreground)',
                        fontSize: '0.85rem', outline: 'none',
                      }}
                    />
                  </div>

                  {error && (
                    <p style={{ color: 'var(--error)', fontSize: '0.8rem', margin: 0 }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || form.quote.length < 20}
                    style={{
                      padding: '0.65rem', borderRadius: '8px',
                      background: 'var(--gradient-primary)', color: 'white',
                      fontWeight: 700, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.88rem', opacity: (submitting || form.quote.length < 20) ? 0.6 : 1,
                      transition: 'var(--transition)',
                    }}
                  >
                    {submitting ? 'Submitting...' : '🚀 Submit Review'}
                  </button>
                  <p style={{ fontSize: '0.72rem', opacity: 0.45, textAlign: 'center', color: 'var(--foreground)', margin: 0 }}>
                    Reviews are reviewed by our team before appearing publicly.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
