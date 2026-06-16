'use client';

import { useEffect, useState } from 'react';

interface Review {
  id: string;
  name: string;
  className: string;
  quote: string;
  score?: string;
  approved: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reviews');
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id: string, approved: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    fetchReviews();
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.approved;
    if (filter === 'approved') return r.approved;
    return true;
  });

  const pending = reviews.filter(r => !r.approved).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.35rem' }}>
          Student Reviews
        </h1>
        <p style={{ opacity: 0.55, fontSize: '0.88rem', color: 'var(--foreground)' }}>
          Approve reviews to show them on the homepage testimonials section.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: reviews.length, color: 'var(--primary)' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Approved', value: reviews.length - pending, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--surface-border)',
            borderRadius: '12px', padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.55, color: 'var(--foreground)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['pending', 'approved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--surface-border)',
              background: filter === f ? 'var(--gradient-primary)' : 'var(--surface)',
              color: filter === f ? 'white' : 'var(--foreground)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f} {f === 'pending' && pending > 0 && `(${pending})`}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <p style={{ opacity: 0.5, color: 'var(--foreground)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: 'var(--surface)', borderRadius: '12px',
          border: '1px solid var(--surface-border)', opacity: 0.6,
          color: 'var(--foreground)',
        }}>
          No {filter === 'all' ? '' : filter} reviews yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${r.approved ? 'rgba(16,185,129,0.3)' : 'var(--surface-border)'}`,
              borderRadius: '12px', padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{r.name}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.55, color: 'var(--foreground)' }}>{r.className}</span>
                    {r.score && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        background: 'var(--gradient-success)', color: 'white',
                        padding: '1px 8px', borderRadius: '999px',
                      }}>{r.score}</span>
                    )}
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px',
                      borderRadius: '999px',
                      background: r.approved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: r.approved ? 'var(--success)' : '#f59e0b',
                    }}>
                      {r.approved ? '✓ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', opacity: 0.75, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>
                    &ldquo;{r.quote}&rdquo;
                  </p>
                  <p style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '0.5rem', color: 'var(--foreground)' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {!r.approved ? (
                    <button
                      onClick={() => handleApprove(r.id, true)}
                      style={{
                        padding: '0.4rem 0.9rem', borderRadius: '7px',
                        background: 'var(--gradient-success)', color: 'white',
                        fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                      }}
                    >✓ Approve</button>
                  ) : (
                    <button
                      onClick={() => handleApprove(r.id, false)}
                      style={{
                        padding: '0.4rem 0.9rem', borderRadius: '7px',
                        background: 'var(--surface-card)', color: 'var(--foreground)',
                        fontWeight: 600, fontSize: '0.78rem',
                        border: '1px solid var(--surface-border)', cursor: 'pointer',
                      }}
                    >Unpublish</button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      padding: '0.4rem 0.7rem', borderRadius: '7px',
                      background: 'rgba(239,68,68,0.1)', color: 'var(--error)',
                      fontWeight: 700, fontSize: '0.78rem',
                      border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                    }}
                  >🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
