"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaComments } from 'react-icons/fa';

interface FeedbackItem {
  id: string;
  name: string;
  className: string;
  message: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/feedback');
    if (res.ok) setFeedbacks(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    await fetch('/api/admin/feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchFeedbacks();
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Support Tickets</h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Messages submitted by students on the contact page.</p>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>Loading...</div>
      ) : feedbacks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          <FaComments style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No feedback yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbacks.map(fb => (
            <div key={fb.id} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{fb.name}</span>
                  <span style={{ marginLeft: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', fontSize: '0.78rem', color: 'var(--primary)' }}>Class {fb.className}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <button onClick={() => handleDelete(fb.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><FaTrash /></button>
                </div>
              </div>
              <p style={{ opacity: 0.85, lineHeight: 1.6 }}>{fb.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
