"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
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
          <div className={styles.logoWrapper}>
            <Link href="/" className={styles.logoLink} title="Bounce Back Academy">
              <Image src="/logo.png" alt="Bounce Back Academy" width={48} height={48} className={styles.logoImg} priority />
            </Link>
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Enter your details to sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><Mail size={16} /></span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><Lock size={16} /></span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${styles.input} ${styles.inputWithIcon} ${styles.inputHasToggle}`}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
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
            />
          </GoogleOAuthProvider>
        </div>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
