"use client";

import { useState, useEffect } from 'react';
import { FaUsers, FaTrash, FaWhatsapp } from 'react-icons/fa';

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
    const defaultMsg = `Hello ${user.name},\n\nWelcome to Bounce Back Academy! We are thrilled to have you with us.`;
    let msg = branding.whatsappMessage || defaultMsg;
    msg = msg.replace(/{name}/g, user.name);
    
    // Use the short /w link for better preview
    const origin = window.location.origin;
    const shortLink = `${origin}/w`;
    
    // Formatting: Link at top generates the preview, followed by the message
    const fullMessage = `${shortLink}\n\n${msg}`;
    
    return `https://wa.me/${user.mobile?.replace(/\D/g, '')}?text=${encodeURIComponent(fullMessage)}`;
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
          <div style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>{users.length} user{users.length !== 1 ? 's' : ''} total</div>
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  {['Name', 'Email', 'Mobile', 'Class', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
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
                    <td style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {user.mobile && (
                        <a
                          href={getWhatsAppUrl(user)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Message on WhatsApp"
                          style={{ color: '#25D366', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}
                        >
                          <FaWhatsapp />
                        </a>
                      )}
                      <button onClick={() => handleDelete(user.id)} title="Delete User" style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
