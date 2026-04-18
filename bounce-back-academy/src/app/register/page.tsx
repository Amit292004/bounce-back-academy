"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', className: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google Sign Up failed');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong with Google Sign Up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.header}>
          <h1 className="text-gradient">Join Free</h1>
          <p>Create your account to download materials</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="className">Your Class</label>
            <select
              id="className"
              name="className"
              value={form.className}
              onChange={handleChange}
              required
              className={styles.input}
            >
              <option value="">Select class</option>
              {[8, 9, 10, 11, 12].map(c => (
                <option key={c} value={String(c)}>Class {c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} className={styles.input} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
          <div style={{ flex: 1, borderBottom: '1px solid currentColor' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.875rem' }}>or</span>
          <div style={{ flex: 1, borderBottom: '1px solid currentColor' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign Up failed')}
              useOneTap
            />
          </GoogleOAuthProvider>
        </div>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className="text-gradient" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
