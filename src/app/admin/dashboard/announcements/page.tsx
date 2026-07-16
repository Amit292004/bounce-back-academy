"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaEye, FaEyeSlash, FaImage } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface Announcement {
  id: string;
  message: string | null;
  imageUrl: string | null;
  type: string;
  isActive: boolean;
  priority: number;
  className?: string | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(0);
  const [type, setType] = useState('SECTION');
  const [className, setClassName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements').then(res => res.json()).then(setAnnouncements);
  };

  const fetchCourses = () => {
    fetch('/api/admin/courses').then(res => res.json()).then(setCourses);
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchCourses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message && !image) {
      alert("Please provide either a message or an image.");
      return;
    }
    setLoading(true);

    try {
      let imageUrl = null;
      if (image && type === 'SECTION') {
        const formData = new FormData();
        formData.append('file', image);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          imageUrl = uploadData.url;
        }
      }

      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message || null, 
          priority, 
          imageUrl,
          type,
          className: className || null
        }),
      });

      setMessage('');
      setPriority(0);
      setType('SECTION');
      setClassName('');
      setImage(null);
      // Reset file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchAnnouncements();
    } catch (error) {
      logger.error("Error adding announcement:", error);
      alert("Failed to add announcement.");
    } finally {
      setLoading(false);
    }
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

  const handleTypeToggle = async (a: Announcement) => {
    const newType = a.type === 'BANNER' ? 'SECTION' : 'BANNER';
    const updated = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, type: newType }),
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

  const handleClassChange = async (a: Announcement, val: string) => {
    const updated = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, className: val || null }),
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
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" name="type" value="SECTION" checked={type === 'SECTION'} onChange={e => setType(e.target.value)} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Main Section (Grid)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" name="type" value="BANNER" checked={type === 'BANNER'} onChange={e => setType(e.target.value)} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Top Banner (Text Only)</span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Announcement Message:</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={type === 'BANNER' ? "Announcement Message (Required for banner)" : "Announcement Message (optional if image provided)"}
              required={type === 'BANNER'}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-highlight)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 200px' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Target Class/Course (Optional):</label>
              <select
                value={className}
                onChange={e => setClassName(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-highlight)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', outline: 'none' }}
              >
                <option value="">Global (All Classes)</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '120px' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Priority:</label>
              <input
                type="number"
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                min={0}
                max={100}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-highlight)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', outline: 'none', textAlign: 'center' }}
              />
            </div>
          </div>
          
          {type === 'SECTION' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: '0 0 auto' }}>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={e => setImage(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: image ? 'rgba(99,102,241,0.1)' : 'var(--surface-highlight)',
                    border: `1px dashed ${image ? 'var(--primary)' : 'var(--surface-border)'}`,
                    color: image ? 'var(--primary)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <FaImage /> {image ? image.name : 'Upload Image (optional)'}
                </button>
              </div>
              {image && (
                <button 
                  type="button" 
                  onClick={() => {
                    setImage(null);
                    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  style={{ fontSize: '0.75rem', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {loading ? 'Adding...' : 'Add Announcement'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Content</th>
              <th style={{ padding: '0.85rem 1rem', width: '150px', textAlign: 'center' }}>Target Class</th>
              <th style={{ padding: '0.85rem 1rem', width: '120px', textAlign: 'center' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem', width: '100px', textAlign: 'center' }}>Priority</th>
              <th style={{ padding: '0.85rem 1rem', width: '90px', textAlign: 'center' }}>Visible</th>
              <th style={{ padding: '0.85rem 1rem', width: '70px', textAlign: 'center' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No announcements yet.</td></tr>
            ) : announcements.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--surface-border)', opacity: a.isActive ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {a.imageUrl && (
                      <img 
                        src={a.imageUrl} 
                        alt="Announcement" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--surface-border)' }} 
                      />
                    )}
                    <span style={{ fontWeight: 500 }}>{a.message || 'Image only'}</span>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <select
                    value={a.className || ""}
                    onChange={e => handleClassChange(a, e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--surface-highlight)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', cursor: 'pointer' }}
                  >
                    <option value="">Global (All)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleTypeToggle(a)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', cursor: 'pointer' }}
                  >
                    {a.type}
                  </button>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <input
                    type="number"
                    defaultValue={a.priority}
                    min={0}
                    max={100}
                    onBlur={e => handlePriorityChange(a, Number(e.target.value))}
                    style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', background: 'var(--surface-highlight)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', textAlign: 'center', outline: 'none' }}
                  />
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggle(a)}
                    title={a.isActive ? 'Hide announcement' : 'Show announcement'}
                    style={{
                      background: a.isActive ? 'rgba(99,102,241,0.2)' : 'var(--surface-highlight)',
                      border: `1px solid ${a.isActive ? 'var(--primary)' : 'var(--surface-border)'}`,
                      color: a.isActive ? 'var(--primary)' : 'var(--foreground)',
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
