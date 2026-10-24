"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchTrigger.module.css';

interface DesktopSearchTriggerProps {
  onClick: () => void;
  placeholder?: string;
  className?: string;
}

export function DesktopSearchTrigger({
  onClick,
  placeholder = 'Search courses, notes, subjects...',
  className = '',
}: DesktopSearchTriggerProps) {
  const [shortcutText, setShortcutText] = useState('Ctrl K');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().includes('MAC') ||
        navigator.userAgent.toUpperCase().includes('MAC');
      setShortcutText(isMac ? '⌘ K' : 'Ctrl K');
    }
  }, []);

  return (
    <button
      type="button"
      className={`${styles.desktopTrigger} ${className}`}
      onClick={onClick}
      aria-label="Open Universal Search (Press Ctrl K)"
      title={`Open Universal Search (${shortcutText})`}
    >
      <div className={styles.triggerLeft}>
        <Search size={14} className={styles.searchIcon} aria-hidden="true" />
        <span className={styles.triggerText}>{placeholder}</span>
      </div>
      <kbd className={styles.shortcutBadge}>{shortcutText}</kbd>
    </button>
  );
}

interface MobileSearchTriggerProps {
  onClick: () => void;
  className?: string;
}

export function MobileSearchTrigger({
  onClick,
  className = '',
}: MobileSearchTriggerProps) {
  return (
    <button
      type="button"
      className={`${styles.mobileIconBtn} ${className}`}
      onClick={onClick}
      aria-label="Search courses, notes, and subjects"
      title="Search platform"
    >
      <Search size={18} />
    </button>
  );
}

interface MobileMenuSearchTriggerProps {
  onClick: () => void;
  placeholder?: string;
}

export function MobileMenuSearchTrigger({
  onClick,
  placeholder = 'Search courses, notes, subjects, exams...',
}: MobileMenuSearchTriggerProps) {
  return (
    <button
      type="button"
      className={styles.mobileMenuTrigger}
      onClick={onClick}
      aria-label="Open Universal Search"
    >
      <Search size={16} className={styles.searchIcon} aria-hidden="true" />
      <span className={styles.mobileMenuTriggerText}>{placeholder}</span>
      <kbd className={styles.shortcutBadge}>Search</kbd>
    </button>
  );
}
