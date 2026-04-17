"use client";

import { useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import styles from './page.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', className: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ name: '', className: '', message: '' });
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to send. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Get in <span className="text-gradient">Touch</span>
        </h1>
        <p style={{ opacity: 0.7, marginBottom: '3rem' }}>Have feedback, questions, or suggestions? We&apos;d love to hear from you.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.15)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
                <FaEnvelope />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Email Us</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>bouncebackacademy@gmail.com</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(139,92,246,0.15)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '1rem' }}>
                <FaMapMarkerAlt />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Location</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Nagaland, India</p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <FaCheckCircle style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }} />
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p style={{ opacity: 0.7 }}>Thank you for reaching out. We&apos;ll get back to you soon.</p>
                <button onClick={() => setSuccess(false)} className="btn-primary" style={{ marginTop: '1.5rem' }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Your Name</label>
                  <input name="name" type="text" placeholder="Full name" value={form.name} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Your Class</label>
                  <select name="className" value={form.className} onChange={handleChange} required style={{ ...inputStyle, background: 'rgba(30,41,59,0.9)' }}>
                    <option value="">Select your class</option>
                    {[8, 9, 10, 11, 12].map(c => <option key={c} value={String(c)}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Message</label>
                  <textarea
                    name="message"
                    placeholder="Your feedback, question, or suggestion..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none',
  fontFamily: 'inherit', fontSize: '1rem',
};
