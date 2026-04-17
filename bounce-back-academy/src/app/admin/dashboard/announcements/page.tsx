"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/announcements').then(res => res.json()).then(setAnnouncements);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    await fetch('/api/admin/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
    });
    setMessage('');
    fetch('/api/admin/announcements').then(res => res.json()).then(setAnnouncements);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Announcements</h1>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} required placeholder="Announcement Message"
            style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--surface-border)' }} />
          <button type="submit" className="btn-primary"><FaPlus /> Add</button>
        </form>
      </div>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '1rem' }}>Message</th>
              <th style={{ padding: '1rem', width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>{a.message}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(a.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                    <FaTrash size={18} />
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
