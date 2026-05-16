'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaRobot, FaTimes } from 'react-icons/fa';
import styles from './AiFloatingButton.module.css';

export default function AiFloatingButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show tooltip after 3 seconds if not dismissed before
    const alreadyDismissed = localStorage.getItem('bba-ai-tooltip-dismissed');
    if (!alreadyDismissed) {
      const timer = setTimeout(() => setShowTooltip(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
    setDismissed(true);
    localStorage.setItem('bba-ai-tooltip-dismissed', '1');
  };

  // Don't show on the ask page itself
  if (!mounted || pathname === '/ask') return null;

  return (
    <div className={styles.wrapper}>
      {showTooltip && !dismissed && (
        <div className={styles.tooltip}>
          <button
            id="ai-tooltip-dismiss"
            className={styles.tooltipClose}
            onClick={handleDismissTooltip}
            aria-label="Dismiss"
          >
            <FaTimes />
          </button>
          <p className={styles.tooltipText}>
            🤖 Ask any doubt instantly — free!
          </p>
          <p className={styles.tooltipSub}>NBSE · JEE · NEET · CUET</p>
        </div>
      )}
      <Link
        href="/ask"
        id="ai-floating-btn"
        className={styles.btn}
        aria-label="AI Doubt Solver"
        onClick={() => { setShowTooltip(false); }}
      >
        <FaRobot className={styles.icon} />
        <span className={styles.label}>Ask AI</span>
      </Link>
    </div>
  );
}
