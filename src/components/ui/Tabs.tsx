"use client";

import React from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  const isPill = variant === 'pill';
  const containerClass = isPill ? styles.pillContainer : styles.container;

  return (
    <div className={`${containerClass} ${className}`} role="tablist">
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const activeClass = isPill
          ? isActive ? styles.activePill : ''
          : isActive ? styles.activeUnderline : '';

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${activeClass}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={styles.countBadge}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
