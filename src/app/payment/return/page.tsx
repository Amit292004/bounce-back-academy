"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

type Status = 'verifying' | 'success' | 'failed';

interface UnlockedCourse {
  id: string;
  title: string;
  type?: string;
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearPurchasedItems } = useCart();

  const orderId = searchParams.get('order_id');
  const premiumItemId = searchParams.get('premiumItemId');
  const mode = searchParams.get('mode');
  const isFree = searchParams.get('free') === 'true';

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [savedClass, setSavedClass] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [unlockedCourses, setUnlockedCourses] = useState<UnlockedCourse[]>([]);

  const isCartMode = mode === 'cart' || (orderId && orderId.startsWith('bba_ord_'));

  useEffect(() => {
    try {
      const cls = localStorage.getItem('selectedClass');
      if (cls && cls !== 'Not Selected') setSavedClass(cls);
    } catch {}

    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment return. Missing order information.');
      return;
    }

    if (isFree) {
      // Free order was already activated during checkout
      setStatus('success');
      setMessage('Free enrollment confirmed! Your courses are now unlocked.');
      return;
    }

    // Small delay to let payment gateway finalize the order status
    const timer = setTimeout(() => {
      verifyPayment(0);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, premiumItemId, isFree]);

  const verifyPayment = async (attempt: number) => {
    try {
      let endpoint = '/api/premium/purchase/verify';
      let payload: any = { cashfreeOrderId: orderId };

      if (isCartMode) {
        endpoint = '/api/checkout/verify';
        payload = { orderId, cashfreeOrderId: orderId };
      } else if (premiumItemId) {
        payload.premiumItemId = premiumItemId;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Payment successful! Your course access is now unlocked.');

        if (Array.isArray(data.items)) {
          setUnlockedCourses(data.items);
          clearPurchasedItems(data.items.map((i: any) => i.id));
        } else if (premiumItemId) {
          clearPurchasedItems([premiumItemId]);
        }
      } else {
        // If payment is still processing (ACTIVE/PENDING), retry up to 3 times
        const isProcessing =
          data.error?.includes('ACTIVE') ||
          data.error?.includes('PENDING') ||
          data.error?.includes('not completed');

        if (isProcessing && attempt < 3) {
          setRetryCount(attempt + 1);
          setTimeout(() => verifyPayment(attempt + 1), 3000);
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed. Please contact academy support.');
        }
      }
    } catch {
      setStatus('failed');
      setMessage('A network error occurred while verifying your payment. Please contact support.');
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '1.5rem',
        }}
      >
        {status === 'verifying' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem',
                border: '4px solid rgba(99,102,241,0.15)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Verifying Payment
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>
              {retryCount > 0
                ? `Checking status with gateway (attempt ${retryCount + 1}/4)...`
                : 'Please wait while we confirm your payment and unlock your curriculum...'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle
              style={{
                fontSize: '3.75rem',
                color: '#10b981',
                marginBottom: '1.25rem',
              }}
            />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#10b981' }}>
              Enrollment Successful! 🎉
            </h2>
            <p style={{ opacity: 0.75, fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              {message}
            </p>

            {/* Unlocked Courses List */}
            {unlockedCourses.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  marginBottom: '1.75rem',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>
                  Unlocked Courses:
                </span>
                {unlockedCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/premium/${c.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-highlight)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <strong style={{ fontSize: '0.9rem' }}>{c.title}</strong>
                    </div>
                    <ArrowRight size={14} opacity={0.6} />
                  </Link>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {premiumItemId && unlockedCourses.length === 0 && (
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
                    textDecoration: 'none',
                  }}
                >
                  Access Your Course →
                </Link>
              )}

              <Link
                href="/dashboard"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <BookOpen size={16} /> Go to Student Dashboard
              </Link>

              <Link
                href={savedClass ? `/class/${encodeURIComponent(savedClass)}?tab=premium` : '/courses'}
                style={{
                  opacity: 0.6,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  marginTop: '0.25rem',
                }}
              >
                ← Back to Courses
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <FaTimesCircle
              style={{
                fontSize: '3.75rem',
                color: '#ef4444',
                marginBottom: '1.25rem',
              }}
            />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ef4444' }}>
              Payment Verification Pending / Failed
            </h2>
            <p style={{ opacity: 0.75, fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href="/checkout"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Return to Checkout
              </Link>
              <Link
                href="/cart"
                style={{
                  opacity: 0.7,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                View Cart Selections
              </Link>
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.5 }}>
              If your payment was debited, your access will be activated once the webhook completes, or contact support with reference: {orderId}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(99,102,241,0.2)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
