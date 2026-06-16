"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

interface Review {
  id: string;
  name: string;
  className: string;
  quote: string;
  score?: string;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
];

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
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem', transition: 'var(--transition)' }}>
            <FaArrowLeft /> Back to Home
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Student Reviews
          </h1>
          <p style={{ opacity: 0.6, fontSize: '1.1rem', maxWidth: '600px' }}>
            See what thousands of students are saying about their experience with Bounce Back Academy.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--surface-card)', borderRadius: '16px', padding: '1.5rem',
                border: '1px solid var(--surface-border)', minHeight: '200px'
              }} className="skeleton" />
            ))
          ) : reviews.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
              No reviews available yet.
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r.id} style={{
                background: 'var(--surface-card)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid var(--surface-border)',
                display: 'flex', flexDirection: 'column',
                transition: 'var(--transition)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ color: '#f59e0b', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  ★★★★★
                </div>
                <p style={{
                  fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.85,
                  flexGrow: 1, marginBottom: '1.5rem', fontStyle: 'italic'
                }}>
                  &ldquo;{r.quote}&rdquo;
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                  }}>
                    {getInitials(r.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.className}</div>
                  </div>
                  {r.score && (
                    <div style={{
                      fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)',
                      background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '8px'
                    }}>
                      {r.score}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
