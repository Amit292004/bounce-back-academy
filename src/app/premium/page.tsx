"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaCoins, FaShoppingCart, FaShieldAlt, FaTimes, FaCreditCard, 
  FaMobileAlt, FaArrowRight, FaCheckCircle, FaBookOpen, FaDownload, 
  FaPlayCircle, FaChevronRight, FaEye
} from 'react-icons/fa';
import styles from './page.module.css';
import { getDriveImageUrl } from '@/lib/driveImage';
import { logger } from '@/lib/logger'

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  resourceId: string | null;
  unlocked: boolean;
}

const STATIC_FALLBACK_PACKAGES: PremiumItem[] = [
  {
    id: 'pack-notes-10',
    title: '📐 Class 10 Board Notes Package',
    description: 'Expert, color-coded study notes covering all chapters of Class 10 Science and Mathematics. Includes solved examples.',
    type: 'NOTE',
    price: 99,
    originalPrice: 499,
    imageUrl: null,
    features: 'Direct High-Speed PDF Download | Chapterwise Bullet Points | Formulas Cheat-sheet included',
    resourceId: 'static-maths-10',
    unlocked: false
  },
  {
    id: 'pack-pyq-12',
    title: '⚡ Class 12 Physics Premium PYQs',
    description: 'Highly requested Previous Year Question papers from 2016-2025 with step-by-step verified expert solutions.',
    type: 'PYQ',
    price: 149,
    originalPrice: 799,
    imageUrl: null,
    features: 'Verified Expert Written Solution | Quick MCQ Hints | Includes 2026 Term Prep Mock Test',
    resourceId: 'static-science-10',
    unlocked: false
  },
  {
    id: 'pack-course-full',
    title: '🚀 Class 9-12 Foundation Mathematics Course',
    description: 'Comprehensive mathematics crash course designed to establish core arithmetic and algebraic concepts for board prep.',
    type: 'COURSE',
    price: 499,
    originalPrice: 1999,
    imageUrl: null,
    features: '40+ HD Video Lectures | Collapsible Chapterwise Worksheets | Direct Doubt Solver Support',
    resourceId: '',
    unlocked: false
  }
];

