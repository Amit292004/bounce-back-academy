"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaCoins, FaShoppingCart, FaShieldAlt, FaTimes, FaCreditCard, 
  FaMobileAlt, FaArrowRight, FaCheckCircle, FaBookOpen, FaDownload, 
  FaPlayCircle, FaChevronRight, FaEye, FaSearch, FaFileAlt, FaGraduationCap,
  FaBoxOpen
} from 'react-icons/fa';
import styles from './page.module.css';
import { getDriveImageUrl } from '@/lib/driveImage';
import { logger } from '@/lib/logger';
import AddToCartButton from '@/components/cart/AddToCartButton';

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
  className?: string | null;
}

const STATIC_FALLBACK_PACKAGES: PremiumItem[] = [
  {
    id: 'pack-notes-10',
    title: 'Class 10 Board Notes Package',
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
    title: 'Class 12 Physics Premium PYQs',
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
    title: 'Class 9-12 Foundation Mathematics Course',
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
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

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
    fetchClasses();
    fetchMaterialTypes();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (err) {
      logger.error('Failed to load courses:', err);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const res = await fetch('/api/admin/material-types');
      if (res.ok) {
        setMaterialTypes(await res.json());
      }
    } catch (err) {
      logger.error('Failed to load material types:', err);
    }
  };

  const getTypeLabel = (code: string) => {
    const matched = materialTypes.find(mt => mt.code === code);
    if (matched) return matched.name;
    if (code === 'NOTE') return 'Study Notes';
    if (code === 'PYQ') return 'Board PYQ';
    if (code === 'COURSE') return 'Full Course';
    if (code === 'LECTURE') return 'Lecture';
    return code;
  };

  const getTypeColor = (code: string) => {
    if (code === 'NOTE') return 'var(--primary)';
    if (code === 'PYQ') return '#10b981';
    if (code === 'COURSE') return '#f59e0b';
    if (code === 'LECTURE') return '#ef4444';
    return 'var(--primary)';
  };

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

        const cashfree = (window as any).Cashfree({
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
    else base = `/premium/${item.id}`; // Default redirect for custom material types

    if (item.resourceId && item.type !== 'COURSE') {
      return `${base}?id=${item.resourceId}`;
    }
    return base;
  };

  const filteredItems = items.filter(item => {
    const matchesType = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesClass = selectedClassFilter === 'all' || (() => {
      if (!item.className) return false;
      const normalize = (name: string) => name.toLowerCase().replace('class', '').trim();
      return normalize(item.className) === normalize(selectedClassFilter);
    })();
    const qText = search.trim().toLowerCase();
    const matchesSearch = !qText || 
      item.title.toLowerCase().includes(qText) || 
      item.description.toLowerCase().includes(qText) ||
      (item.className && item.className.toLowerCase().includes(qText));
    return matchesType && matchesClass && matchesSearch;
  });

  const hasFilters = search.trim() !== '' || selectedFilter !== 'all' || selectedClassFilter !== 'all';

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
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Premium Study Store</span>
        </div>
        <h1 className={styles.title}>Premium Store</h1>
        <p className={styles.subtitle}>
          Verified full chapter revision notes, past examination blueprint packs, masterclasses, and foundation video courses.
        </p>
      </div>

      {/* 2. Mode Toggle + Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl} role="tablist" aria-label="Store category filter">
          <button
            role="tab"
            aria-selected={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
            className={`${styles.segmentedBtn} ${selectedFilter === 'all' ? styles.segmentedBtnActive : ''}`}
          >
            <FaCoins size={12} />
            <span>All Items</span>
          </button>
          <button
            role="tab"
            aria-selected={selectedFilter === 'NOTE'}
            onClick={() => setSelectedFilter('NOTE')}
            className={`${styles.segmentedBtn} ${selectedFilter === 'NOTE' ? styles.segmentedBtnActive : ''}`}
          >
            <FaBookOpen size={12} />
            <span>Notes</span>
          </button>
          <button
            role="tab"
            aria-selected={selectedFilter === 'PYQ'}
            onClick={() => setSelectedFilter('PYQ')}
            className={`${styles.segmentedBtn} ${selectedFilter === 'PYQ' ? styles.segmentedBtnActive : ''}`}
          >
            <FaFileAlt size={12} />
            <span>Board PYQs</span>
          </button>
          <button
            role="tab"
            aria-selected={selectedFilter === 'COURSE'}
            onClick={() => setSelectedFilter('COURSE')}
            className={`${styles.segmentedBtn} ${selectedFilter === 'COURSE' ? styles.segmentedBtnActive : ''}`}
          >
            <FaGraduationCap size={13} />
            <span>Courses</span>
          </button>
          <button
            role="tab"
            aria-selected={selectedFilter === 'LECTURE'}
            onClick={() => setSelectedFilter('LECTURE')}
            className={`${styles.segmentedBtn} ${selectedFilter === 'LECTURE' ? styles.segmentedBtnActive : ''}`}
          >
            <FaPlayCircle size={12} />
            <span>Lectures</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search premium packages, subjects or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search premium store"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <FaTimes size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3. SaaS Filter Bar */}
      <div className={styles.filterBarWrapper}>
        <div className={styles.filterBar}>
          <div className={styles.filterBarIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </div>

          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Class</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className={styles.filterBarSelect}
            >
              <option value="all">All Classes</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Category</span>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={styles.filterBarSelect}
            >
              <option value="all">All Categories</option>
              {(materialTypes.length > 0 ? materialTypes : [
                { name: 'Study Notes', code: 'NOTE' },
                { name: 'Board PYQ', code: 'PYQ' },
                { name: 'Full Course', code: 'COURSE' },
                { name: 'Lecture', code: 'LECTURE' }
              ]).map((mt) => (
                <option key={mt.code} value={mt.code}>{mt.name}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              className={styles.clearSegment}
              onClick={() => {
                setSearch('');
                setSelectedFilter('all');
                setSelectedClassFilter('all');
              }}
            >
              <FaTimes size={10} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* 4. Results Bar */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          {filteredItems.length} premium item{filteredItems.length !== 1 ? 's' : ''} available
          {search ? ` matching "${search}"` : ''}
        </span>
      </div>

      {/* 5. Items Grid */}
      <div className={styles.storeGrid}>
        {filteredItems.map((item) => {
          const featuresList = item.features ? item.features.split('|').map(f => f.trim()) : [];
          const typeColor = getTypeColor(item.type);
          const getIcon = () => {
            if (item.type === 'NOTE') return <FaBookOpen size={16} />;
            if (item.type === 'PYQ') return <FaFileAlt size={16} />;
            if (item.type === 'COURSE') return <FaGraduationCap size={16} />;
            if (item.type === 'LECTURE') return <FaPlayCircle size={16} />;
            return <FaCoins size={16} />;
          };
          
          return (
            <div key={item.id} className={styles.productCard}>
              {/* Product Banner */}
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
                        if (sib) sib.style.display = 'flex';
                      }}
                    />
                  ) : null;
                })()}
                <div
                  className={styles.cardCoverPlaceholder}
                  style={{ display: item.imageUrl ? 'none' : 'flex' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, marginBottom: '0.25rem' }}>
                    {item.type === 'NOTE' ? (
                      <FaBookOpen size={28} />
                    ) : item.type === 'PYQ' ? (
                      <FaFileAlt size={28} />
                    ) : item.type === 'COURSE' ? (
                      <FaGraduationCap size={28} />
                    ) : item.type === 'LECTURE' ? (
                      <FaPlayCircle size={28} />
                    ) : (
                      <FaCoins size={28} />
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.75 }}>
                    Premium {getTypeLabel(item.type)}
                  </span>
                </div>
              </div>

              <div className={styles.cardTop}>
                <div
                  className={styles.cardIconBox}
                  style={{
                    color: typeColor,
                    background: `color-mix(in srgb, ${typeColor} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${typeColor} 25%, transparent)`,
                  }}
                >
                  {getIcon()}
                </div>
                <div className={styles.cardBadges}>
                  <span
                    className={styles.cardTypeBadge}
                    style={{
                      color: typeColor,
                      borderColor: `color-mix(in srgb, ${typeColor} 30%, transparent)`,
                      background: `color-mix(in srgb, ${typeColor} 10%, transparent)`
                    }}
                  >
                    {getTypeLabel(item.type)}
                  </span>
                  {item.className && (
                    <span className={styles.cardBadge}>
                      {item.className.toLowerCase().includes('class') ? item.className : `Class ${item.className}`}
                    </span>
                  )}
                </div>
                <div className={styles.cardPriceBadge}>
                  ₹{item.price}
                </div>
              </div>

              <h3 className={styles.cardTitle} title={item.title}>
                {item.title}
              </h3>
              <p className={styles.cardDesc} title={item.description}>
                {item.description}
              </p>

              {featuresList.length > 0 && (
                <ul className={styles.featuresList}>
                  {featuresList.slice(0, 2).map((feat, index) => (
                    <li key={index} className={styles.featureItem}>
                      <FaCheckCircle className={styles.checkIcon} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.cardDivider} />

              <div className={styles.pricingRow}>
                <div className={styles.priceCol}>
                  <span className={styles.priceLabel}>Access Plan</span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span className={styles.priceVal}>₹{item.price}</span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className={styles.priceOriginal}>₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>
                {item.unlocked && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FaCheckCircle size={11} /> ENROLLED
                  </span>
                )}
              </div>

              <AddToCartButton
                course={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  price: item.price,
                  originalPrice: item.originalPrice,
                  type: item.type,
                  imageUrl: item.imageUrl,
                  className: item.className,
                  features: item.features,
                  alreadyEnrolled: item.unlocked,
                }}
                showViewDetails={true}
                variant="compact"
              />
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className={styles.emptyState}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem', opacity: 0.6 }}>
              <FaBoxOpen size={36} />
            </div>
            <h3 className={styles.emptyStateTitle}>No packages found</h3>
            <p className={styles.emptyStateText}>
              {search
                ? `No premium items match "${search}". Try a different keyword or reset filters.`
                : 'No paid packages listed in this category yet. Check back soon for new releases!'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedFilter('all');
                setSelectedClassFilter('all');
              }}
              className={styles.btnDownload}
              style={{ width: 'auto', padding: '0 1.25rem', margin: '0 auto', background: 'var(--foreground)', color: 'var(--background)' }}
            >
              Clear Filters
            </button>
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
