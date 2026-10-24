"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/components/auth/Auth.module.css';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send recovery code');
      } else {
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setStep(2);
        setResendCooldown(30);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length === 0) return;
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
      } else {
        setResendCooldown(30);
        if (data.devOtp) setDevOtp(data.devOtp);
      }
    } catch {
      setError('Unable to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('').trim();

    if (otpString.length < 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpString,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setStep(3);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Success Confirmation View
  if (step === 3) {
    return (
      <AuthLayout
        contextualBadge="PASSWORD RESET"
        editorialHeadline="Back to learning."
        editorialSubheadline="Recover your account and continue where you left off."
        formTitle="Password updated."
        formSubtitle="Your password has been reset successfully."
        breadcrumbLabel="Password Updated"
      >
        <div style={{ textAlign: 'left', padding: '0.25rem 0 0.5rem' }}>
          <p style={{ color: '#71717a', fontSize: '0.9375rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            You can now sign in to your Bounce Back Academy account using your updated password.
          </p>

          <Link
            href="/login"
            className={styles.submitBtn}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span>Sign In to Account</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Step 2: Check Your Email & Set New Password View
  if (step === 2) {
    return (
      <AuthLayout
        contextualBadge="VERIFICATION CODE"
        editorialHeadline="Back to learning."
        editorialSubheadline="Recover your account and continue where you left off."
        formTitle="Check your email."
        formSubtitle={`If an account exists for ${email}, password reset instructions will be sent to it.`}
        breadcrumbLabel="Reset Password"
      >
        <form onSubmit={handleResetPassword} className={styles.form}>
          {/* Dev Mode Notification */}
          {devOtp && (
            <div className={styles.alertWarning}>
              <div>
                <strong>Dev Mode:</strong> OTP for testing is <strong>{devOtp}</strong>
              </div>
            </div>
          )}

          {/* 6-Digit OTP */}
          <div className={styles.field}>
            <label className={styles.label}>6-digit verification code</label>
            <div className={styles.otpGroup}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  autoFocus={index === 0}
                  aria-label={`Digit ${index + 1}`}
                  className={styles.otpDigit}
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div className={styles.field}>
            <label htmlFor="newPassword" className={styles.label}>
              New password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={`${styles.input} ${styles.inputHasToggle}`}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm new password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={`${styles.input} ${styles.inputHasToggle}`}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.alertError} role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Submit Reset Button */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                <span>Updating password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>

          {/* Resend Action */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
            <span style={{ color: '#71717a' }}>Didn&apos;t get the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? '#9ca3af' : 'inherit',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

          <div className={styles.switchAuthRow}>
            <Link href="/login" className={styles.switchAuthLink}>
              Back to Sign In
            </Link>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // Step 1: Initial Request View
  return (
    <AuthLayout
      contextualBadge="ACCOUNT RECOVERY"
      editorialHeadline="Back to learning."
      editorialSubheadline="Recover your account and continue where you left off."
      formTitle="Forgot your password?"
      formSubtitle="Enter the email address associated with your account to receive password reset instructions."
      breadcrumbLabel="Forgot Password"
    >
      <form onSubmit={handleRequestOtp} className={styles.form}>
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

        {error && (
          <div className={styles.alertError} role="alert">
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span>Sending instructions...</span>
            </>
          ) : (
            <span>Send Reset Code</span>
          )}
        </button>

        <div className={styles.switchAuthRow}>
          <span className={styles.switchAuthPrompt}>Remember your password?</span>
          <Link href="/login" className={styles.switchAuthLink}>
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#71717a' }}>Loading...</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
