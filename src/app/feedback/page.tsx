"use client";

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaCheckCircle, FaComments, FaQuoteLeft } from 'react-icons/fa';
import styles from './page.module.css';

interface FeedbackItem {
  id: string;
  name: string;
  className: string;
  message: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', className: '10', message: '' });
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) setFeedbacks(await res.json());
    } catch {
      // silent fail for list
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitted(true);
        fetchFeedbacks(); // Refresh list
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (submitted) {
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 0' }}>
          <div className={`${styles.formCard} ${styles.successCard}`}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Thank You!</h2>
            <p style={{ opacity: 0.7, fontSize: '1.1rem', marginBottom: '2rem' }}>
              Your feedback has been received. We appreciate your input and will use it to improve the academy.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="btn-secondary"
              style={{ padding: '0.75rem 2rem' }}
            >
              Submit Another
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 0 4rem' }}>
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="className">Class</label>
              <select
                id="className"
                value={form.className}
                onChange={e => setForm({ ...form, className: e.target.value })}
                required
              >
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="CUET">CUET</option>
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                placeholder="What's on your mind?"
                rows={5}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              <FaPaperPlane /> {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div style={{ padding: '5rem 2rem 3rem 2rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
          padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.875rem', 
          marginBottom: '1.5rem', backdropFilter: 'blur(10px)' 
        }}>
          <FaComments /> Feedback
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Share Your <span className="text-gradient">Feedback</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Help us improve Bounce Back Academy by sharing your thoughts, suggestions, or issues.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        {renderContent()}

        {/* Feedback List */}
        <div className={styles.listSection}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
            What Others Are <span className="text-gradient">Saying</span>
          </h3>

          {listLoading ? (
            <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading feedback...</p>
          ) : feedbacks.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5 }}>No feedback shared yet. Be the first!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {feedbacks.map(fb => (
                <div key={fb.id} className={styles.feedbackCard}>
                  <div className={styles.feedbackHeader}>
                    <div>
                      <span className={styles.userName}>{fb.name}</span>
                      <span className={styles.userClass}>Class {fb.className}</span>
                    </div>
                    <span className={styles.date}>
                      {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className={styles.message}>
                    <FaQuoteLeft style={{ opacity: 0.2, marginRight: '0.5rem', fontSize: '0.8rem' }} />
                    {fb.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
