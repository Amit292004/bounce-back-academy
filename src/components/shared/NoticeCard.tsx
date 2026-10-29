'use client';

import React from 'react';
import { Bell, Clock, AlertCircle, Calendar } from 'lucide-react';
import SafeImage from './SafeImage';
import styles from './NoticeCard.module.css';

export interface AnnouncementItem {
  id: string;
  message: string | null;
  imageUrl: string | null;
  type: string;
  isActive: boolean;
  priority: number;
  createdAt: Date | string;
  className?: string | null;
}

interface NoticeCardProps {
  notice: AnnouncementItem;
}

export default function NoticeCard({ notice }: NoticeCardProps) {
  const isBanner = notice.type === 'BANNER' || notice.priority > 5;
  const createdDate = new Date(notice.createdAt);

  // Format date nicely e.g. "14 Jul 2026"
  const formattedDate = !isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  // Calculate relative time
  const timeAgo = (() => {
    if (isNaN(createdDate.getTime())) return '';
    const diff = Date.now() - createdDate.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} mo ago`;
    }
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    return `${Math.max(1, mins)}m ago`;
  })();

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.badgeArea}>
          <span
            className={`${styles.tag} ${
              isBanner ? styles.tagImportant : styles.tagNotice
            }`}
          >
            {isBanner ? <AlertCircle size={13} /> : <Bell size={13} />}
            {isBanner ? 'Important' : 'Notice'}
          </span>
          {notice.className && (
            <span className={styles.classTarget}>Target: {notice.className}</span>
          )}
        </div>

        <div className={styles.dateArea}>
          <Calendar size={13} />
          <span>{formattedDate}</span>
          {timeAgo && <span>({timeAgo})</span>}
        </div>
      </div>

      {notice.imageUrl && (
        <div className={styles.mediaWrapper}>
          <SafeImage
            src={notice.imageUrl}
            alt="Notice announcement attachment"
            fallbackType="NOTE"
            aspectRatio="banner"
            style={{ maxHeight: '220px' }}
          />
        </div>
      )}

      {notice.message && <p className={styles.message}>{notice.message}</p>}
    </article>
  );
}