export default function PremiumStorePage() {
  const [items, setItems] = useState<PremiumItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Checkout states
  const [checkoutItem, setCheckoutItem] = useState<PremiumItem | null>(null);
  const [payTab, setPayTab] = useState<'card' | 'upi'>('card');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loaderMessage, setLoaderMessage] = useState('Securing Gateway Connection...');

  // Form inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // Payment loading state
  const [loadingPaymentInit, setLoadingPaymentInit] = useState(false);

  useEffect(() => {
    fetchPremiumItems();
  }, []);

  const fetchPremiumItems = async () => {
    try {
      const res = await fetch('/api/premium');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setItems(data);
        } else {
          setItems(STATIC_FALLBACK_PACKAGES);
        }
      } else {
        setItems(STATIC_FALLBACK_PACKAGES);
      }
    } catch (err) {
      logger.error('Failed to load store items:', err);
      setItems(STATIC_FALLBACK_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutClick = async (item: PremiumItem) => {
    setLoadingPaymentInit(true);
    try {
      const res = await fetch('/api/premium/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumItemId: item.id })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to initiate purchase.');
        return;
      }

      const orderData = await res.json();

      if (orderData.alreadyUnlocked) {
        alert(orderData.message);
        fetchPremiumItems();
        return;
      }

      if (orderData.mode === 'cashfree') {
        // Load Cashfree JS SDK v3
        const scriptLoaded = await loadCashfreeScript();
        if (!scriptLoaded) {
          alert('Failed to load Cashfree payment SDK. Please check your network.');
          return;
        }

        const cashfree = new (window as any).Cashfree({
          mode: orderData.environment || 'production'
        });

        // Cashfree checkout redirects to return_url after payment
        cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_self'
        });
      } else {
        // Fall back to gorgeous simulated drawer
        setCheckoutItem(item);
        setCheckoutStep('details');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setUpiId('');
      }
    } catch (err) {
      logger.error(err);
      alert('Error initiating checkout.');
    } finally {
      setLoadingPaymentInit(false);
    }
  };

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;

    setCheckoutStep('processing');
    
    // Multi-stage simulated payment loader for premium experience
    setTimeout(() => {
      setLoaderMessage('Verifying simulated funds...');
      setTimeout(() => {
        setLoaderMessage('Authorizing purchase transaction...');
        setTimeout(async () => {
          try {
            const res = await fetch('/api/premium/purchase/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                premiumItemId: checkoutItem.id,
                simulatedConfirm: true
              })
            });

            if (res.ok) {
              setCheckoutStep('success');
              // Mark item as unlocked in local state
              setItems(prev => prev.map(item => item.id === checkoutItem.id ? { ...item, unlocked: true } : item));
            } else {
              const data = await res.json();
              alert(data.error || 'Failed to complete simulated purchase.');
              setCheckoutStep('details');
            }
          } catch {
            alert('A network error occurred. Please try again.');
            setCheckoutStep('details');
          }
        }, 1500);
      }, 1200);
    }, 1000);
  };

  const getDirectAccessUrl = (item: PremiumItem) => {
    let base = '/';
    if (item.type === 'NOTE') base = '/notes';
    else if (item.type === 'PYQ') base = '/papers';
    else if (item.type === 'COURSE') base = `/class/${item.resourceId || ''}`;
    else if (item.type === 'LECTURE') base = '/videos';

    if (item.resourceId && item.type !== 'COURSE') {
      return `${base}?id=${item.resourceId}`;
    }
    return base;
  };

  const filteredItems = items.filter(item => {
    return selectedFilter === 'all' || item.type === selectedFilter;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', opacity: 0.7 }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading e-learning marketplace...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <FaCoins /> PREMIUM EDUCATION HUB
        </div>
        <h1 className={styles.title}>
          Unlock Premium <span className="text-gradient">Study Assets</span>
        </h1>
        <p className={styles.subtitle}>
          Accelerate your preparation! Secure full chapter notes, solved mock and term papers, masterclasses, and expert lectures.
        </p>
      </div>

      {/* 2. Category Filters */}
      <div className={styles.filterChips}>
        {['all', 'NOTE', 'PYQ', 'COURSE', 'LECTURE'].map((type) => (
          <button
            key={type}
            className={`${styles.filterChip} ${selectedFilter === type ? styles.activeChip : ''}`}
            onClick={() => setSelectedFilter(type)}
          >
            {type === 'all' ? 'All Packages' : type === 'NOTE' ? 'Study Notes' : type === 'PYQ' ? 'Board PYQs' : type === 'COURSE' ? 'Full Courses' : 'Lectures'}
          </button>
        ))}
      </div>

      {/* 3. Items Grid */}
      <div className={styles.storeGrid}>
        {filteredItems.map((item) => {
          const featuresList = item.features ? item.features.split('|').map(f => f.trim()) : [];
          
          return (
            <div key={item.id} className={`glass-panel ${styles.productCard}`}>
              <div className={styles.imageWrapper}>
                {(() => {
                  const imgSrc = getDriveImageUrl(item.imageUrl);
                  return imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className={styles.cardCoverImg}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.style.display = 'none';
                        const sib = t.nextElementSibling as HTMLElement;
                        if (sib) {
                          sib.style.display = 'flex';
                          sib.innerText = 'Image load error';
                        }
                      }}
                    />
                  ) : null;
                })()}
                {/* Minimal placeholder — shown when no imageUrl set or image fails */}
                <div
                  className={styles.cardCoverImg}
                  style={{
                    display: item.imageUrl ? 'none' : 'flex',
                    background: 'var(--surface-highlight)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    color: 'var(--foreground)',
                    opacity: 0.35
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>
                    {item.type === 'NOTE' ? '📚' : item.type === 'PYQ' ? '📝' : item.type === 'COURSE' ? '🎓' : '🎬'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>No image added</span>
                </div>
                <span className={styles.typeBadge} style={{
                  background: item.type === 'NOTE' ? 'var(--primary)' : item.type === 'PYQ' ? '#10b981' : item.type === 'COURSE' ? '#f59e0b' : '#ef4444',
                  color: '#fff'
                }}>
                  {item.type === 'NOTE' ? 'Study Notes' : item.type === 'PYQ' ? 'Board PYQ' : item.type === 'COURSE' ? 'Full Course' : 'Lecture'}
                </span>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.description}</p>

                {/* Features Checklist */}
                {featuresList.length > 0 && (
                  <ul className={styles.featuresList}>
                    {featuresList.map((feat, index) => (
                      <li key={index} className={styles.featureItem}>
                        <FaCheckCircle className={styles.checkIcon} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pricing and Action row */}
              <div className={styles.pricingRow}>
                <div className={styles.priceCol}>
                  <span className={styles.priceLabel}>Access Plan</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.priceVal}>₹{item.price}</span>
                    {item.originalPrice && (
                      <span className={styles.priceOriginal}>₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>

                {item.unlocked ? (
                  <Link href={`/premium/${item.id}`} className={`${styles.actionBtn} ${styles.btnUnlocked}`}>
                    <FaCheckCircle size={13} />
                    <span>View Content</span>
                  </Link>
                ) : (
                  <Link href={`/premium/${item.id}`} className={`${styles.actionBtn} ${styles.btnLocked}`}>
                    <FaEye size={13} />
                    <span>View Package</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', gridColumn: '1 / -1', opacity: 0.6 }}>
            No paid packages listed in this category yet. Check back soon for premium releases!
          </div>
        )}
      </div>

      {/* 4. Sleek Interactive Simulated Checkout Modal */}
      {checkoutItem && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modalContent}`}>
            <div className={styles.modalHeader}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>VIP Academy Checkout</span>
                <h3 className={styles.modalTitle}>Unlock Premium Package</h3>
              </div>
              <button onClick={() => setCheckoutItem(null)} className={styles.closeBtn}>
                <FaTimes />
              </button>
            </div>

            {/* Steps Rendering */}
            {checkoutStep === 'details' && (
              <form onSubmit={handleAuthorizePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Simulated Invoice Box */}
                <div className={styles.receiptBox}>
                  <div className={styles.receiptItem}>{checkoutItem.title}</div>
                  <div className={styles.receiptRow}>
                    <span>Type:</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{checkoutItem.type}</span>
                  </div>
                  {checkoutItem.originalPrice && (
                    <div className={styles.receiptRow}>
                      <span>Original Listing:</span>
                      <span style={{ textDecoration: 'line-through' }}>₹{checkoutItem.originalPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {checkoutItem.originalPrice && (
                    <div className={styles.receiptRow} style={{ color: '#10b981' }}>
                      <span>Bundle Discount:</span>
                      <span>-₹{(checkoutItem.originalPrice - checkoutItem.price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.receiptRow}>
                    <span>Gateway Processing (GST):</span>
                    <span>₹0.00 (Waived)</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptTotalRow}>
                    <span>Total Payable:</span>
                    <span>₹{checkoutItem.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Simulated Payment Mode Selector */}
                <div className={styles.payTabs}>
                  <button 
                    type="button" 
                    className={`${styles.payTab} ${payTab === 'card' ? styles.payTabActive : ''}`} 
                    onClick={() => setPayTab('card')}
                  >
                    <FaCreditCard size={12} style={{ marginRight: '0.3rem' }} /> Credit/Debit Card
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.payTab} ${payTab === 'upi' ? styles.payTabActive : ''}`} 
                    onClick={() => setPayTab('upi')}
                  >
                    <FaMobileAlt size={12} style={{ marginRight: '0.3rem' }} /> Simulated UPI
                  </button>
                </div>

                {payTab === 'card' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>CARD NUMBER (Simulated)</label>
                      <input 
                        type="text" 
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                        placeholder="4111 2222 3333 4444" 
                        className={styles.formInput} 
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>EXPIRY DATE</label>
                        <input 
                          type="text" 
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/^(\d{2})(?=\d)/g, '$1/'))}
                          placeholder="MM/YY" 
                          className={styles.formInput} 
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>CVV</label>
                        <input 
                          type="password" 
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="***" 
                          className={styles.formInput} 
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>UPI ADDRESS (Simulated)</label>
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="student@okaxis" 
                      className={styles.formInput} 
                      required
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ padding: '0.85rem', width: '100%', fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaShieldAlt /> Authorize Simulated Payment <FaChevronRight size={10} />
                </button>
              </form>
            )}

            {checkoutStep === 'processing' && (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <span className={styles.loadingText}>{loaderMessage}</span>
                <span className={styles.loadingSubtext}>Please do not close this window or click back.</span>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className={styles.successContainer}>
                <FaCheckCircle className={styles.successIcon} />
                <h3 className={styles.successTitle}>Access Unlocked!</h3>
                <p className={styles.successText}>
                  Your purchase is complete! Your paid notes, papers, or lectures have been successfully unlocked.
                </p>
                <a href={getDirectAccessUrl(checkoutItem)} className="btn-primary" style={{ width: '100%', padding: '0.8rem 1.5rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <FaBookOpen /> Access Unlocked Material <FaArrowRight />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
