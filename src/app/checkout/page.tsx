"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  Shield,
  HelpCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { logger } from '@/lib/logger';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    payableTotal,
    coupon,
    isLoading,
    clearPurchasedItems,
  } = useCart();

  // User details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Checkout process state
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'free'>('cashfree');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('Initiating Secure Checkout...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Simulated fallback modal state (for local dev only)
  const [simulatedOrder, setSimulatedOrder] = useState<any | null>(null);
  const [simProcessing, setSimProcessing] = useState(false);
  const [simMessage, setSimMessage] = useState('Connecting to gateway...');

  // Fetch logged in student info
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setIsAuthenticated(true);
            setName(data.user.name || '');
            setEmail(data.user.email || '');
            setMobile(data.user.mobile || '');
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="cashfree.com"]');
      if (existingScript) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((window as any).Cashfree) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts > 30) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
        return;
      }

      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setMaintenanceMode(false);

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add courses before checking out.');
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    if (!email || !name) {
      setErrorMessage('Please provide your name and email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatusText('Securing Gateway Session...');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: items.map((i) => i.id),
          couponCode: coupon?.code,
          customerDetails: { name, email, mobile },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
          return;
        }
        if (res.status === 503 && data.maintenance) {
          setMaintenanceMode(true);
        }
        setErrorMessage(data.error || 'Failed to initiate secure checkout.');
        setIsSubmitting(false);
        return;
      }

      // Case A: Free checkout (100% coupon or ₹0 courses)
      if (data.mode === 'free') {
        clearPurchasedItems(items.map((i) => i.id));
        router.push(`/payment/return?order_id=${data.orderId}&mode=cart&free=true`);
        return;
      }

      // Case B: Cashfree Official Payment Gateway
      if (data.mode === 'cashfree') {
        setSubmitStatusText('Opening Cashfree Secure Gateway...');
        const scriptLoaded = await loadCashfreeScript();
        if (!scriptLoaded) {
          setErrorMessage(
            'Unable to load Cashfree Payment SDK. If you are using an ad-blocker or brave shields, please allow payment scripts and try again.'
          );
          setIsSubmitting(false);
          return;
        }

        const cashfree = (window as any).Cashfree({
          mode: data.environment || 'production',
        });

        cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self',
        });
        return;
      }

      // Case C: Simulated Dev Mode (Local Testing)
      if (data.mode === 'simulated') {
        setSimulatedOrder(data);
        setIsSubmitting(false);
      }
    } catch (err) {
      logger.error('Checkout failed:', err);
      setErrorMessage('A network error occurred while connecting to the checkout service. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!simulatedOrder) return;
    setSimProcessing(true);
    setSimMessage('Connecting to Secure Sandbox Gateway...');

    setTimeout(() => {
      setSimMessage('Verifying test transaction & cryptographic signature...');
      setTimeout(async () => {
        try {
          const res = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: simulatedOrder.orderId,
              simulatedConfirm: true,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            clearPurchasedItems(items.map((i) => i.id));
            router.push(`/payment/return?order_id=${simulatedOrder.orderId}&mode=cart`);
          } else {
            setErrorMessage(data.error || 'Simulated verification failed.');
            setSimulatedOrder(null);
          }
        } catch {
          setErrorMessage('Network error during simulated verification.');
          setSimulatedOrder(null);
        } finally {
          setSimProcessing(false);
        }
      }, 1400);
    }, 1000);
  };

  if (!isLoading && items.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <h2>Your cart is currently empty</h2>
          <p style={{ color: 'var(--secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Please select at least one course before proceeding to checkout.
          </p>
          <Link href="/courses" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
            Browse Courses →
          </Link>
        </div>
      </div>
    );
  }

  const isFreeTotal = payableTotal === 0;

  return (
    <div className={styles.container}>
      {/* Return to Cart Navigation */}
      <Link href="/cart" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Return to Cart</span>
      </Link>

      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>PCI-DSS Level 1 · 256-Bit Bank Grade SSL</span>
        </div>
        <h1 className={styles.title}>Secure Academy Checkout</h1>
        <p className={styles.subtitle}>
          Instant enrollment verified through official Cashfree payment gateway. Lifetime access to syllabus materials and video lectures is activated immediately.
        </p>
      </div>

      {/* Security Assurance Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldCheck size={22} color="#10b981" />
          <div>
            <strong style={{ fontSize: '0.88rem', color: 'var(--foreground)' }}>
              100% Hack-Proof &amp; Cryptographically Secured Payment
            </strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--secondary)' }}>
              Cashfree Webhook HMAC-SHA256 signature verification · No sensitive card data stored
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', fontWeight: 600, color: '#10b981' }}>
          <span>✓ Instant Access</span>
          <span>✓ Verified Merchant</span>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            color: '#ef4444',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          {maintenanceMode && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: 'var(--foreground)' }}>
              To enroll directly, please WhatsApp our support team with your student details:
              <a
                href="https://wa.me/919999999999?text=Hello%20Bounce%20Back%20Academy,%20I%20would%20like%20to%20enroll%20in%20courses"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginLeft: '0.5rem',
                  color: '#10b981',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <MessageSquare size={14} /> WhatsApp Support →
              </a>
            </div>
          )}
        </div>
      )}

      {isAuthenticated === false && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Already have a student account?</h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--secondary)' }}>
              Sign in to automatically link purchases to your existing academy profile.
            </p>
          </div>
          <Link
            href={`/login?redirect=${encodeURIComponent('/checkout')}`}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign In Now
          </Link>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit}>
        <div className={styles.checkoutGrid}>
          {/* Left Column: Form & Payment Method */}
          <div className={styles.leftSection}>
            {/* 1. Student / Billing Details Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <User size={18} color="var(--primary)" />
                <h3 className={styles.cardTitle}>Student Information</h3>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={styles.textInput}
                    maxLength={100}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className={styles.textInput}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>WhatsApp / Mobile Number (for receipt &amp; instant doubt support)</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={styles.textInput}
                  maxLength={15}
                />
              </div>
            </div>

            {/* 2. Payment Method Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <CreditCard size={18} color="var(--primary)" />
                <h3 className={styles.cardTitle}>Payment Method</h3>
              </div>

              <div className={styles.paymentOptions}>
                {isFreeTotal ? (
                  <div
                    className={`${styles.paymentOption} ${styles.paymentOptionActive}`}
                    onClick={() => setPaymentMethod('free')}
                  >
                    <div className={styles.paymentOptionLeft}>
                      <div className={`${styles.radioCircle} ${styles.radioCircleActive}`}>
                        <div className={styles.radioDot} />
                      </div>
                      <div>
                        <div className={styles.paymentTitle}>Free Enrollment (100% Discount)</div>
                        <div className={styles.paymentDesc}>
                          No payment required. Lifetime access granted instantly upon confirmation.
                        </div>
                      </div>
                    </div>
                    <Sparkles size={20} color="#10b981" />
                  </div>
                ) : (
                  <div
                    className={`${styles.paymentOption} ${styles.paymentOptionActive}`}
                    onClick={() => setPaymentMethod('cashfree')}
                  >
                    <div className={styles.paymentOptionLeft}>
                      <div className={`${styles.radioCircle} ${styles.radioCircleActive}`}>
                        <div className={styles.radioDot} />
                      </div>
                      <div>
                        <div className={styles.paymentTitle}>Instant Online Payment (Cashfree PG)</div>
                        <div className={styles.paymentDesc}>
                          UPI (Google Pay, PhonePe, Paytm, BHIM, QR), Cards (Visa, MasterCard, RuPay), NetBanking (50+ banks)
                        </div>
                      </div>
                    </div>
                    <div className={styles.paymentIcons}>
                      <span title="UPI Supported"><Smartphone size={16} /></span>
                      <span title="Cards Supported"><CreditCard size={16} /></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported payment channel chips */}
              {!isFreeTotal && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    padding: '0.75rem 0.5rem 0',
                    fontSize: '0.75rem',
                    color: 'var(--secondary)',
                  }}
                >
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>Google Pay</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>PhonePe</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>Paytm</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>UPI QR</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>Visa / MasterCard / RuPay</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-highlight)', borderRadius: '4px' }}>Net Banking</span>
                </div>
              )}

              <div className={styles.termsNotice}>
                By placing this order, you agree to Bounce Back Academy&apos;s{' '}
                <Link href="/terms" target="_blank" className={styles.termsLink}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className={styles.termsLink}>
                  Privacy Policy
                </Link>
                . Digital syllabus packages unlock instant lifetime access.
              </div>
            </div>
          </div>

          {/* Right Column: Order Review */}
          <aside className={styles.orderReview}>
            <div className={styles.cardHeader}>
              <Lock size={16} color="#10b981" />
              <h3 className={styles.cardTitle}>Order Summary ({itemCount})</h3>
            </div>

            <div className={styles.coursesList}>
              {items.map((item) => (
                <div key={item.id} className={styles.courseItem}>
                  <div>
                    <h4 className={styles.courseTitle}>{item.title}</h4>
                    <span className={styles.courseType}>{item.type || 'COURSE'}</span>
                  </div>
                  <span className={styles.coursePrice}>₹{item.price}</span>
                </div>
              ))}
            </div>

            <div className={styles.calcSection}>
              <div className={styles.calcRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {coupon && coupon.discountAmount > 0 && (
                <div className={styles.calcRow} style={{ color: '#10b981' }}>
                  <span>Coupon ({coupon.code})</span>
                  <span>-₹{coupon.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.calcTotal}>
                <span>Payable Total</span>
                <span>₹{payableTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.payButton}
              aria-label="Submit Order"
            >
              {isSubmitting ? (
                <span>{submitStatusText}</span>
              ) : isFreeTotal ? (
                <>
                  <Sparkles size={18} />
                  <span>Complete Free Enrollment</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Pay ₹{payableTotal.toFixed(2)} &amp; Enroll</span>
                </>
              )}
            </button>

            <div className={styles.securityNote}>
              <Lock size={12} color="#10b981" />
              <span>256-bit bank encrypted secure transaction</span>
            </div>
          </aside>
        </div>
      </form>

      {/* Simulated Dev Sandbox Modal (Active in local development only) */}
      {simulatedOrder && (
        <div className={styles.simModalOverlay}>
          <div className={styles.simModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={20} color="#f97316" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Local Test Payment Gateway</h3>
            </div>
            <p style={{ fontSize: '0.88rem', opacity: 0.7, margin: 0 }}>
              Development environment active. No live card charges will be made.
            </p>

            <div style={{ background: 'var(--surface-highlight)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Order ID:</span>
                <strong>{simulatedOrder.orderId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Amount:</span>
                <strong>₹{simulatedOrder.amount}</strong>
              </div>
            </div>

            {simProcessing ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid var(--surface-border)',
                    borderTopColor: 'var(--foreground)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 0.75rem',
                  }}
                />
                <strong style={{ fontSize: '0.9rem' }}>{simMessage}</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSimulatedPayment}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem', fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} /> Confirm Test Payment
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedOrder(null)}
                  className="btn-secondary"
                  style={{ padding: '0.75rem 1rem' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
