"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  FaWhatsapp, FaUpload, FaSave, FaCheckCircle, FaImage,
  FaBullhorn, FaUsers, FaTrash, FaPaperPlane, FaRedo,
} from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  class: string;
  email: string;
  mobile?: string;
  adSent?: boolean;
  createdAt: string;
}

interface AdBranding {
  adMessage?: string | null;
  adImageUrl?: string | null;
}

export default function AdvertisingPage() {
  const [ad, setAd] = useState<AdBranding>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  // sentSet is populated automatically when Send is clicked — no manual toggles
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
      body: JSON.stringify({ id: userId, adSent: isNowSent }),
    });
  };
  const imageInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    const [brandRes, usersRes] = await Promise.all([
      fetch('/api/admin/branding'),
      fetch('/api/admin/users'),
    ]);
    if (brandRes.ok) {
      const b = await brandRes.json();
      setAd({ adMessage: b.adMessage, adImageUrl: b.adImageUrl });
    }
    if (usersRes.ok) {
      const u = await usersRes.json();
      setUsers(u);
      const initialSent = new Set<string>(u.filter((user: User) => user.adSent).map((user: User) => user.id));
      setSentSet(initialSent);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ---------- Image upload ---------- */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'ads');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setAd(prev => ({ ...prev, adImageUrl: data.url || data.path || null }));
    }
    setUploading(false);
  };

  /* ---------- Save ad settings ---------- */
  const handleSave = async () => {
    setSaving(true);
    const brandRes = await fetch('/api/admin/branding');
    const existing = brandRes.ok ? await brandRes.json() : {};
    const res = await fetch('/api/admin/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, adMessage: ad.adMessage, adImageUrl: ad.adImageUrl }),
    });
    if (res.ok) showStatus('✅ Advertisement saved successfully!');
    else showStatus('❌ Failed to save advertisement.');
    setSaving(false);
  };

  /* ---------- Per-user WhatsApp link ---------- */
  const getAdWhatsAppUrl = (user: User) => {
    const origin = window.location.origin;
    const adLink = `${origin}/ad`;

    // Always personalise with the student's name
    let rawText: string;
    if (!ad.adMessage) {
      rawText = `Hi ${user.name}, check out our latest offer!`;
    } else if (/\{name\}/i.test(ad.adMessage)) {
      rawText = ad.adMessage.replace(/\{name\}/gi, user.name);
    } else {
      rawText = `Hi ${user.name},\n\n${ad.adMessage}`;
    }

    const text = `${rawText}\n\n${adLink}`;

    let mobile = user.mobile?.replace(/\D/g, '') || '';
    if (mobile.length === 10) mobile = `91${mobile}`;
    else if (mobile.length === 11 && mobile.startsWith('0')) mobile = `91${mobile.substring(1)}`;

    return `https://wa.me/${mobile}?text=${encodeURIComponent(text)}`;
  };

  const usersWithMobile = users.filter(u => u.mobile);
  const usersWithoutMobile = users.filter(u => !u.mobile);
  const isAdReady = !!(ad.adImageUrl?.trim() || ad.adMessage?.trim());

  const sentCount = sentSet.size;
  const pendingCount = usersWithMobile.length - sentCount;

  return (
    <div>
      {/* ---- Header ---- */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Advertising</h1>
          <p style={{ opacity: 0.6, marginTop: '0.25rem' }}>Create an ad and send it to users via WhatsApp.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchData}
            title="Refresh users"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <FaRedo /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? 'Saving…' : <><FaSave /> Save Ad</>}
          </button>
        </div>
      </div>

      {/* ---- Status message ---- */}
      {statusMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', marginTop: '0.75rem',
          background: statusMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${statusMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: statusMsg.includes('✅') ? 'var(--success)' : 'var(--error)',
        }}>
          {statusMsg.includes('✅') && <FaCheckCircle />}
          {statusMsg}
        </div>
      )}

      {/* ---- Ad Composer ---- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* Ad Image */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FaImage />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ad Photo</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Shown as WhatsApp link preview image</p>
            </div>
          </div>

          <div style={{
            width: '100%', height: '200px', borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--surface-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: '1.25rem', overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)', position: 'relative',
          }}>
            {ad.adImageUrl ? (
              <>
                <Image src={ad.adImageUrl} alt="Ad Preview" fill style={{ objectFit: 'contain', padding: '0.5rem' }} unoptimized />
                <button
                  onClick={() => setAd(prev => ({ ...prev, adImageUrl: null }))}
                  title="Remove image"
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                >
                  <FaTrash size={11} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.4 }}>
                <FaImage style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>No ad image uploaded</p>
              </div>
            )}
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <FaUpload /> {uploading ? 'Uploading…' : 'Upload Ad Photo'}
          </button>
        </div>

        {/* Ad Text */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
              <FaBullhorn />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ad Message</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Sent along with the ad link on WhatsApp</p>
            </div>
          </div>

          <textarea
            value={ad.adMessage || ''}
            onChange={e => setAd(prev => ({ ...prev, adMessage: e.target.value }))}
            placeholder={`Hi {name}, 🎉 Exciting news from Bounce Back Academy!\n\nCheck out our latest offer — free study material for Classes 8–12.\n\nDon't miss out! 👇`}
            style={{
              width: '100%', minHeight: '200px', padding: '1rem',
              borderRadius: 'var(--radius-sm)', background: 'var(--surface-highlight)',
              border: '1px solid var(--surface-border)', color: 'var(--foreground)',
              fontSize: '0.9rem', resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
          />
          <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem' }}>
            💡 Use <strong>{'{name}'}</strong> to automatically personalize the message with each student&apos;s name.
          </p>

          {/* Preview card */}
          {(ad.adMessage || ad.adImageUrl) && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', opacity: 0.85 }}>
              <p style={{ fontWeight: 600, marginBottom: '0.35rem', color: '#25D366', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FaWhatsapp /> WhatsApp Preview</p>
              <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{(ad.adMessage || '').replace(/\{name\}/gi, 'Student Name')}</p>
              {ad.adImageUrl && <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>🖼️ Ad image will be shown as link preview</p>}
            </div>
          )}
        </div>
      </div>

      {/* ---- User List ---- */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <FaUsers />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Send to Users</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                {loading ? 'Loading…' : `${usersWithMobile.length} users with WhatsApp • auto-includes new signups`}
              </p>
            </div>
          </div>

          {/* Progress pills */}
          {!loading && usersWithMobile.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                <FaCheckCircle size={11} /> {sentCount} Sent
              </span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', fontSize: '0.8rem', fontWeight: 600 }}>
                ⏳ {pendingCount} Pending
              </span>
            </div>
          )}
        </div>

        {!isAdReady && (
          <div style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
            ⚠️ Please add an Ad Photo or Ad Message above before sending.
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Loading users…</div>
        ) : usersWithMobile.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            <FaUsers style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} />
            <p>No users with mobile numbers yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', minWidth: '620px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  {['Name', 'Mobile', 'Class', 'Joined', 'Send', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersWithMobile.map(user => {
                  const isSent = sentSet.has(user.id);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border)', background: isSent ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.8, fontSize: '0.9rem' }}>{user.mobile}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                          Class {user.class}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', opacity: 0.6, fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* WhatsApp Send button */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <a
                          href={isAdReady ? getAdWhatsAppUrl(user) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => isAdReady && markSent(user.id)}
                          title={isAdReady ? 'Open WhatsApp chat' : 'Set ad content first'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)',
                            background: isAdReady ? 'rgba(37,211,102,0.15)' : 'var(--surface-highlight)',
                            border: `1px solid ${isAdReady ? 'rgba(37,211,102,0.3)' : 'var(--surface-border)'}`,
                            color: isAdReady ? '#25D366' : 'var(--foreground)',
                            fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                            pointerEvents: isAdReady ? 'auto' : 'none',
                            cursor: isAdReady ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                          }}
                        >
                          <FaPaperPlane size={11} /> Send
                        </a>
                      </td>

                      {/* Interactive status indicator */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => markSent(user.id, !isSent)}
                          title={isSent ? 'Mark as Pending' : 'Mark as Sent'}
                          style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: isSent ? 'rgba(16,185,129,0.18)' : 'var(--surface-highlight)',
                              border: `1px solid ${isSent ? 'rgba(16,185,129,0.45)' : 'var(--surface-border)'}`,
                              color: isSent ? 'var(--success)' : 'var(--foreground)',
                            fontSize: '0.8rem', fontWeight: 600,
                            transition: 'all 0.25s',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {isSent ? <><FaCheckCircle size={11} /> Sent</> : <>⏳ Pending</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {usersWithoutMobile.length > 0 && (
          <p style={{ marginTop: '1.25rem', fontSize: '0.82rem', opacity: 0.45 }}>
            ⚠️ {usersWithoutMobile.length} user{usersWithoutMobile.length > 1 ? 's have' : ' has'} no mobile number and will not receive WhatsApp ads.
          </p>
        )}
      </div>

      {/* ---- Tips ---- */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>💡 How It Works</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.25rem', opacity: 0.7, fontSize: '0.875rem' }}>
          <li>Upload your Ad Photo and write the Ad Message above, then click <strong>Save Ad</strong>.</li>
          <li>Click <strong>Send</strong> next to any user — this opens WhatsApp with their number and your personalized ad pre-filled.</li>
          <li>After sending, click <strong>✓ Sent</strong> to track them as done, or <strong>✗ Not Sent</strong> to flag them. Click again to toggle.</li>
          <li>The progress pills at the top show your Sent / Not Sent / Pending counts at a glance.</li>
          <li>Use <strong>{'{name}'}</strong> in your message to greet each student by name automatically.</li>
        </ul>
      </div>
    </div>
  );
}
