"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Tag,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getDriveImageUrl } from '@/lib/driveImage';

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    originalSubtotal,
    totalSavings,
    payableTotal,
    coupon,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    const result = await applyCoupon(couponInput);
    setCouponLoading(false);

    if (result.success) {
      setCouponInput('');
    } else {
      setCouponError(result.error || 'Failed to apply coupon');
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Sparkles size={14} />
          <span>Checkout &amp; Access</span>
        </div>
        <h1 className={styles.title}>
          <span>Course Shopping Cart</span>
          {itemCount > 0 && <span className={styles.countBadge}>{itemCount}</span>}
        </h1>
        <p className={styles.subtitle}>
          Review your chosen learning paths and study packages. Secure 256-bit payment unlocks instant lifetime curriculum access.
        </p>
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className={styles.emptyCartCard}>
          <div className={styles.emptyBigIcon}>
            <ShoppingCart size={40} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Your cart is empty</h2>
          <p style={{ opacity: 0.65, fontSize: '0.95rem', margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
            You haven&apos;t added any courses or study packages to your cart yet. Browse our comprehensive curriculum to get started!
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/courses" className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, textDecoration: 'none' }}>
              Explore Courses →
            </Link>
            <Link href="/premium" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, textDecoration: 'none' }}>
              Browse Premium Store
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Grid Layout */
        <div className={styles.cartLayout}>
          {/* Left Column: Items */}
          <section className={styles.itemsSection}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderTitle}>Course Details</span>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className={styles.clearAllBtn}
                title="Remove all courses"
              >
                <Trash2 size={14} />
                <span>Clear Cart</span>
              </button>
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f87171' }}>
                  Are you sure you want to remove all items from your cart?
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      clearCart();
                      setShowClearConfirm(false);
                    }}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      background: 'transparent',
                      color: 'var(--foreground)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '6px',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Courses List */}
            {items.map((item) => {
              const imgSrc = item.imageUrl ? getDriveImageUrl(item.imageUrl) : null;
              const savings = item.originalPrice && item.originalPrice > item.price ? item.originalPrice - item.price : 0;

              return (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemThumbWrapper}>
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc} alt={item.title} className={styles.itemThumb} />
                    ) : (
                      <span className={styles.itemThumbFallback}>
                        {item.type === 'NOTE' ? '📚' : item.type === 'PYQ' ? '📝' : item.type === 'COURSE' ? '🎓' : '⚡'}
                      </span>
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <div className={styles.itemTopRow}>
                      <div>
                        <div className={styles.itemTags}>
                          <span className={styles.typeBadge}>{item.type || 'COURSE'}</span>
                          {item.className && <span className={styles.classBadge}>{item.className}</span>}
                        </div>
                        <h3 className={styles.itemTitle}>
                          <Link href={`/premium/${item.id}`} className={styles.itemTitleLink}>
                            {item.title}
                          </Link>
                        </h3>
                        {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className={styles.removeBtn}
                        aria-label={`Remove ${item.title}`}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className={styles.itemBottomRow}>
                      <div className={styles.pricing}>
                        <span className={styles.currentPrice}>₹{item.price}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className={styles.originalPrice}>₹{item.originalPrice}</span>
                            <span className={styles.savingsTag}>Save ₹{savings}</span>
                          </>
                        )}
                      </div>

                      <Link
                        href={`/premium/${item.id}`}
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#818cf8',
                          textDecoration: 'none',
                        }}
                      >
                        View Syllabus &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping Action */}
            <div className={styles.continueShopping}>
              <Link href="/courses" className={styles.continueLink}>
                <ArrowLeft size={16} />
                <span>Continue Shopping &amp; Browse Other Courses</span>
              </Link>
            </div>
          </section>

          {/* Right Column: Order Summary Card */}
          <aside className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {/* Promo Code Input */}
            <div className={styles.couponBox}>
              <span className={styles.couponLabel}>Discount Coupon</span>
              {coupon ? (
                <div className={styles.couponFeedbackSuccess}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={14} />
                    <span>
                      <strong>{coupon.code}</strong>: -₹{coupon.discountAmount} off
                    </span>
                  </div>
                  <button type="button" onClick={removeCoupon} className={styles.removeCouponLink}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError(null);
                    }}
                    placeholder="Enter code (e.g. WELCOME50)"
                    className={styles.couponInput}
                    aria-label="Coupon code"
                  />
                  <button type="submit" disabled={couponLoading || !couponInput.trim()} className={styles.applyBtn}>
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <div className={styles.couponFeedbackError}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className={styles.calcRows}>
              <div className={styles.calcRow}>
                <span>Original Price</span>
                <span style={{ textDecoration: originalSubtotal > subtotal ? 'line-through' : 'none' }}>
                  ₹{originalSubtotal.toFixed(2)}
                </span>
              </div>

              {originalSubtotal > subtotal && (
                <div className={styles.calcRow} style={{ color: '#10b981' }}>
                  <span>Course Discounts</span>
                  <span>-₹{(originalSubtotal - subtotal).toFixed(2)}</span>
                </div>
              )}

              <div className={styles.calcRow}>
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {coupon && coupon.discountAmount > 0 && (
                <div className={styles.calcRow} style={{ color: '#10b981' }}>
                  <span>Coupon ({coupon.code})</span>
                  <span>-₹{coupon.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.calcRowTotal}>
                <span>Total Amount</span>
                <span>₹{payableTotal.toFixed(2)}</span>
              </div>
            </div>

            {totalSavings > 0 && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#10b981',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                🎉 You are saving ₹{totalSavings.toFixed(2)} on this order!
              </div>
            )}

            {/* Proceed to Checkout CTA */}
            <Link href="/checkout" className={styles.checkoutCTA}>
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>

            {/* Trust Badges */}
            <div className={styles.trustList}>
              <div className={styles.trustItem}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Verified 256-bit Secure Gateway</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Instant Lifetime Digital Access</span>
              </div>
              <div className={styles.trustItem}>
                <Sparkles size={16} color="#818cf8" />
                <span>Free Future Syllabus Updates Included</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
