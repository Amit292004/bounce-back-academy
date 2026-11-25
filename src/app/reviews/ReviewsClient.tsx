"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

interface Review {
  id: string;
  name: string;
  className: string;
  quote: string;
  score?: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AllReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews?limit=all');
        if (res.ok) {
          setReviews(await res.json());
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={15} /> Back to Home
        </Link>
        <div>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            <span>Student Stories</span>
          </div>
          <h1 className={styles.title}>Student Reviews</h1>
          <p className={styles.subtitle}>
            See what thousands of students are saying about their experience with Bounce Back Academy.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true">
              <div className={`${styles.skeletonStars} skeleton`} />
              <div className={styles.skeletonQuoteLines}>
                <div className={`${styles.skeletonLine} skeleton`} style={{ width: '96%' }} />
                <div className={`${styles.skeletonLine} skeleton`} style={{ width: '88%' }} />
                <div className={`${styles.skeletonLine} skeleton`} style={{ width: '64%' }} />
              </div>
              <div className={styles.skeletonAuthorRow}>
                <div className={`${styles.skeletonAvatar} skeleton`} />
                <div className={styles.skeletonMetaLines}>
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '55%', height: '13px' }} />
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '40%', height: '11px' }} />
                </div>
              </div>
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>
            No reviews available yet.
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={styles.card}>
              {/* Stars */}
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className={styles.quote}>{r.quote}</p>

              <div className={styles.author}>
                <div className={styles.avatar}>
                  {getInitials(r.name)}
                </div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>{r.name}</div>
                  <div className={styles.authorMeta}>{r.className}</div>
                </div>
                {r.score && (
                  <div className={styles.score}>{r.score}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
