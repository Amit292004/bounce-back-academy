"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/components/auth/Auth.module.css';
import { logger } from '@/lib/logger';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    className: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/student/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) router.replace('/');
        else setChecking(false);
      })
      .catch(() => setChecking(false));

    fetch('/api/admin/courses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch((err) => {
        logger.error('Failed to load courses for registration:', err);
      });
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!form.className) {
      setError('Please select your class or course');
      return;
    }
    if (!form.email.trim()) {
      setError('Valid email address is required');
      return;
    }
    if (!form.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

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
          const params = new URLSearchParams({ email: form.email.trim().toLowerCase() });
          if (data.devOtp) params.set('devOtp', data.devOtp);
          router.push(`/verify-email?${params.toString()}`);
        } else {
          router.push('/login');
        }
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
      contextualBadge="STUDENT REGISTRATION"
      editorialHeadline="Build your next chapter."
      editorialSubheadline="Learn at your own pace with the resources and courses available on Bounce Back Academy."
      formTitle="Create your account."
      formSubtitle="Join Bounce Back Academy to access study resources, exam preparation, and practical learning opportunities."
      breadcrumbLabel="Create Account"
      maxWidth="wide"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate={false}>
        {/* Responsive 2-Column Section for Name and Class */}
        <div className={styles.formGrid2}>
          {/* Full Name */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
              className={styles.input}
            />
          </div>

          {/* Class Selection */}
          <div className={styles.field}>
            <label htmlFor="className" className={styles.label}>
              Class / Course
            </label>
            <select
              id="className"
              name="className"
              value={form.className}
              onChange={handleChange}
              required
              className={styles.input}
            >
              <option value="">Select your class</option>
              {Array.isArray(courses) && courses.length > 0 ? (
                courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11 Science">Class 11 Science</option>
                  <option value="Class 11 Arts">Class 11 Arts</option>
                  <option value="Class 11 Commerce">Class 11 Commerce</option>
                  <option value="Class 12 Science">Class 12 Science</option>
                  <option value="Class 12 Arts">Class 12 Arts</option>
                  <option value="Class 12 Commerce">Class 12 Commerce</option>
                  <option value="JEE & NEET">JEE &amp; NEET</option>
                  <option value="CUET">CUET</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Responsive 2-Column Section for Email and Mobile */}
        <div className={styles.formGrid2}>
          {/* Email Address */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              maxLength={254}
              className={styles.input}
            />
          </div>

          {/* Mobile Number */}
          <div className={styles.field}>
            <label htmlFor="mobile" className={styles.label}>
              Mobile number
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="10-digit number"
              autoComplete="tel"
              value={form.mobile}
              onChange={handleChange}
              required
              maxLength={20}
              className={styles.input}
            />
          </div>
        </div>

        {/* Password */}
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              maxLength={128}
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

        {/* Create Account Primary Button */}
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
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
                onError={() => setError('Google Sign Up was cancelled or failed.')}
                theme="outline"
                size="large"
                shape="rectangular"
                text="signup_with"
                logo_alignment="center"
                width="380"
              />
            </GoogleOAuthProvider>
          </div>
        </>
      )}

      {/* Switch to Sign In */}
      <div className={styles.switchAuthRow}>
        <span className={styles.switchAuthPrompt}>Already have an account?</span>
        <Link href="/login" className={styles.switchAuthLink}>
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
