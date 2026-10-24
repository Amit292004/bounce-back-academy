"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import styles from './CartToast.module.css';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function CartToast() {
  const { toasts, dismissToast } = useCart();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => {
        const type = toast.type || 'info';

        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${
              type === 'success'
                ? styles.toastSuccess
                : type === 'warning'
                ? styles.toastWarning
                : type === 'error'
                ? styles.toastError
                : styles.toastInfo
            }`}
          >
            <div className={styles.iconWrap}>
              {type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
              {type === 'info' && <Info size={18} color="#818cf8" />}
              {type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
              {type === 'error' && <AlertCircle size={18} color="#ef4444" />}
            </div>

            <div className={styles.content}>
              <div className={styles.title}>{toast.title}</div>
              {toast.description && <div className={styles.desc}>{toast.description}</div>}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className={styles.closeBtn}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
