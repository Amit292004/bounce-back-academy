"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';

interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements').then(res => res.json()).then(setAnnouncements);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setLoading(true);
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, priority }),
    });
    setMessage('');
    setPriority(0);
    fetchAnnouncements();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleToggle = async (a: Announcement) => {
    const updated = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, isActive: !a.isActive }),
    }).then(res => res.json());
    setAnnouncements(announcements.map(x => x.id === a.id ? updated : x));
  };

  const handlePriorityChange = async (a: Announcement, val: number) => {
    const updated = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, priority: val }),
    }).then(res => res.json());
    setAnnouncements(announcements.map(x => x.id === a.id ? updated : x));
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Announcements</h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Manage public announcements shown on the homepage.</p>

      {/* Add Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Add New Announcement</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Announcement Message"
              style={{ flex: '1 1 200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--surface-border)', outline: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap' }}>Priority:</label>
              <input
                type="number"
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                min={0}
                max={100}
                style={{ width: '80px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--surface-border)', outline: 'none', textAlign: 'center' }}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {loading ? 'Adding...' : 'Add Announcement'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Message</th>
              <th style={{ padding: '0.85rem 1rem', width: '110px', textAlign: 'center' }}>Priority</th>
              <th style={{ padding: '0.85rem 1rem', width: '90px', textAlign: 'center' }}>Visible</th>
              <th style={{ padding: '0.85rem 1rem', width: '70px', textAlign: 'center' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No announcements yet.</td></tr>
            ) : announcements.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--surface-border)', opacity: a.isActive ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{a.message}</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    defaultValue={a.priority}
                    min={0}
                    max={100}
                    onBlur={e => handlePriorityChange(a, Number(e.target.value))}
                    style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid var(--surface-border)', textAlign: 'center', outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggle(a)}
                    title={a.isActive ? 'Hide announcement' : 'Show announcement'}
                    style={{
                      background: a.isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${a.isActive ? 'var(--primary)' : 'var(--surface-border)'}`,
                      color: a.isActive ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {a.isActive ? <><FaEye /> Live</> : <><FaEyeSlash /> Hidden</>}
                  </button>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(a.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                    <FaTrash size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
