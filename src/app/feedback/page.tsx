"use client";

import { useState } from 'react';
import { FaPaperPlane, FaCheckCircle, FaHeadset } from 'react-icons/fa';
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

  const renderContent = () => {
    if (submitted) {
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 0' }}>
          <div className={`${styles.formCard} ${styles.successCard}`}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Message Sent!</h2>
            <p style={{ opacity: 0.7, fontSize: '1.1rem', marginBottom: '2rem' }}>
              Thank you for reaching out. Our team will review your message shortly.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="btn-secondary"
              style={{ padding: '0.75rem 2rem' }}
            >
              Send Another Message
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
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              <FaPaperPlane /> {loading ? 'Sending...' : 'Send Message'}
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
          <FaHeadset /> Support
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Contact <span className="text-gradient">Support</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Having trouble? Want to report a bug? Send us a message and our team will look into it.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        {renderContent()}
      </div>
    </div>
  );
}
