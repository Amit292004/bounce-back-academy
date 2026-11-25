"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaEdit, FaSave, FaTimes, FaCalendarAlt, FaEnvelope, FaPhone, FaGraduationCap, FaBookmark } from 'react-icons/fa';
import { logger } from '@/lib/logger';
import styles from './page.module.css';

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
      <div className={styles.loadingWrap}>
        Loading your profile...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Student Account</span>
        </div>
        <h1 className={styles.title}>Profile Settings</h1>
        <p className={styles.subtitle}>Manage your personal information, class selection, and account preferences.</p>
      </div>

      <div className={styles.contentWrap}>
        {/* Profile Summary Card */}
        <div className={styles.profileSummary}>
          <div className={styles.avatarWrap}>
            <div
              onClick={() => user.image && setShowImageModal(true)}
              className={styles.avatarCircle}
              style={{
                backgroundImage: user.image ? `url(${user.image})` : undefined,
                cursor: user.image ? 'zoom-in' : 'default'
              }}
            >
              {!user.image && user.name.charAt(0).toUpperCase()}
            </div>
            <label
              title="Update Photo"
              className={styles.avatarEditBtn}
              style={{ opacity: uploading ? 0.5 : 1 }}
            >
              <FaEdit />
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {user.image && (
              <button
                onClick={handleRemoveImage}
                title="Remove Photo"
                className={styles.avatarRemoveBtn}
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className={styles.summaryMeta}>
            <h2 className={styles.userName}>{user.name}</h2>
            <p className={styles.userSub}>
              Class {user.class} · Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => router.push('/favorites')}
              className={styles.favBtn}
            >
              <FaBookmark size={12} /> My Favorites
            </button>
          </div>
        </div>

        {/* Success / Error Message */}
        {message && (
          <div className={`${styles.alertMsg} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.text}
          </div>
        )}

        {/* Incomplete Profile Banner */}
        {(!user.mobile || user.class === 'Not Selected') && !editing && (
          <div className={styles.incompleteBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                <FaPhone size={16} />
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f59e0b', margin: 0 }}>Complete your profile</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary)', margin: '0.15rem 0 0' }}>Please select your class and add your mobile number.</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className={styles.incompleteBtn}
            >
              Add Now
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className={styles.detailsCard}>
          <div className={styles.detailsHeader}>
            <h2 className={styles.detailsTitle}>Account Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className={styles.editBtn}
              >
                <FaEdit size={13} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button onClick={handleCancel} className={styles.cancelBtn}>
                  <FaTimes size={12} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                  <FaSave size={12} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.fieldsList}>
            {/* Full Name */}
            <div>
              <label className={styles.fieldLabel}><FaUserCircle /> Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className={styles.input}
                />
              ) : (
                <p className={styles.fieldValue}>{user.name}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <label className={styles.fieldLabel}><FaEnvelope /> Email Address</label>
              <p
                className={styles.fieldValue}
                style={{
                  opacity: editing ? 0.55 : 1,
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
              >
                {user.email}
              </p>
              {editing && <p style={{ fontSize: '0.76rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Cannot be changed</p>}
            </div>

            {/* Class */}
            <div>
              <label className={styles.fieldLabel}><FaGraduationCap /> Your Class</label>
              {editing ? (
                <select
                  value={form.className}
                  onChange={e => setForm(p => ({ ...p, className: e.target.value }))}
                  className={styles.input}
                  style={{ cursor: 'pointer' }}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.name} style={{ background: 'var(--surface)', color: 'var(--foreground)' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.fieldValue}>Class {user.class}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className={styles.fieldLabel}><FaPhone /> Mobile Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="Enter your mobile number"
                  className={styles.input}
                />
              ) : (
                <p className={styles.fieldValue}>{user.mobile || <span style={{ color: 'var(--secondary)' }}>Not provided</span>}</p>
              )}
            </div>

            {/* Joined Date */}
            <div>
              <label className={styles.fieldLabel}><FaCalendarAlt /> Member Since</label>
              <p className={styles.fieldValue}>
                {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      {showImageModal && user.image && (
        <div
          onClick={() => setShowImageModal(false)}
          className={styles.modalOverlay}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={user.image}
              alt={user.name}
              style={{
                maxWidth: '100%', maxHeight: '90vh', borderRadius: '14px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                border: '1px solid var(--surface-border)'
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
              style={{
                position: 'absolute', top: '-1.25rem', right: '-1.25rem',
                background: 'var(--foreground)', color: 'var(--background)', border: 'none',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
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
