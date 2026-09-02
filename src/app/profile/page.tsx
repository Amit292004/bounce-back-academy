"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaEdit, FaSave, FaTimes, FaCalendarAlt, FaEnvelope, FaPhone, FaGraduationCap, FaBookmark } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface UserProfile {
  id: string;
  name: string;
  class: string;
  email: string;
  mobile?: string | null;
  image?: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', className: '', mobile: '' });
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        setUser(data);
        if (data.class && data.class !== 'Not Selected') {
          localStorage.setItem('selectedClass', data.class);
          document.cookie = `selected_class=${encodeURIComponent(data.class)}; path=/; max-age=31536000; SameSite=Lax`;
        }
        setForm({ name: data.name, className: data.class, mobile: data.mobile || '' });
        setLoading(false);
        if (typeof window !== 'undefined' && window.location.search.includes('complete=true')) {
          setEditing(true);
        }
      });

    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(console.error);
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      } else {
        setUser(data);
        if (data.class && data.class !== 'Not Selected') {
          localStorage.setItem('selectedClass', data.class);
          document.cookie = `selected_class=${encodeURIComponent(data.class)}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new Event('profileUpdated'));
        }
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) setForm({ name: user.name, className: user.class, mobile: user.mobile || '' });
    setEditing(false);
    setMessage(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      // 1. Upload to Cloudinary via our central API
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload image to server');
      }

      const imageUrl = uploadData.url;

      // 2. Update user profile with the new URL
      const res = await fetch('/api/student/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });
      
      if (res.ok) {
        setUser(prev => prev ? { ...prev, image: imageUrl } : null);
        window.dispatchEvent(new Event('profileUpdated'));
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save profile picture' });
      }
    } catch (err: any) {
      logger.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message || 'Something went wrong during upload.' });
    } finally {
      setUploading(false);
    }
  };


  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    setUploading(true);
    try {
      const res = await fetch('/api/student/profile-pic', { method: 'DELETE' });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, image: null } : null);
        window.dispatchEvent(new Event('profileUpdated'));
        setMessage({ type: 'success', text: 'Profile picture removed.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove image.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: 0.5 }}>Loading your profile...</div>
      </div>
    );
  }

  if (!user) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'var(--surface-highlight)',
    border: '1px solid var(--surface-border)',
    color: 'var(--foreground)',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    opacity: 0.6,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2.5rem) clamp(1rem, 5vw, 1.5rem)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div 
            onClick={() => user.image && setShowImageModal(true)}
            style={{
              width: 'min(90px, 25vw)', height: 'min(90px, 25vw)', borderRadius: '50%',
              backgroundImage: user.image ? `url(${user.image})` : 'linear-gradient(135deg, var(--primary), var(--accent))',
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', border: '3px solid var(--surface-border)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflow: 'hidden',
              cursor: user.image ? 'zoom-in' : 'default'
            }}
          >
            {!user.image && user.name.charAt(0).toUpperCase()}
          </div>
          <label 
            title="Update Photo"
            style={{
              position: 'absolute', bottom: '0', right: '0',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid var(--background)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              fontSize: '0.8rem', opacity: uploading ? 0.5 : 1
            }}
          >
            <FaEdit />
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
          {user.image && (
            <button
              onClick={handleRemoveImage}
              title="Remove Photo"
              style={{
                position: 'absolute', top: '0', right: '-5px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: 'none', fontSize: '0.7rem',
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: 'clamp(1.25rem, 6vw, 1.75rem)', fontWeight: 700 }}>{user.name}</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Class {user.class} · Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button 
              onClick={() => router.push('/favorites')}
              className="btn-primary" 
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px' }}
            >
              <FaBookmark /> My Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Message */}
      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.9rem',
        }}>
          {message.text}
        </div>
      )}

      {/* Incomplete Profile Banner */}
      {(!user.mobile || user.class === 'Not Selected') && !editing && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
          padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📱</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f59e0b' }}>Complete your profile</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.1rem' }}>Please select your class and add your mobile number.</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '0.45rem 1rem', borderRadius: '7px', fontSize: '0.85rem',
              background: 'rgba(245,158,11,0.2)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.4)', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Add Now
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Account Details</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '8px',
                background: 'rgba(99,102,241,0.15)', color: 'var(--primary)',
                border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCancel}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: 'transparent', color: 'var(--foreground)',
                  opacity: 0.7,
                  border: '1px solid var(--surface-border)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                <FaTimes /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Full Name */}
          <div>
            <label style={labelStyle}><FaUserCircle /> Full Name</label>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            ) : (
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>{user.name}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <label style={labelStyle}><FaEnvelope /> Email Address</label>
            <p style={{ 
              fontSize: '1rem', 
              fontWeight: 500, 
              opacity: editing ? 0.5 : 1,
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
              maxWidth: '100%'
            }}>
              {user.email}
            </p>
            {editing && <p style={{ fontSize: '0.78rem', color: 'var(--foreground)', opacity: 0.4, marginTop: '0.25rem' }}>Cannot be changed</p>}
          </div>

          {/* Class */}
          <div>
            <label style={labelStyle}><FaGraduationCap /> Your Class</label>
            {editing ? (
              <select
                value={form.className}
                onChange={e => setForm(p => ({ ...p, className: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.name} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>Class {user.class}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label style={labelStyle}><FaPhone /> Mobile Number</label>
            {editing ? (
              <input
                type="tel"
                value={form.mobile}
                onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                placeholder="Enter your mobile number"
                style={inputStyle}
              />
            ) : (
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>{user.mobile || <span style={{ opacity: 0.4 }}>Not provided</span>}</p>
            )}
          </div>

          {/* Joined Date */}
          <div>
            <label style={labelStyle}><FaCalendarAlt /> Member Since</label>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>
              {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

        </div>
      </div>
      {/* Enlarged Image Modal */}
      {showImageModal && user.image && (
        <div 
          onClick={() => setShowImageModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={user.image} 
              alt={user.name} 
              style={{ 
                maxWidth: '100%', maxHeight: '90vh', borderRadius: '15px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                border: '4px solid rgba(255,255,255,0.1)'
              }} 
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
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
