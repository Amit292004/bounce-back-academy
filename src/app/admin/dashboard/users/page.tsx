"use client";

import { useState, useEffect } from 'react';
import { FaUsers, FaTrash, FaWhatsapp, FaCheckCircle, FaTimes, FaEnvelope, FaPhone, FaGraduationCap, FaCalendarAlt } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  class: string;
  email: string;
  mobile?: string;
  image?: string;
  welcomeSent?: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [branding, setBranding] = useState<{ whatsappMessage?: string | null, whatsappImageUrl?: string | null }>({});
  
  // Track who we have messaged
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const markSent = async (userId: string, isNowSent: boolean = true) => {
    setSentSet(prev => {
      const next = new Set(prev);
      if (isNowSent) next.add(userId);
      else next.delete(userId);
      return next;
    });
    
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, welcomeSent: isNowSent }),
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const u = await res.json();
      setUsers(u);
      const initialSent = new Set<string>(u.filter((user: any) => user.welcomeSent).map((user: any) => user.id));
      setSentSet(initialSent);
    }
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
    const origin = window.location.origin;
    let mobile = user.mobile?.replace(/\D/g, '') || '';
    if (mobile.length === 10) mobile = `91${mobile}`;
    else if (mobile.length === 11 && mobile.startsWith('0')) mobile = `91${mobile.substring(1)}`;

    let rawText: string;
    if (!branding.whatsappMessage) {
      rawText = `Hi ${user.name}, welcome to Bounce Back Academy!`;
    } else if (/\{name\}/i.test(branding.whatsappMessage)) {
      rawText = branding.whatsappMessage.replace(/\{name\}/gi, user.name);
    } else {
      rawText = `Hi ${user.name},\n\n${branding.whatsappMessage}`;
    }

    const text = `${rawText}\n\n${origin}`;
    return `https://wa.me/${mobile}?text=${encodeURIComponent(text)}`;
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
                  {['#', 'Name', 'Email', 'Class', 'Joined', 'WhatsApp', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const isSent = sentSet.has(user.id);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border)', background: isSent ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.5, fontSize: '0.85rem', fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundImage: user.image ? `url(${user.image})` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', color: 'white', flexShrink: 0
                          }}>
                            {!user.image && user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.8, fontSize: '0.9rem' }}>{user.email}</td>
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
                          <button
                            onClick={() => markSent(user.id, !isSent)}
                            title={isSent ? 'Mark as Pending' : 'Mark as Sent'}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: isSent ? 'rgba(16,185,129,0.18)' : 'var(--surface-highlight)',
                              border: `1px solid ${isSent ? 'rgba(16,185,129,0.45)' : 'var(--surface-border)'}`,
                              color: isSent ? 'var(--success)' : 'var(--foreground)',
                              fontSize: '0.75rem', fontWeight: 600,
                              transition: 'all 0.25s', cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {isSent ? <><FaCheckCircle size={10} /> Sent</> : <>⏳ Pending</>}
                          </button>
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
                        <button onClick={() => setSelectedUser(user)} title="View Profile" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.45rem 0.8rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          View
                        </button>
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
      {/* User Profile Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>
              <FaTimes />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div 
                onClick={() => selectedUser.image && setZoomImage(selectedUser.image)}
                style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1.5rem',
                  backgroundImage: selectedUser.image ? `url(${selectedUser.image})` : 'linear-gradient(135deg, var(--primary), var(--accent))',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', color: 'white', border: '4px solid var(--surface-border)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                  cursor: selectedUser.image ? 'zoom-in' : 'default'
                }}>
                {!selectedUser.image && selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser.name}</h2>
              <p style={{ opacity: 0.6 }}>Student Profile</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaEnvelope style={{ color: 'var(--primary)', opacity: 0.7 }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>Email Address</label>
                  <span style={{ fontSize: '0.95rem' }}>{selectedUser.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaPhone style={{ color: 'var(--primary)', opacity: 0.7 }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>Mobile Number</label>
                  <span style={{ fontSize: '0.95rem' }}>{selectedUser.mobile || 'Not provided'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaGraduationCap style={{ color: 'var(--primary)', opacity: 0.7 }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>Class / Grade</label>
                  <span style={{ fontSize: '0.95rem' }}>Class {selectedUser.class}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaCalendarAlt style={{ color: 'var(--primary)', opacity: 0.7 }} />
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>Joined Platform</label>
                  <span style={{ fontSize: '0.95rem' }}>{new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => setSelectedUser(null)} className="btn-secondary" style={{ flex: 1 }}>Close</button>
              {selectedUser.mobile && (
                <a href={getWhatsAppUrl(selectedUser)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaWhatsapp /> Message
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Zoom Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={zoomImage} 
              alt="Zoomed Profile" 
              style={{ 
                maxWidth: '100%', maxHeight: '90vh', borderRadius: '15px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                border: '4px solid rgba(255,255,255,0.1)'
              }} 
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomImage(null); }}
              style={{
                position: 'absolute', top: '-1.5rem', right: '-1.5rem',
                background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
