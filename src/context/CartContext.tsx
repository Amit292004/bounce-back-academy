"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

export interface CartCourse {
  id: string;
  title: string;
  description?: string;
  type?: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  className?: string | null;
  features?: string | null;
  alreadyEnrolled?: boolean;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  value: number;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export interface CartToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface CartContextType {
  items: CartCourse[];
  itemCount: number;
  subtotal: number;
  originalSubtotal: number;
  totalSavings: number;
  payableTotal: number;
  coupon: AppliedCoupon | null;
  isCartOpen: boolean;
  isLoading: boolean;
  enrolledIds: Set<string>;
  toasts: CartToastMessage[];
  // Actions
  addToCart: (course: CartCourse) => { success: boolean; message: string; alreadyInCart?: boolean; alreadyEnrolled?: boolean };
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  removeCoupon: () => void;
  isInCart: (courseId: string) => boolean;
  isEnrolled: (courseId: string) => boolean;
  dismissToast: (id: string) => void;
  refreshCart: () => Promise<void>;
  clearPurchasedItems: (purchasedIds: string[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bba_cart_v1';
const LOCAL_STORAGE_COUPON_KEY = 'bba_cart_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartCourse[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<CartToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  // Helper: Show toast notification
  const showToast = useCallback((toast: Omit<CartToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: CartToastMessage = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch enrolled courses for the logged-in user
  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/student/enrolled');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && Array.isArray(data.enrolledIds)) {
          setEnrolledIds(new Set(data.enrolledIds));
          return new Set<string>(data.enrolledIds);
        }
      }
    } catch (err) {
      logger.error('Failed to fetch enrollments:', err);
    }
    return new Set<string>();
  }, []);

