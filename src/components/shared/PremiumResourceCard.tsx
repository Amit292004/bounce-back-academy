'use client';

import React from 'react';
import {
  CheckCheck,
  ChevronRight,
  BookOpenCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import SafeImage from './SafeImage';
import AddToCartButton from '@/components/cart/AddToCartButton';
import styles from './PremiumResourceCard.module.css';

export interface PremiumItemData {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  resourceId?: string | null;
  className?: string | null;
  unlocked?: boolean;
}

interface PremiumResourceCardProps {
  item: PremiumItemData;
  onOpen: (item: PremiumItemData) => void;
  onInstantBuy?: (item: PremiumItemData) => void;
}

export default function PremiumResourceCard({
  item,
  onOpen,
  onInstantBuy,
}: PremiumResourceCardProps) {
  const isUnlocked = !!item.unlocked;
  const features = item.features
    ? item.features.split('|').map((f) => f.trim()).filter(Boolean)
    : [];

  const hasDiscount =
    typeof item.originalPrice === 'number' && item.originalPrice > item.price;
  const discountPercent = hasDiscount
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  return (
    <div
      className={`${styles.card} ${isUnlocked ? styles.cardEnrolled : ''}`}
      aria-label={`${item.title} - ${isUnlocked ? 'Unlocked' : `₹${item.price}`}`}
    >
      <div className={styles.mediaArea}>
        <SafeImage
          src={item.imageUrl}
          alt={item.title}
          fallbackType={
            item.type === 'NOTE'
              ? 'NOTE'
              : item.type === 'PYQ'
              ? 'PAPER'
              : item.type === 'LECTURE'
              ? 'LECTURE'
              : 'COURSE'
          }
          fallbackText={item.title}
          style={{ height: '100%', width: '100%' }}
        />
        <span className={styles.typeBadge}>{item.type}</span>
        {item.className && (
          <span className={styles.classBadge}>{item.className}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h4 className={styles.title}>{item.title}</h4>
        <p className={styles.description}>{item.description}</p>

        {features.length > 0 && (
          <div className={styles.featuresList}>
            {features.slice(0, 3).map((f, i) => (
              <div key={i} className={styles.featureItem}>
                <CheckCheck size={13} className={styles.featureIcon} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.pricing}>
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>₹{item.price}</span>
              {hasDiscount && (
                <span className={styles.originalPrice}>₹{item.originalPrice}</span>
              )}
              {hasDiscount && discountPercent > 0 && (
                <span className={styles.discountBadge}>{discountPercent}% OFF</span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            {isUnlocked ? (
              <button
                type="button"
                className={styles.viewContentBtn}
                onClick={() => onOpen(item)}
                aria-label={`Access content for ${item.title}`}
              >
                <BookOpenCheck size={15} />
                <span>View Content</span>
              </button>
            ) : (
              <>
                <AddToCartButton
                  course={{
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    originalPrice: item.originalPrice,
                    type: item.type,
                    imageUrl: item.imageUrl,
                    className: item.className || null,
                    features: item.features,
                    alreadyEnrolled: item.unlocked,
                  }}
                  variant="compact"
                />
                <button
                  type="button"
                  className={styles.buyNowBtn}
                  onClick={() => (onInstantBuy ? onInstantBuy(item) : onOpen(item))}
                  aria-label={`Buy ${item.title} instantly for ₹${item.price}`}
                >
                  <span>Buy Now</span>
                  <ChevronRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
