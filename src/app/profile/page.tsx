"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaEdit, FaSave, FaTimes, FaCalendarAlt, FaEnvelope, FaPhone, FaGraduationCap } from 'react-icons/fa';

interface UserProfile {
  id: string;
  name: string;
  class: string;
  email: string;
  mobile?: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', className: '', mobile: '' });

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        setUser(data);
        setForm({ name: data.name, className: data.class, mobile: data.mobile || '' });
        setLoading(false);
        if (typeof window !== 'undefined' && window.location.search.includes('complete=true')) {
          setEditing(true);
        }
      });
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
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0,
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{user.name}</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Class {user.class} · Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
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
                  background: 'var(--primary)', color: 'white',
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
          <div>
            <label style={labelStyle}><FaEnvelope /> Email Address</label>
            <p style={{ fontSize: '1rem', fontWeight: 500, opacity: editing ? 0.5 : 1 }}>
              {user.email}
              {editing && <span style={{ fontSize: '0.78rem', marginLeft: '0.75rem', color: 'var(--foreground)', opacity: 0.4 }}>Cannot be changed</span>}
            </p>
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
                {['8', '9', '10', '11', '12', 'NEET', 'JEE', 'CUET'].map(c => (
                  <option key={c} value={c} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                    {isNaN(Number(c)) ? c : `Class ${c}`}
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
    </div>
  );
}
