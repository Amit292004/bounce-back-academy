"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

type Status = 'verifying' | 'success' | 'failed';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id');
  const premiumItemId = searchParams.get('premiumItemId');

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [savedClass, setSavedClass] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cls = localStorage.getItem('selectedClass');
      if (cls && cls !== 'Not Selected') setSavedClass(cls);
    } catch {}
    if (!orderId || !premiumItemId) {
      setStatus('failed');
      setMessage('Invalid payment return. Missing order information.');
      return;
    }

    verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, premiumItemId]);

  const verifyPayment = async () => {
    try {
      const res = await fetch('/api/premium/purchase/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premiumItemId,
          cashfreeOrderId: orderId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Payment successful! Your content is now unlocked.');
      } else {
        setStatus('failed');
        setMessage(data.error || 'Payment verification failed. Please contact support.');
      }
    } catch {
      setStatus('failed');
      setMessage('A network error occurred while verifying your payment. Please contact support.');
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center',
        borderRadius: '1.5rem'
      }}>
        {status === 'verifying' && (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              border: '4px solid rgba(99,102,241,0.15)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Verifying Payment
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>
              Please wait while we confirm your payment with Cashfree...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle style={{
              fontSize: '4rem',
              color: '#10b981',
              marginBottom: '1.25rem'
            }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#10b981' }}>
              Payment Successful! 🎉
            </h2>
            <p style={{ opacity: 0.75, fontSize: '0.95rem', marginBottom: '2rem' }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {premiumItemId && (
                <Link
                  href={`/premium/${premiumItemId}`}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.5rem',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  Access Your Content →
                </Link>
              )}
              <Link
                href={savedClass ? `/class/${encodeURIComponent(savedClass)}?tab=premium` : "/premium"}
                style={{
                  opacity: 0.6,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                {savedClass ? '← Back to Class Dashboard' : '← Back to Premium Store'}
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <FaTimesCircle style={{
              fontSize: '4rem',
              color: '#ef4444',
              marginBottom: '1.25rem'
            }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ef4444' }}>
              Payment Verification Failed
            </h2>
            <p style={{ opacity: 0.75, fontSize: '0.95rem', marginBottom: '2rem' }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {premiumItemId && (
                <Link
                  href={`/premium/${premiumItemId}`}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.5rem',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  Try Again
                </Link>
              )}
              <Link
                href={savedClass ? `/class/${encodeURIComponent(savedClass)}?tab=premium` : "/premium"}
                style={{
                  opacity: 0.6,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                {savedClass ? '← Back to Class Dashboard' : '← Back to Premium Store'}
              </Link>
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.5 }}>
              If your amount was debited, please contact support with your order reference.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
