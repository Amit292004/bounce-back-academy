"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BookOpen, CheckCircle2, ArrowRight, ShieldCheck, MessageSquare, RefreshCw } from 'lucide-react';

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
  const [stepLabel, setStepLabel] = useState('Verifying encrypted gateway response...');

  const isCartMode = mode === 'cart' || (orderId && orderId.startsWith('bba_ord_'));

  useEffect(() => {
    try {
      const cls = localStorage.getItem('selectedClass');
      if (cls && cls !== 'Not Selected') setSavedClass(cls);
    } catch {}

    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment return: missing order identifier.');
      return;
    }

    if (isFree) {
      setStatus('success');
      setMessage('Free enrollment confirmed! Your course access is activated.');
      return;
    }

    const timer = setTimeout(() => {
      verifyPayment(0);
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, premiumItemId, isFree]);

  const verifyPayment = async (attempt: number) => {
    try {
      if (attempt === 1) setStepLabel('Confirming settlement with bank...');
      if (attempt >= 2) setStepLabel('Synchronizing lifetime course access...');

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
        setMessage(data.message || 'Payment successfully verified! Your courses have been unlocked.');

        if (Array.isArray(data.items)) {
          setUnlockedCourses(data.items);
          clearPurchasedItems(data.items.map((i: any) => i.id));
        } else if (premiumItemId) {
          clearPurchasedItems([premiumItemId]);
        }
      } else {
        // If payment is pending on gateway (ACTIVE or PENDING), retry up to 4 times
        const isProcessing =
          data.error?.includes('ACTIVE') ||
          data.error?.includes('PENDING') ||
          data.error?.includes('not completed');

        if (isProcessing && attempt < 4) {
          setRetryCount(attempt + 1);
          setTimeout(() => verifyPayment(attempt + 1), 2500);
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification could not be completed at this time.');
        }
      }
    } catch {
      setStatus('failed');
      setMessage('A network error occurred while verifying your transaction. Please contact support.');
    }
  };

  const whatsappSupportUrl = `https://wa.me/919999999999?text=${encodeURIComponent(
    `Hello Bounce Back Academy, I need assistance verifying my payment.\nOrder ID: ${orderId || 'N/A'}`
  )}`;

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
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {status === 'verifying' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 1.5rem',
                border: '3px solid var(--surface-border)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Verifying Payment
            </h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              {stepLabel}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.78rem',
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={14} />
              <span>Cryptographic Bank Verification Active</span>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <FaCheckCircle style={{ fontSize: '2.8rem' }} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#10b981' }}>
              Enrollment Confirmed!
            </h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.55 }}>
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
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Unlocked Learning Materials:
                </span>
                {unlockedCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/premium/${c.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'var(--surface-highlight)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '10px',
                      color: 'var(--foreground)',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                  Access Your Course Now →
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
                  color: 'var(--secondary)',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  marginTop: '0.25rem',
                }}
              >
                ← Return to Courses
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <FaTimesCircle style={{ fontSize: '2.8rem' }} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ef4444' }}>
              Payment Verification Failed
            </h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.55 }}>
              {message}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStatus('verifying');
                  verifyPayment(0);
                }}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 800,
                }}
              >
                <RefreshCw size={16} /> Retry Verification
              </button>

              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '8px',
                  background: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <MessageSquare size={16} /> Contact Academy Support on WhatsApp
              </a>

              <Link
                href="/checkout"
                style={{
                  color: 'var(--secondary)',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  marginTop: '0.35rem',
                }}
              >
                Return to Checkout Page
              </Link>
            </div>

            {orderId && (
              <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                Order Reference: <code>{orderId}</code>
              </p>
            )}
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
              border: '3px solid var(--surface-border)',
              borderTopColor: 'var(--foreground)',
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
