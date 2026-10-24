"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart, CartCourse } from '@/context/CartContext';
import styles from './AddToCartButton.module.css';
import { ShoppingCart, Check, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface AddToCartButtonProps {
  course: CartCourse;
  variant?: 'primary' | 'secondary' | 'compact' | 'large';
  showViewDetails?: boolean;
  className?: string;
}

export default function AddToCartButton({
  course,
  variant = 'primary',
  showViewDetails = false,
  className = '',
}: AddToCartButtonProps) {
  const { addToCart, isInCart, isEnrolled, openCart } = useCart();
  const [animating, setAnimating] = useState(false);

  const enrolled = isEnrolled(course.id) || course.alreadyEnrolled;
  const inCart = isInCart(course.id);
  const isFree = course.price === 0;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (enrolled) {
      window.location.href = `/premium/${course.id}`;
      return;
    }

    if (inCart) {
      openCart();
      return;
    }

    setAnimating(true);
    addToCart(course);
    setTimeout(() => setAnimating(false), 600);
  };

  const getVariantClass = () => {
    if (variant === 'compact') return styles.variantCompact;
    if (variant === 'large') return styles.variantLarge;
    if (variant === 'secondary') return styles.variantSecondary;
    return styles.variantPrimary;
  };

  return (
    <div className={`${styles.btnContainer} ${className}`}>
      {enrolled ? (
        <Link
          href={`/premium/${course.id}`}
          className={`${styles.cartBtn} ${styles.btnEnrolled} ${getVariantClass()}`}
        >
          <BookOpen size={16} />
          <span>Go to Course</span>
        </Link>
      ) : inCart ? (
        <button
          type="button"
          onClick={handleClick}
          className={`${styles.cartBtn} ${styles.btnInCart} ${getVariantClass()}`}
          aria-label={`View ${course.title} in cart`}
        >
          <Check size={16} />
          <span>View Cart</span>
        </button>
      ) : isFree ? (
        <Link
          href={`/premium/${course.id}`}
          className={`${styles.cartBtn} ${styles.variantPrimary} ${getVariantClass()}`}
        >
          <Sparkles size={16} />
          <span>Enroll Free</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`${styles.cartBtn} ${getVariantClass()}`}
          disabled={animating}
          aria-label={`Add ${course.title} to cart`}
        >
          <ShoppingCart size={16} />
          <span>{animating ? 'Added!' : 'Add to Cart'}</span>
        </button>
      )}

      {showViewDetails && (
        <Link href={`/premium/${course.id}`} className={styles.detailsLink}>
          <span>View Details</span>
          <ArrowRight size={14} style={{ marginLeft: '4px' }} />
        </Link>
      )}
    </div>
  );
}