  // Sync / validate cart with server
  const syncWithServer = useCallback(async (currentLocalItems: CartCourse[], currentEnrolled: Set<string>) => {
    try {
      const itemIds = currentLocalItems.map((i) => i.id).join(',');
      const res = await fetch(`/api/cart?itemIds=${encodeURIComponent(itemIds)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          // If server returned valid items, merge & update with real server prices
          const validCourses: CartCourse[] = data.items
            .filter((item: any) => !currentEnrolled.has(item.id))
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              type: item.type,
              price: item.price,
              originalPrice: item.originalPrice,
              imageUrl: item.imageUrl,
              className: item.className,
              features: item.features,
              alreadyEnrolled: currentEnrolled.has(item.id),
            }));

          setItems(validCourses);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validCourses));
          } catch {}

          // If user is authenticated, trigger server sync of any guest items
          if (data.authenticated && validCourses.length > 0) {
            await fetch('/api/cart/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemIds: validCourses.map((c) => c.id) }),
            });
          }
        }
      }
    } catch (err) {
      logger.error('Cart sync error:', err);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    setMounted(true);
    let initialItems: CartCourse[] = [];

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        initialItems = JSON.parse(stored);
        if (Array.isArray(initialItems)) {
          setItems(initialItems);
        }
      }
      const storedCoupon = localStorage.getItem(LOCAL_STORAGE_COUPON_KEY);
      if (storedCoupon) {
        setCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      logger.error('Failed to parse cart storage:', e);
    }

    // Fetch enrollments and re-validate items
    (async () => {
      const enrolled = await fetchEnrolledCourses();
      await syncWithServer(initialItems, enrolled);
      setIsLoading(false);
    })();
  }, [fetchEnrolledCourses, syncWithServer]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  // Persist items to localStorage
  const saveItems = useCallback((newItems: CartCourse[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  }, []);

  const isInCart = useCallback(
    (courseId: string) => {
      return items.some((item) => item.id === courseId);
    },
    [items]
  );

  const isEnrolled = useCallback(
    (courseId: string) => {
      return enrolledIds.has(courseId);
    },
    [enrolledIds]
  );

  // Add course to cart
  const addToCart = useCallback(
    (course: CartCourse) => {
      if (!course || !course.id) {
        return { success: false, message: 'Invalid course' };
      }

      // 1. Check if already purchased/enrolled
      if (enrolledIds.has(course.id)) {
        showToast({
          title: 'Already Owned',
          description: `You are already enrolled in "${course.title}".`,
          type: 'info',
        });
        return { success: false, message: 'Already enrolled', alreadyEnrolled: true };
      }

      // 2. Check if already in cart
      if (items.some((i) => i.id === course.id)) {
        showToast({
          title: 'Already in Cart',
          description: `"${course.title}" is already in your shopping cart.`,
          type: 'info',
        });
        setIsCartOpen(true);
        return { success: true, message: 'Already in cart', alreadyInCart: true };
      }

      // 3. Add to cart state
      const updated = [...items, course];
      saveItems(updated);

      // Async DB cart sync for authenticated student
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      }).catch(() => {});

      showToast({
        title: 'Added to Cart! 🛒',
        description: `"${course.title}" has been added to your cart.`,
        type: 'success',
      });

      return { success: true, message: 'Added to cart' };
    },
    [items, enrolledIds, saveItems, showToast]
  );

  // Remove single course from cart
  const removeFromCart = useCallback(
    (courseId: string) => {
      const removed = items.find((i) => i.id === courseId);
      const updated = items.filter((i) => i.id !== courseId);
      saveItems(updated);

      // Async DB removal
      fetch(`/api/cart?itemId=${courseId}`, { method: 'DELETE' }).catch(() => {});

      if (removed) {
        showToast({
          title: 'Item Removed',
          description: `"${removed.title}" removed from cart.`,
          type: 'info',
        });
      }
    },
    [items, saveItems, showToast]
  );

  // Clear all items from cart
  const clearCart = useCallback(() => {
    saveItems([]);
    setCoupon(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_COUPON_KEY);
    } catch {}

    fetch('/api/cart?clear=true', { method: 'DELETE' }).catch(() => {});

    showToast({
      title: 'Cart Cleared',
      description: 'All items removed from your shopping cart.',
      type: 'info',
    });
  }, [saveItems, showToast]);

  // Clear purchased items after successful checkout
  const clearPurchasedItems = useCallback(
    (purchasedIds: string[]) => {
      const set = new Set(purchasedIds);
      const remaining = items.filter((item) => !set.has(item.id));
      saveItems(remaining);
      setCoupon(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_COUPON_KEY);
      } catch {}

      // Update enrolled IDs
      setEnrolledIds((prev) => {
        const next = new Set(prev);
        purchasedIds.forEach((id) => next.add(id));
        return next;
      });
    },
    [items, saveItems]
  );

  // Totals calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [items]);

  const originalSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.originalPrice) || Number(item.price) || 0), 0);
  }, [items]);

  const discountSavings = useMemo(() => {
    return Math.max(0, originalSubtotal - subtotal);
  }, [originalSubtotal, subtotal]);

  // Coupon application
  const applyCoupon = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) {
        return { success: false, error: 'Please enter a coupon code' };
      }

      try {
        const res = await fetch('/api/cart/coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), subtotal }),
        });

        const data = await res.json();

        if (res.ok && data.valid && data.coupon) {
          setCoupon(data.coupon);
          try {
            localStorage.setItem(LOCAL_STORAGE_COUPON_KEY, JSON.stringify(data.coupon));
          } catch {}

          showToast({
            title: 'Coupon Applied! 🎉',
            description: data.coupon.message || `Saved ₹${data.coupon.discountAmount}`,
            type: 'success',
          });

          return { success: true, message: data.coupon.message };
        } else {
          return { success: false, error: data.error || 'Invalid coupon code' };
        }
      } catch (err) {
        logger.error('Failed to apply coupon:', err);
        return { success: false, error: 'Could not validate coupon. Please try again.' };
      }
    },
    [subtotal, showToast]
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_COUPON_KEY);
    } catch {}

    showToast({
      title: 'Coupon Removed',
      description: 'Coupon discount has been removed.',
      type: 'info',
    });
  }, [showToast]);

  // Payable Total calculation
  const couponDiscountAmount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discountType === 'PERCENT') {
      const calc = (subtotal * coupon.value) / 100;
      return Math.round(calc * 100) / 100;
    }
    return Math.min(coupon.value, subtotal);
  }, [coupon, subtotal]);

  const payableTotal = useMemo(() => {
    return Math.max(0, Math.round((subtotal - couponDiscountAmount) * 100) / 100);
  }, [subtotal, couponDiscountAmount]);

  const totalSavings = useMemo(() => {
    return Math.round((discountSavings + couponDiscountAmount) * 100) / 100;
  }, [discountSavings, couponDiscountAmount]);

  const refreshCart = useCallback(async () => {
    const enrolled = await fetchEnrolledCourses();
    await syncWithServer(items, enrolled);
  }, [fetchEnrolledCourses, syncWithServer, items]);

  const value: CartContextType = {
    items,
    itemCount: items.length,
    subtotal,
    originalSubtotal,
    totalSavings,
    payableTotal,
    coupon: coupon ? { ...coupon, discountAmount: couponDiscountAmount, finalAmount: payableTotal } : null,
    isCartOpen,
    isLoading,
    enrolledIds,
    toasts,
    addToCart,
    removeFromCart,
    clearCart,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen((prev) => !prev),
    applyCoupon,
    removeCoupon,
    isInCart,
    isEnrolled,
    dismissToast,
    refreshCart,
    clearPurchasedItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
