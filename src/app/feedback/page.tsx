"use client";

import { useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import styles from './page.module.css';

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', className: '10', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Support</span>
        </div>
        <h1 className={styles.title}>Contact Support</h1>
        <p className={styles.subtitle}>
          Having trouble? Want to report a bug? Send us a message and our team will look into it.
        </p>
      </div>

      <div className={styles.contentWrapper}>
        {submitted ? (
          <div className={`${styles.formCard} ${styles.successCard}`}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <h2 className={styles.successTitle}>Message Sent!</h2>
            <p className={styles.successText}>
              Thank you for reaching out. Our team will review your message shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary"
            >
              Send Another Message
            </button>
          </div>
        ) : (
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
                <label htmlFor="message">Your Issue or Question</label>
                <textarea
                  id="message"
                  placeholder="Describe your issue or ask a question..."
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                <FaPaperPlane size={13} /> {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
