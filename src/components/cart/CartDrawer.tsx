"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';
import { ShoppingCart, X, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getDriveImageUrl } from '@/lib/driveImage';

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    payableTotal,
    coupon,
    isCartOpen,
    closeCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCart();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Course shopping cart"
    >
      <div className={styles.drawer} ref={drawerRef}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <ShoppingCart size={20} />
            <span>Course Cart</span>
            <span className={styles.badge}>{itemCount}</span>
          </div>

          <button onClick={closeCart} className={styles.closeBtn} aria-label="Close cart drawer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ShoppingCart size={32} />
              </div>
              <h3 className={styles.emptyTitle}>Your cart is empty</h3>
              <p className={styles.emptyDesc}>
                Explore comprehensive NBSE courses, competitive entrance bundles, and AI study assets.
              </p>
              <Link href="/courses" onClick={closeCart} className={styles.browseBtn}>
                <span>Browse Courses</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>
                  {itemCount} {itemCount === 1 ? 'course' : 'courses'} in cart
                </span>
                <button onClick={clearCart} className={styles.clearCartBtn}>
                  Clear all
                </button>
              </div>

              <div className={styles.itemsList}>
                {items.map((item) => {
                  const imgSrc = item.imageUrl ? getDriveImageUrl(item.imageUrl) : null;

                  return (
                    <div key={item.id} className={styles.itemCard}>
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={item.title} className={styles.itemThumb} />
                      ) : (
                        <div className={styles.itemThumbFallback}>
                          {item.type === 'NOTE' ? '📚' : item.type === 'PYQ' ? '📝' : item.type === 'COURSE' ? '🎓' : '⚡'}
                        </div>
                      )}

                      <div className={styles.itemInfo}>
                        <div className={styles.itemHeader}>
                          <h4 className={styles.itemTitle}>{item.title}</h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className={styles.removeBtn}
                            title="Remove from cart"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className={styles.itemMeta}>
                          <span className={styles.itemBadge}>{item.type || 'COURSE'}</span>
                          <div className={styles.itemPricing}>
                            <span className={styles.itemPrice}>₹{item.price}</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className={styles.itemOriginalPrice}>₹{item.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {coupon && coupon.discountAmount > 0 && (
              <div className={styles.summaryRow} style={{ color: '#10b981' }}>
                <span>Coupon ({coupon.code})</span>
                <span>-₹{coupon.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryRowTotal}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--foreground)' }}>₹{payableTotal.toFixed(2)}</span>
            </div>

            <div className={styles.actionRow}>
              <Link href="/checkout" onClick={closeCart} className={styles.checkoutBtn}>
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/cart" onClick={closeCart} className={styles.viewCartBtn}>
                <span>View Full Cart</span>
              </Link>
            </div>

            <div className={styles.trustRow}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Instant Lifetime Access · Verified Gateway</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
