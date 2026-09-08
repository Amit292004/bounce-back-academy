"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff, User, GraduationCap, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import styles from '../login/page.module.css';
import { logger } from '@/lib/logger'

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', className: '', email: '', mobile: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch(console.error);
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
          <div className={styles.logoWrapper}>
            <Link href="/" className={styles.logoLink} title="Bounce Back Academy">
              <Image src="/logo.png" alt="Bounce Back Academy" width={48} height={48} className={styles.logoImg} priority />
            </Link>
          </div>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Sign up to access courses, past papers, and study materials</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><User size={16} /></span>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="className">Your Class</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><GraduationCap size={16} /></span>
              <select
                id="className"
                name="className"
                value={form.className}
                onChange={handleChange}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              >
                <option value="">Select class</option>
                {Array.isArray(courses) && courses.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><Mail size={16} /></span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="mobile">Mobile Number</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}><Phone size={16} /></span>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
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
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
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
            {loading ? 'Creating account...' : <>Create Account <ArrowRight size={16} /></>}
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
              theme="outline"
              size="large"
              shape="rectangular"
              text="signup_with"
              logo_alignment="center"
            />
          </GoogleOAuthProvider>
        </div>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
