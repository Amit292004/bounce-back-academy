"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/components/auth/Auth.module.css';

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
      .then((res) => res.json())
      .then((data) => {
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
          setError(data.error || 'Invalid email or password');
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
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#71717a', fontSize: '0.875rem' }}>
          <div className={styles.spinner} />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').replace(/['"]/g, '');

  return (
    <AuthLayout
      contextualBadge="STUDENT ACCOUNT"
      editorialHeadline="Your next chapter starts here."
      editorialSubheadline="Access study resources, prepare for competitive exams, and develop practical skills with Bounce Back Academy."
      formTitle="Welcome back."
      formSubtitle="Sign in to continue learning with Bounce Back Academy."
      breadcrumbLabel="Sign In"
      maxWidth="default"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate={false}>
        {/* Email Address */}
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        {/* Password */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <Link href="/forgot-password" className={styles.forgotLink} tabIndex={0}>
              Forgot password?
            </Link>
          </div>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${styles.input} ${styles.inputHasToggle}`}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.alertError} role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Primary Sign In Button */}
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Alternative Social Sign In */}
      {googleClientId && (
        <>
          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.googleWrapper}>
            <GoogleOAuthProvider clientId={googleClientId}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign In was cancelled or failed.')}
                theme="outline"
                size="large"
                shape="rectangular"
                text="continue_with"
                logo_alignment="center"
                width="380"
              />
            </GoogleOAuthProvider>
          </div>
        </>
      )}

      {/* Switch to Register (Intentional Non-Cramped Wrapping) */}
      <div className={styles.switchAuthRow}>
        <span className={styles.switchAuthPrompt}>New to Bounce Back Academy?</span>
        <Link href="/register" className={styles.switchAuthLink}>
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
}
