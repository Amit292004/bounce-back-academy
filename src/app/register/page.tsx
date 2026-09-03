"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from '../login/page.module.css';
import { logger } from '@/lib/logger'

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', className: '', email: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [courses, setCourses] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) router.replace('/');
        else setChecking(false);
      })
      .catch(() => setChecking(false));

    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(console.error);
  }, [router]);

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
        if (data.needsProfile) {
          router.push('/profile?complete=true');
        } else {
          router.push('/');
        }
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
        if (data.details) logger.error('Registration details:', data.details);
      } else {
        if (data.requiresVerification) {
          // Pass devOtp in URL for local testing when email isn't configured
          const params = new URLSearchParams({ email: form.email });
          if (data.devOtp) params.set('devOtp', data.devOtp);
          router.push(`/verify-email?${params.toString()}`);
        } else {
          router.push('/login');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: 0.4 }}>Loading...</div>
      </div>
    );
  }

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
              <option value="" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>Select class</option>
              {courses.map(c => (
                <option key={c.id} value={c.name} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="mobile">Mobile Number</label>
            <input id="mobile" name="mobile" type="tel" placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} className={styles.input} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.googleWrapper}>
          <GoogleOAuthProvider clientId={(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').replace(/['"]/g, '')}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign Up failed')}
              theme="filled_black"
              size="large"
              shape="rectangular"
              text="signup_with"
              logo_alignment="center"
              width="400"
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
