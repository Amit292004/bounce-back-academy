"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/components/auth/Auth.module.css';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const devOtp = searchParams.get('devOtp');

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [currentDevOtp, setCurrentDevOtp] = useState<string | null>(devOtp);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) {
      handlePaste(value);
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

  const handlePaste = (pastedText: string) => {
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const newOtp = [...otp];
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpString = otp.join('').trim();
    if (otpString.length < 6) return;

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/student/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        window.dispatchEvent(new Event('profileUpdated'));
        setTimeout(() => router.push('/profile'), 1800);
      } else {
        setError(data.error || 'Verification failed. Please check your code.');
      }
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 6) {
      handleSubmit();
    }
  }, [otp]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/student/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
      } else {
        setInfoMessage('A fresh verification code has been dispatched.');
        setResendCooldown(30);
        if (data.devOtp) setCurrentDevOtp(data.devOtp);
      }
    } catch {
      setError('Unable to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'left', padding: '0.5rem 0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 650, marginBottom: '0.5rem', color: 'inherit' }}>
          Email Verified Successfully
        </h3>
        <p style={{ color: '#71717a', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          Your account is confirmed. Redirecting to your student dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Dev Mode Notification */}
      {currentDevOtp && (
        <div className={styles.alertWarning}>
          <div>
            <strong>Dev Mode:</strong> OTP for testing is <strong>{currentDevOtp}</strong>
          </div>
        </div>
      )}

      {/* Info Notice */}
      {infoMessage && (
        <div className={styles.alertSuccess}>
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className={styles.alertError} role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* 6-Digit OTP */}
      <div
        className={styles.otpGroup}
        onPaste={(e) => {
          e.preventDefault();
          handlePaste(e.clipboardData.getData('text'));
        }}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            autoFocus={index === 0}
            aria-label={`Digit ${index + 1}`}
            className={styles.otpDigit}
          />
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || otp.join('').length < 6}
        className={styles.submitBtn}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            <span>Verifying code...</span>
          </>
        ) : (
          <span>Verify Email</span>
        )}
      </button>

      {/* Resend Action */}
      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8125rem' }}>
        <span style={{ color: '#71717a' }}>Didn&apos;t receive the code? </span>
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
        <Link href="/register" className={styles.switchAuthLink}>
          Back to registration
        </Link>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#71717a' }}>Loading...</div>
        </div>
      }
    >
      <VerifyEmailWrapper />
    </Suspense>
  );
}

function VerifyEmailWrapper() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <AuthLayout
      contextualBadge="EMAIL VERIFICATION"
      editorialHeadline="Verify your account."
      editorialSubheadline="Secure your access to study resources, lectures, and practice materials."
      formTitle="Verify your email."
      formSubtitle={`Enter the 6-digit confirmation code sent to ${email}`}
      breadcrumbLabel="Verify Email"
      maxWidth="default"
    >
      <VerifyEmailForm />
    </AuthLayout>
  );
}
