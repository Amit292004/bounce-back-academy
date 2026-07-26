"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaLock, FaShoppingCart, FaCheckCircle, FaFilePdf,
  FaVideo, FaFileAlt, FaDownload, FaExternalLinkAlt, FaShieldAlt,
  FaChevronRight, FaCreditCard, FaMobileAlt, FaTimes, FaCoins, FaPlay
} from 'react-icons/fa';
import styles from './page.module.css';
import { getDriveImageUrl } from '@/lib/driveImage';
import { getDownloadLink, handleDownload } from '@/lib/utils';


interface PremiumContent {
  id: string;
  contentType: string;
  title: string;
  description: string | null;
  viewUrl?: string;
  downloadUrl?: string;
  youtubeLink?: string;
  sortOrder: number;
}

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  isActive: boolean;
  isUnlocked: boolean;
  contents: PremiumContent[];
}

export default function PremiumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<PremiumItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [payTab, setPayTab] = useState<'card' | 'upi'>('card');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loaderMessage, setLoaderMessage] = useState('Securing Gateway Connection...');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loadingPaymentInit, setLoadingPaymentInit] = useState(false);

  // Content viewer
  const [activeContent, setActiveContent] = useState<PremiumContent | null>(null);

  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

  useEffect(() => {
    if (itemId) {
      fetchItem();
      fetchMaterialTypes();
    }
  }, [itemId]);

  const fetchMaterialTypes = async () => {
    try {
      const res = await fetch('/api/admin/material-types');
      if (res.ok) setMaterialTypes(await res.json());
    } catch {}
  };

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/premium/${itemId}`);
      if (res.ok) {
        setItem(await res.json());
      } else {
        router.replace('/premium');
      }
    } catch {
      router.replace('/premium');
    } finally {
      setLoading(false);
    }
  };

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Cashfree) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleUnlockClick = async () => {
    setLoadingPaymentInit(true);
    try {
      const res = await fetch('/api/premium/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumItemId: itemId })
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          router.push('/login?redirect=/premium/' + itemId);
          return;
        }
        alert(data.error || 'Failed to initiate purchase.');
        return;
      }

      const orderData = await res.json();

      if (orderData.alreadyUnlocked) {
        fetchItem();
        return;
      }

      if (orderData.mode === 'cashfree') {
        const loaded = await loadCashfreeScript();
        if (!loaded) { alert('Failed to load Cashfree payment SDK.'); return; }

        const cashfree = new (window as any).Cashfree({
          mode: orderData.environment || 'production'
        });

        // Cashfree checkout redirects to return_url after payment
        cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_self'
        });
      } else {
        setShowCheckout(true);
        setCheckoutStep('details');
        setCardNumber(''); setCardExpiry(''); setCardCvv(''); setUpiId('');
      }
    } finally {
      setLoadingPaymentInit(false);
    }
  };

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('processing');
    setLoaderMessage('Securing Gateway Connection...');
    setTimeout(() => { setLoaderMessage('Verifying simulated funds...'); }, 1000);
    setTimeout(() => { setLoaderMessage('Authorizing purchase transaction...'); }, 2200);
    setTimeout(async () => {
      const res = await fetch('/api/premium/purchase/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumItemId: itemId, simulatedConfirm: true })
      });
      if (res.ok) {
        setCheckoutStep('success');
        fetchItem();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to complete payment.');
        setCheckoutStep('details');
      }
    }, 3700);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'VIDEO') return <FaVideo />;
    if (type === 'PAPER') return <FaFileAlt />;
    return <FaFilePdf />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'VIDEO') return '#ef4444';
    if (type === 'PAPER') return '#10b981';
    return '#6366f1';
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <span>Loading premium package...</span>
      </div>
    );
  }

  if (!item) return null;

  const featuresList = item.features ? item.features.split('|').map(f => f.trim()).filter(Boolean) : [];
  const getItemTypeLabel = (code: string) => {
    const matched = materialTypes.find(mt => mt.code === code);
    if (matched) return matched.name;
    if (code === 'NOTE') return 'Study Notes';
    if (code === 'PYQ') return 'Board PYQ';
    if (code === 'COURSE') return 'Full Course';
    if (code === 'LECTURE') return 'Lecture Pack';
    return code;
  };

  const getItemTypeColor = (code: string) => {
    if (code === 'NOTE') return 'var(--primary)';
    if (code === 'PYQ') return '#10b981';
    if (code === 'COURSE') return '#f59e0b';
    if (code === 'LECTURE') return '#ef4444';
    return 'var(--primary)';
  };

  const typeLabel = getItemTypeLabel(item.type);
  const typeColor = getItemTypeColor(item.type);

  return (
    <div className={styles.page}>
      {/* Back */}
      <button onClick={() => { if (window.history.length > 1) router.back(); else router.push('/premium'); }} className={styles.backBtn}>
        <FaArrowLeft size={12} /> Back
      </button>

      <div className={styles.layout}>
        {/* Left Column — main content */}
        <div className={styles.mainCol}>
          {/* Hero banner */}
          <div className={styles.heroBanner}>
            {(() => {
              const imgSrc = getDriveImageUrl(item.imageUrl);
              return imgSrc ? (
                <img
                  src={imgSrc}
                  alt={item.title}
                  className={styles.heroImg}
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    t.style.display = 'none';
                    const next = t.nextElementSibling as HTMLElement;
                    if (next) next.style.display = 'flex';
                  }}
                />
              ) : null;
            })()}
            {/* Fallback when no image set or image fails to load */}
            <div
              className={styles.heroImg}
              style={{
                display: item.imageUrl ? 'none' : 'flex',
                background: 'var(--surface-highlight)',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.75rem',
                color: 'var(--foreground)',
                opacity: 0.3
              }}
            >
              <span style={{ fontSize: '4rem' }}>
                {item.type === 'NOTE' ? '📚' : item.type === 'PYQ' ? '📝' : item.type === 'COURSE' ? '🎓' : item.type === 'LECTURE' ? '🎬' : '📦'}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No image added</span>
            </div>
            <div className={styles.heroOverlay}>
              <span className={styles.typeBadge} style={{ background: typeColor }}>
                {typeLabel}
              </span>
              <h1 className={styles.heroTitle}>{item.title}</h1>
              {item.isUnlocked && (
                <span className={styles.unlockedPill}>
                  <FaCheckCircle /> Access Granted
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={`glass-panel ${styles.descCard}`}>
            <h2 className={styles.sectionTitle}>About This Package</h2>
            <p className={styles.descText}>{item.description}</p>

            {featuresList.length > 0 && (
              <div className={styles.featureList}>
                {featuresList.map((f, i) => (
                  <div key={i} className={styles.featureItem}>
                    <FaCheckCircle className={styles.featureIcon} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contents Section */}
          <div className={`glass-panel ${styles.contentsCard}`}>
            <h2 className={styles.sectionTitle}>
              📦 Package Contents ({item.contents.length} item{item.contents.length !== 1 ? 's' : ''})
            </h2>

            {item.contents.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.9rem', padding: '1rem 0' }}>
                Content is being added to this package. Check back soon!
              </p>
            ) : (
              <div className={styles.contentsList}>
                {item.contents.map((content, idx) => (
                  <div
                    key={content.id}
                    className={styles.contentRow}
                    style={{ borderLeft: `3px solid ${getTypeColor(content.contentType)}` }}
                  >
                    <div className={styles.contentIcon} style={{ color: getTypeColor(content.contentType), background: `${getTypeColor(content.contentType)}18` }}>
                      {getTypeIcon(content.contentType)}
                    </div>
                    <div className={styles.contentInfo}>
                      <div className={styles.contentTitle}>{content.title}</div>
                      {content.description && (
                        <div className={styles.contentDesc}>{content.description}</div>
                      )}
                      <div className={styles.contentMeta}>
                        <span style={{ color: getTypeColor(content.contentType), fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {content.contentType === 'VIDEO' ? 'Video Lecture' : content.contentType === 'PAPER' ? 'Question Paper' : 'PDF Notes'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons — only visible if unlocked */}
                    {item.isUnlocked ? (
                      <div className={styles.contentActions}>
                        {content.youtubeLink && (
                          <button
                            onClick={() => setActiveContent(content)}
                            className={styles.watchBtn}
                          >
                            <FaPlay size={10} /> Watch
                          </button>
                        )}
                        {content.viewUrl && (
                          <a href={content.viewUrl} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                            <FaExternalLinkAlt size={10} /> View
                          </a>
                        )}
                        {content.downloadUrl && (
                          <button
                            onClick={() => handleDownload(getDownloadLink(content.downloadUrl || ''), `${content.title}.pdf`)}
                            className={styles.dlBtn}
                            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                            title="Download File"
                          >
                            <FaDownload size={10} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={styles.lockedIcon}>
                        <FaLock size={12} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!item.isUnlocked && item.contents.length > 0 && (
              <div className={styles.lockedOverlayBanner}>
                <FaLock />
                <span>Purchase to unlock all {item.contents.length} content item{item.contents.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Sticky purchase card */}
        <div className={styles.sideCol}>
          <div className={`glass-panel ${styles.purchaseCard}`}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceVal}>₹{item.price}</span>
              {item.originalPrice && (
                <span className={styles.priceOriginal}>₹{item.originalPrice}</span>
              )}
              {item.originalPrice && (
                <span className={styles.discountBadge}>
                  {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {item.isUnlocked ? (
              <div className={styles.unlockedState}>
                <FaCheckCircle className={styles.unlockedIcon} />
                <p className={styles.unlockedMsg}>You have access to this package!</p>
                <p style={{ fontSize: '0.82rem', opacity: 0.6, marginTop: '0.4rem' }}>
                  Click content items above to access materials.
                </p>
              </div>
            ) : (
              <button
                onClick={handleUnlockClick}
                disabled={loadingPaymentInit}
                className="btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 800, marginTop: '1rem' }}
              >
                {loadingPaymentInit ? (
                  <><div className={styles.btnSpinner} /> Processing...</>
                ) : (
                  <><FaShoppingCart /> Unlock Instantly</>
                )}
              </button>
            )}

            <div className={styles.secureNote}>
              <FaShieldAlt style={{ color: '#10b981' }} />
              <span>Secure payment · Instant access</span>
            </div>

            <div className={styles.contentSummary}>
              <p className={styles.summaryLabel}>This package includes:</p>
              {['NOTE', 'VIDEO', 'PAPER'].map(type => {
                const count = item.contents.filter(c => c.contentType === type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className={styles.summaryRow}>
                    <span style={{ color: getTypeColor(type) }}>{getTypeIcon(type)}</span>
                    <span>{count} {type === 'NOTE' ? 'PDF Note' : type === 'VIDEO' ? 'Video Lecture' : 'Question Paper'}{count > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
              {item.contents.length === 0 && (
                <p style={{ opacity: 0.4, fontSize: '0.82rem' }}>Contents being added soon</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Viewer Modal (for videos/PDFs) */}
      {activeContent && item.isUnlocked && (
        <div className={styles.viewerOverlay} onClick={() => setActiveContent(null)}>
          <div className={styles.viewerModal} onClick={e => e.stopPropagation()}>
            <div className={styles.viewerHeader}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {activeContent.contentType === 'VIDEO' ? 'Video Lecture' : 'PDF Notes'}
                </span>
                <h3 className={styles.viewerTitle}>{activeContent.title}</h3>
              </div>
              <button onClick={() => setActiveContent(null)} className={styles.viewerClose}>
                <FaTimes />
              </button>
            </div>

            {activeContent.youtubeLink && (
              <div className={styles.videoWrapper}>
                <iframe
                  src={getYoutubeEmbedUrl(activeContent.youtubeLink)}
                  title={activeContent.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={styles.videoEmbed}
                />
              </div>
            )}

            {activeContent.viewUrl && !activeContent.youtubeLink && (
              <div className={styles.pdfWrapper}>
                <iframe src={activeContent.viewUrl} className={styles.pdfEmbed} title={activeContent.title} />
              </div>
            )}

            <div className={styles.viewerActions}>
              {activeContent.downloadUrl && (
                <button
                  onClick={() => handleDownload(getDownloadLink(activeContent.downloadUrl || ''), `${activeContent.title}.pdf`)}
                  className="btn-primary"
                  style={{ fontSize: '0.9rem', padding: '0.65rem 1.25rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FaDownload /> Download
                </button>
              )}
              {activeContent.viewUrl && !activeContent.youtubeLink && (
                <a href={activeContent.viewUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '0.65rem 1.25rem' }}>
                  <FaExternalLinkAlt /> Open in New Tab
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className={styles.checkoutOverlay}>
          <div className={`glass-panel ${styles.checkoutModal}`}>
            <div className={styles.checkoutHeader}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  VIP Academy Checkout
                </span>
                <h3 className={styles.checkoutTitle}>Unlock Premium Package</h3>
              </div>
              {checkoutStep !== 'processing' && (
                <button onClick={() => setShowCheckout(false)} className={styles.checkoutClose}>
                  <FaTimes />
                </button>
              )}
            </div>

            {checkoutStep === 'details' && (
              <form onSubmit={handleAuthorizePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.receipt}>
                  <div className={styles.receiptItem}>{item.title}</div>
                  {item.originalPrice && (
                    <div className={styles.receiptRow}>
                      <span>Original:</span>
                      <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>₹{item.originalPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {item.originalPrice && (
                    <div className={styles.receiptRow} style={{ color: '#10b981' }}>
                      <span>Discount:</span>
                      <span>-₹{(item.originalPrice - item.price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.receiptRow}><span>GST:</span><span>₹0.00 (Waived)</span></div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptTotal}><span>Total:</span><span>₹{item.price.toFixed(2)}</span></div>
                </div>

                <div className={styles.payTabs}>
                  <button type="button" className={`${styles.payTab} ${payTab === 'card' ? styles.payTabActive : ''}`} onClick={() => setPayTab('card')}>
                    <FaCreditCard size={11} /> Credit/Debit Card
                  </button>
                  <button type="button" className={`${styles.payTab} ${payTab === 'upi' ? styles.payTabActive : ''}`} onClick={() => setPayTab('upi')}>
                    <FaMobileAlt size={11} /> Simulated UPI
                  </button>
                </div>

                {payTab === 'card' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>CARD NUMBER (Simulated)</label>
                      <input type="text" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))} placeholder="4111 2222 3333 4444" className={styles.formInput} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>EXPIRY</label>
                        <input type="text" maxLength={5} value={cardExpiry} onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/^(\d{2})(?=\d)/g, '$1/'))} placeholder="MM/YY" className={styles.formInput} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>CVV</label>
                        <input type="password" maxLength={3} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} placeholder="***" className={styles.formInput} required />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>UPI ID (Simulated)</label>
                    <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="student@okaxis" className={styles.formInput} required />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ padding: '0.85rem', width: '100%', fontWeight: 800 }}>
                  <FaShieldAlt /> Authorize Payment <FaChevronRight size={10} />
                </button>
              </form>
            )}

            {checkoutStep === 'processing' && (
              <div className={styles.processingState}>
                <div className={styles.checkoutSpinner} />
                <span className={styles.processingMsg}>{loaderMessage}</span>
                <span className={styles.processingNote}>Please do not close this window.</span>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className={styles.successState}>
                <FaCheckCircle className={styles.successIcon} />
                <h3 className={styles.successTitle}>Access Unlocked! 🎉</h3>
                <p className={styles.successMsg}>
                  Your purchase was successful. All content items in this package are now available.
                </p>
                <button onClick={() => setShowCheckout(false)} className="btn-primary" style={{ width: '100%', padding: '0.8rem', fontWeight: 800 }}>
                  View My Content <FaChevronRight size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
