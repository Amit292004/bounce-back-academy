"use client";

import { useState, useEffect } from 'react';
import { FaUsers, FaTrash, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  class: string;
  email: string;
  mobile?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<{ whatsappMessage?: string | null, whatsappImageUrl?: string | null }>({});
  
  // Track who we have messaged
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const markSent = (userId: string) => setSentSet(prev => new Set([...prev, userId]));

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const fetchBranding = async () => {
    const res = await fetch('/api/admin/branding');
    if (res.ok) setBranding(await res.json());
  };

  useEffect(() => {
    fetchUsers();
    fetchBranding();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchUsers();
  };

  const getWhatsAppUrl = (user: User) => {
    // Use the main website URL (optimized for WhatsApp preview in layout.tsx)
    const origin = window.location.origin;
    let mobile = user.mobile?.replace(/\D/g, '') || '';
    
    // Normalize Indian numbers: if 10 digits, prepend 91; if 11 digits starting with 0, replace 0 with 91
    if (mobile.length === 10) {
      mobile = `91${mobile}`;
    } else if (mobile.length === 11 && mobile.startsWith('0')) {
      mobile = `91${mobile.substring(1)}`;
    }
    
    // We only send the link; WhatsApp will generate the preview with the branding photo & message
    return `https://wa.me/${mobile}?text=${encodeURIComponent(origin)}`;
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Registered Users</h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Students who have signed up on the platform.</p>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>Loading...</div>
      ) : users.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          <FaUsers style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No registered users yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{users.length} user{users.length !== 1 ? 's' : ''} total</div>
            
            {/* Progress pills for users with mobile numbers */}
            {users.filter(u => u.mobile).length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <FaCheckCircle size={11} /> {sentSet.size} Sent
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⏳ {users.filter(u => u.mobile).length - sentSet.size} Pending
                </span>
              </div>
            )}
          </div>
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', minWidth: '680px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  {['Name', 'Email', 'Mobile', 'Class', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isSent = sentSet.has(user.id);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border)', background: isSent ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.8, fontSize: '0.9rem' }}>{user.email}</td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.8, fontSize: '0.9rem' }}>{user.mobile || 'N/A'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                          Class {user.class}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.6, fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      
                      {/* Status Column */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {user.mobile ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: isSent ? 'rgba(16,185,129,0.18)' : 'var(--surface-highlight)',
                              border: `1px solid ${isSent ? 'rgba(16,185,129,0.45)' : 'var(--surface-border)'}`,
                              color: isSent ? 'var(--success)' : 'var(--foreground)',
                              fontSize: '0.75rem', fontWeight: 600,
                              transition: 'all 0.25s', userSelect: 'none',
                            }}
                          >
                            {isSent ? <><FaCheckCircle size={10} /> Sent</> : <>⏳ Pending</>}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>No number</span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '0.85rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {user.mobile && (
                          <a
                            href={getWhatsAppUrl(user)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSent(user.id)}
                            title="Message on WhatsApp"
                            style={{
                              color: '#25D366', fontSize: '1.2rem', display: 'flex', alignItems: 'center',
                              padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(37,211,102,0.1)',
                              border: '1px solid rgba(37,211,102,0.2)'
                            }}
                          >
                            <FaWhatsapp />
                          </a>
                        )}
                        <button onClick={() => handleDelete(user.id)} title="Delete User" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: 'var(--error)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
