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
                background: 'var(--surface)',
                padding: '2.5rem',
                borderBottom: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
                display: 'flex', flexDirection: 'column',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 97%, var(--foreground))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: '0.2rem', color: '#eab308', marginBottom: '1.25rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                <p style={{
                  fontSize: '1.05rem', lineHeight: 1.75, opacity: 0.85,
                  flexGrow: 1, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: '2rem'
                }}>
                  {r.quote}
                </p>
                
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', 
                  paddingTop: '1.5rem', marginTop: 'auto', position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '1px',
                    background: 'linear-gradient(90deg, color-mix(in srgb, var(--foreground) 8%, transparent), transparent)'
                  }} />
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--foreground) 10%, transparent)',
                    background: 'var(--foreground)',
                    color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '0.85rem', flexShrink: 0, letterSpacing: '0.02em'
                  }}>
                    {getInitials(r.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.15rem', letterSpacing: '-0.01em' }}>{r.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.55, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.className}</div>
                  </div>
                  {r.score && (
                    <div style={{
                      fontWeight: 600, fontSize: '0.85rem', opacity: 0.4, flexShrink: 0, letterSpacing: '-0.01em'
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
