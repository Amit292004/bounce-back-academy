"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.replace('/');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
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
        setError(data.error || 'Google Sign In failed');
      } else {
        if (data.user?.class && data.user.class !== 'Not Selected') {
          localStorage.setItem('selectedClass', data.user.class);
          document.cookie = `selected_class=${encodeURIComponent(data.user.class)}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new Event('profileUpdated'));
        }
        if (data.needsProfile) {
          router.push('/profile?complete=true');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch {
      setError('Something went wrong with Google Sign In. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        if (data.user?.class && data.user.class !== 'Not Selected') {
          localStorage.setItem('selectedClass', data.user.class);
          document.cookie = `selected_class=${encodeURIComponent(data.user.class)}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new Event('profileUpdated'));
        }
        router.push('/');
        router.refresh();
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
          <h1 className="text-gradient">Welcome Back</h1>
          <p>Sign in to access study materials</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.googleWrapper}>
          <GoogleOAuthProvider clientId={(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').replace(/['"]/g, '')}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign In failed')}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              logo_alignment="center"
              width="400"
            />
          </GoogleOAuthProvider>
        </div>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-gradient" style={{ fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
