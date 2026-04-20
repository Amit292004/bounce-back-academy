"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEnvelopeOpenText, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const devOtp = searchParams.get('devOtp');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/student/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/profile'), 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.join('').length === 6) {
      handleSubmit();
    }
  }, [otp]);

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaCheckCircle style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '1.5rem' }} />
        <h1 style={{ marginBottom: '1rem' }}>Email Verified!</h1>
        <p style={{ opacity: 0.7 }}>Redirecting you to your profile...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '450px', margin: '4rem auto', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <FaEnvelopeOpenText style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verify your email</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>We've sent a 6-digit code to <br/><strong>{email}</strong></p>
        
        {devOtp && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', fontSize: '0.85rem', color: '#f59e0b' }}>
            <strong>⚠️ Dev Mode:</strong> Email not configured.<br/>
            Your OTP is: <strong style={{ fontSize: '1.1rem', letterSpacing: '3px' }}>{devOtp}</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              autoFocus={index === 0}
              style={{
                width: '45px',
                height: '55px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '2px solid var(--surface-border)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--foreground)',
                outline: 'none',
                transition: 'var(--transition)',
                borderColor: digit ? 'var(--primary)' : 'var(--surface-border)',
                boxShadow: digit ? '0 0 10px rgba(99,102,241,0.2)' : 'none'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <FaExclamationCircle /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join('').length < 6}
          className="btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontWeight: 600 }}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
          Didn't receive the code? <button type="button" onClick={() => window.location.reload()} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend</button>
        </p>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
