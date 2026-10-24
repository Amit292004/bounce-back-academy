"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaWhatsapp, FaUpload, FaSave, FaCheckCircle, FaImage,
  FaBullhorn, FaUsers, FaTrash, FaRedo, FaLink, FaExternalLinkAlt, FaEye,
  FaPlus, FaClone,
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

export interface HeroAdState {
  id: string;
  imageUrl: string;
  link: string;
  title: string;
  description: string;
  buttonText: string;
  badge: string;
  badgeType: 'alert' | 'ai' | 'study' | 'sponsored';
  isActive: boolean;
  order?: number;
}

const DEFAULT_HERO_AD: HeroAdState = {
  id: 'ad-1',
  imageUrl: '',
  link: '/papers',
  title: 'Special Board Exam Preparation Pack',
  description: '10-Year solved question papers with official scoring keys and high-yield revision notes.',
  buttonText: 'Explore Past Papers',
  badge: 'Special Board Offer',
  badgeType: 'alert',
  isActive: true,
};

export default function AdvertisingPage() {
  const [ads, setAds] = useState<HeroAdState[]>([DEFAULT_HERO_AD]);
  const [selectedAdId, setSelectedAdId] = useState<string>(DEFAULT_HERO_AD.id);
  const [previewAdIndex, setPreviewAdIndex] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'heroAd' | 'whatsapp'>('heroAd');
  const [broadcastAdId, setBroadcastAdId] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');

  // WhatsApp sentSet state
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  const activeAd = ads.find(a => a.id === selectedAdId) || ads[0] || DEFAULT_HERO_AD;

  const updateCurrentAd = (updater: (prev: HeroAdState) => HeroAdState) => {
    setAds(prevList => {
      return prevList.map(item => {
        if (item.id === activeAd.id) {
          return updater(item);
        }
        return item;
      });
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adRes, usersRes] = await Promise.all([
        fetch('/api/ads/active', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
      ]);

      if (adRes.ok) {
        const adData = await adRes.json();
        if (adData) {
          if (Array.isArray(adData.ads) && adData.ads.length > 0) {
            const list: HeroAdState[] = adData.ads.map((item: any, idx: number) => ({
              id: item.id || `ad-${idx + 1}`,
              imageUrl: item.imageUrl || '',
              link: item.link || '/papers',
              title: item.title || 'Special Board Exam Preparation Pack',
              description: item.description || '',
              buttonText: item.buttonText || 'Explore Past Papers',
              badge: item.badge || 'Featured Campaign',
              badgeType: item.badgeType || 'alert',
              isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
              order: item.order !== undefined ? item.order : idx,
            }));
            setAds(list);
            setSelectedAdId(list[0].id);
            setBroadcastAdId(list[0].id);
          } else {
            const single: HeroAdState = {
              id: 'ad-1',
              imageUrl: adData.imageUrl || '',
              link: adData.link || '/papers',
              title: adData.title || 'Special Board Exam Preparation Pack',
              description: adData.description || '',
              buttonText: adData.buttonText || 'Explore Past Papers',
              badge: adData.badge || 'Sponsored Campaign',
              badgeType: adData.badgeType || 'sponsored',
              isActive: adData.isActive !== undefined ? Boolean(adData.isActive) : true,
            };
            setAds([single]);
            setSelectedAdId(single.id);
            setBroadcastAdId(single.id);
          }
        }
      }

      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u);
        const initialSent = new Set<string>(u.filter((user: User) => user.adSent).map((user: User) => user.id));
        setSentSet(initialSent);
      }
    } catch {
      showStatus('❌ Failed to fetch advertising data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    fetchData();
  }, []);

  /* ---------- Add New Advertisement ---------- */
  const handleAddNewAd = () => {
    const newId = `ad-${Date.now()}`;
    const newAd: HeroAdState = {
      id: newId,
      imageUrl: '',
      link: '/papers',
      title: `Campaign Offer #${ads.length + 1}`,
      description: 'Exclusive study materials, mock papers, and practice sets.',
      buttonText: 'Explore Offer',
      badge: 'New Offer',
      badgeType: 'study',
      isActive: true,
      order: ads.length,
    };
    setAds(prev => [...prev, newAd]);
    setSelectedAdId(newId);
    showStatus(`✨ Added new advertisement #${ads.length + 1}. Upload an image banner and set destination.`);
  };

  /* ---------- Duplicate Advertisement ---------- */
  const handleDuplicateAd = (targetAd: HeroAdState) => {
    const newId = `ad-${Date.now()}`;
    const clone: HeroAdState = {
      ...targetAd,
      id: newId,
      title: `${targetAd.title} (Copy)`,
      order: ads.length,
    };
    setAds(prev => [...prev, clone]);
    setSelectedAdId(newId);
    showStatus(`📋 Duplicated "${targetAd.title}".`);
  };

  /* ---------- Delete Advertisement ---------- */
  const handleDeleteAd = (idToDelete: string) => {
    if (ads.length <= 1) {
      // Keep at least one empty template
      const resetAd: HeroAdState = {
        ...DEFAULT_HERO_AD,
        id: `ad-${Date.now()}`,
      };
      setAds([resetAd]);
      setSelectedAdId(resetAd.id);
      showStatus('Reset to a single blank advertisement template.');
      return;
    }

    const filtered = ads.filter(a => a.id !== idToDelete);
    setAds(filtered);
    if (selectedAdId === idToDelete) {
      setSelectedAdId(filtered[0].id);
    }
    showStatus('🗑️ Advertisement deleted.');
  };

  /* ---------- Image upload via /api/upload ---------- */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'ads');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || data.path || '';
        updateCurrentAd(prev => ({ ...prev, imageUrl: uploadedUrl }));
        showStatus('✅ Image uploaded successfully!');
      } else {
        showStatus('❌ Failed to upload image.');
      }
    } catch {
      showStatus('❌ Error during image upload.');
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Save Ad Settings ---------- */
  const handleSaveAd = async () => {
    setSaving(true);
    try {
      // 1. Save list of ads to /api/ads/active
      const res = await fetch('/api/ads/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads }),
      });

      // 2. Also keep /api/admin/branding updated for WhatsApp & legacy consumers
      const primary = ads.find(a => a.isActive) || ads[0] || DEFAULT_HERO_AD;
      await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adImageUrl: primary.imageUrl || null,
          adMessage: JSON.stringify(ads),
        }),
      }).catch(() => {});

      if (res.ok) {
        try {
          localStorage.setItem('bba_hero_ad_updated', String(Date.now()));
        } catch {}
        showStatus(`✅ All ${ads.length} advertisement(s) published live to Homepage!`);
      } else {
        showStatus('❌ Failed to save advertisements.');
      }
    } catch {
      showStatus('❌ Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- WhatsApp Helper Functions ---------- */
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

  const broadcastAd = ads.find(a => a.id === broadcastAdId) || activeAd;

  const getAdWhatsAppUrl = (user: User) => {
    const base = origin || '';
    const adLink = base ? `${base}${broadcastAd.link.startsWith('/') ? broadcastAd.link : `/${broadcastAd.link}`}` : broadcastAd.link;

    let rawText: string;
    if (!broadcastAd.description) {
      rawText = `Hi ${user.name}, check out our latest offer: *${broadcastAd.title}*!`;
    } else {
      rawText = `Hi ${user.name},\n\n*${broadcastAd.title}*\n${broadcastAd.description}`;
    }

    const text = `${rawText}\n\n👉 Access Here: ${adLink}`;

    let mobile = user.mobile?.replace(/\D/g, '') || '';
    if (mobile.length === 10) mobile = `91${mobile}`;
    else if (mobile.length === 11 && mobile.startsWith('0')) mobile = `91${mobile.substring(1)}`;

    return `https://wa.me/${mobile}?text=${encodeURIComponent(text)}`;
  };

  const usersWithMobile = users.filter(u => u.mobile);
  const sentCount = sentSet.size;
  const pendingCount = usersWithMobile.length - sentCount;
  const isAdReady = !!(broadcastAd.imageUrl || broadcastAd.title);

  const PRESET_LINKS = [
    { label: 'Past Papers', url: '/papers' },
    { label: 'Study Notes', url: '/notes' },
    { label: 'Video Lectures', url: '/videos' },
    { label: 'AI Tutor', url: '/ai-tutor' },
    { label: 'Courses Hub', url: '/courses' },
    { label: 'Class 10 Hub', url: '/class/Class%2010' },
    { label: 'Class 12 Hub', url: '/class/Class%2012' },
  ];

  const activeAdsCount = ads.filter(a => a.isActive).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }} suppressHydrationWarning>
      {/* ---- Header ---- */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Advertising &amp; Promotions</h1>
          <p style={{ opacity: 0.65, marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Add any number of advertisement banners for the homepage hero carousel and broadcast campaigns to students.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleAddNewAd}
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.1rem', fontSize: '0.88rem' }}
          >
            <FaPlus size={12} /> Add New Ad
          </button>

          <button
            onClick={fetchData}
            title="Refresh"
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <FaRedo /> Refresh
          </button>

          <button
            onClick={handleSaveAd}
            disabled={saving}
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
          >
            {saving ? 'Saving…' : <><FaSave /> Save &amp; Publish All</>}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div style={{
          padding: '0.85rem 1.25rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm, 8px)',
          background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)',
          color: 'var(--foreground)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('heroAd')}
          type="button"
          style={{
            padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            background: activeTab === 'heroAd' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'heroAd' ? '#fff' : 'var(--foreground)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <FaBullhorn /> Manage Advertisements ({ads.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          type="button"
          style={{
            padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            background: activeTab === 'whatsapp' ? '#25D366' : 'transparent',
            color: activeTab === 'whatsapp' ? '#fff' : 'var(--foreground)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <FaWhatsapp /> WhatsApp Broadcast ({usersWithMobile.length})
        </button>
      </div>

      {/* ===================== TAB 1: MANAGE ADVERTISEMENTS ===================== */}
      {activeTab === 'heroAd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 1. Advertisement Cards Selector Ribbon */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.75 }}>
                  Configured Advertisements ({ads.length})
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>
                  {activeAdsCount} Active on Homepage
                </span>
              </div>

              <button
                onClick={handleAddNewAd}
                type="button"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem',
                  background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)',
                  color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600,
                }}
              >
                <FaPlus size={10} /> Add Another Ad
              </button>
            </div>

            {/* Horizontal Scroll of Ad Cards */}
            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
              {ads.map((item, index) => {
                const isSelected = item.id === activeAd.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedAdId(item.id);
                      setPreviewAdIndex(index);
                    }}
                    style={{
                      minWidth: '220px', maxWidth: '240px', padding: '0.75rem',
                      borderRadius: '10px', cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--surface-highlight)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                      transition: 'all 0.2s ease', position: 'relative', flexShrink: 0,
                    }}
                  >
                    {/* Badge & Order */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.isActive ? '#10b981' : '#888' }}>
                        #{index + 1} {item.isActive ? '● Live' : '○ Draft'}
                      </span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>
                        {item.badge}
                      </span>
                    </div>

                    {/* Thumbnail preview */}
                    <div style={{
                      width: '100%', height: '64px', borderRadius: '6px', overflow: 'hidden',
                      background: '#090d16', marginBottom: '0.4rem', position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized />
                      ) : (
                        <FaImage style={{ opacity: 0.3, fontSize: '1.2rem' }} />
                      )}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem',
                    }}>
                      {item.title}
                    </div>

                    {/* Destination Pill */}
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🔗 <code>{item.link}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Main 2-Column Workspace: Left = Selected Ad Form, Right = Live Fixed Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.75rem' }}>

            {/* Left Form: Configuration for Selected Ad */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaImage style={{ color: '#818cf8' }} /> Editing Ad: {activeAd.title}
                  </h2>
                  <span style={{ fontSize: '0.78rem', opacity: 0.55 }}>
                    Ad ID: <code>{activeAd.id}</code>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={activeAd.isActive}
                      onChange={e => updateCurrentAd(prev => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <span style={{ fontWeight: 600, color: activeAd.isActive ? '#10b981' : 'var(--foreground)', opacity: activeAd.isActive ? 1 : 0.6 }}>
                      {activeAd.isActive ? 'Active' : 'Draft'}
                    </span>
                  </label>

                  <button
                    onClick={() => handleDuplicateAd(activeAd)}
                    title="Duplicate this ad"
                    type="button"
                    style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--foreground)', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FaClone size={11} /> Clone
                  </button>

                  <button
                    onClick={() => handleDeleteAd(activeAd.id)}
                    title="Delete this ad"
                    type="button"
                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FaTrash size={11} /> Delete
                  </button>
                </div>
              </div>

              {/* 1. Image Upload / URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Ad Image / Creative Banner
                </label>
                <div style={{
                  width: '100%', height: '205px', borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border)', background: '#090d16',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative', marginBottom: '0.65rem',
                }}>
                  {activeAd.imageUrl ? (
                    <>
                      <div style={{
                        position: 'absolute', inset: '-15px', backgroundImage: `url(${activeAd.imageUrl})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(0.32)',
                        opacity: 0.65, pointerEvents: 'none',
                      }} />
                      <Image
                        src={activeAd.imageUrl}
                        alt="Ad Preview"
                        fill
                        style={{ objectFit: 'contain', zIndex: 1, filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45))' }}
                        unoptimized
                      />
                      <button
                        onClick={() => updateCurrentAd(prev => ({ ...prev, imageUrl: '' }))}
                        title="Remove image"
                        type="button"
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 2 }}
                      >
                        <FaTrash size={11} />
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                      <FaImage style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }} />
                      <p style={{ fontSize: '0.82rem' }}>No image uploaded yet</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.6rem' }}
                  >
                    <FaUpload /> {uploading ? 'Uploading…' : 'Upload Image File'}
                  </button>
                </div>

                <div style={{ marginTop: '0.6rem' }}>
                  <input
                    type="text"
                    placeholder="Or paste direct image URL (https://...)"
                    value={activeAd.imageUrl}
                    onChange={e => updateCurrentAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm, 6px)',
                      background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)',
                      color: 'var(--foreground)', fontSize: '0.82rem', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 2. Destination Link for the Black Button */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Destination Link (Target URL for the Black Button)
                </label>
                <div style={{ position: 'relative' }}>
                  <FaLink style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input
                    type="text"
                    placeholder="/papers, /courses, /class/Class 10, or https://..."
                    value={activeAd.link}
                    onChange={e => updateCurrentAd(prev => ({ ...prev, link: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                      border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                      fontSize: '0.9rem', outline: 'none', fontWeight: 500,
                    }}
                  />
                </div>

                {/* Quick Preset Link Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', opacity: 0.5, alignSelf: 'center', marginRight: '0.2rem' }}>Presets:</span>
                  {PRESET_LINKS.map(p => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => updateCurrentAd(prev => ({ ...prev, link: p.url }))}
                      style={{
                        padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--surface-border)',
                        background: activeAd.link === p.url ? 'rgba(99,102,241,0.2)' : 'var(--surface-highlight)',
                        color: activeAd.link === p.url ? '#818cf8' : 'var(--foreground)',
                        fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Black Button Text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Black Button CTA Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Explore Past Papers, Enroll Now, Learn More"
                  value={activeAd.buttonText}
                  onChange={e => updateCurrentAd(prev => ({ ...prev, buttonText: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                    border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                    fontSize: '0.9rem', outline: 'none', fontWeight: 500,
                  }}
                />
              </div>

              {/* 4. Campaign Headline / Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Campaign Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Board Exam Preparation Pack"
                  value={activeAd.title}
                  onChange={e => updateCurrentAd(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                    border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                    fontSize: '0.9rem', outline: 'none', fontWeight: 600,
                  }}
                />
              </div>

              {/* 5. Campaign Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Campaign Description (Optional)
                </label>
                <textarea
                  placeholder="Brief summary or highlight points for students..."
                  value={activeAd.description}
                  onChange={e => updateCurrentAd(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                    border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                    fontSize: '0.85rem', outline: 'none', resize: 'vertical', lineHeight: 1.5,
                  }}
                />
              </div>

              {/* 6. Badge Label & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Category Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Board Offer"
                    value={activeAd.badge}
                    onChange={e => updateCurrentAd(prev => ({ ...prev, badge: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                      border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                      fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Badge Color Type
                  </label>
                  <select
                    value={activeAd.badgeType}
                    onChange={e => updateCurrentAd(prev => ({ ...prev, badgeType: e.target.value as any }))}
                    style={{
                      width: '100%', padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-highlight)',
                      border: '1px solid var(--surface-border)', color: 'var(--foreground)',
                      fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="alert">Orange (Alert)</option>
                    <option value="study">Green (Study)</option>
                    <option value="ai">Purple (AI)</option>
                    <option value="sponsored">Pink (Offer)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveAd}
                disabled={saving}
                type="button"
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
              >
                {saving ? 'Saving Changes…' : <><FaSave /> Save &amp; Publish All Advertisements</>}
              </button>
            </div>

            {/* Right Column: Live Hero Card Preview with Slide Selector */}
            <div>
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Hero Card Preview
                </span>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Open Homepage ↗
                </a>
              </div>

              {/* Card Mockup matching PromoCarousel fixed height 435px */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px',
                padding: '1.35rem',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                height: '435px',
                maxHeight: '435px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Dynamic Glow */}
                <div style={{
                  position: 'absolute', top: '-80px', right: '-80px', width: '240px', height: '240px',
                  borderRadius: '50%', background: 'rgba(236, 72, 153, 0.18)', filter: 'blur(70px)', pointerEvents: 'none',
                }} />

                {/* Card Top Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '28px', flexShrink: 0, marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 0.75rem',
                    borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899' }} />
                    {activeAd.badge || 'Sponsored Campaign'}
                  </span>

                  <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.45 }}>
                    01 / {String(ads.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Card Body - Fills middle space with uncropped contain image */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                  {activeAd.imageUrl ? (
                    <div style={{
                      position: 'relative', width: '100%', height: '205px', borderRadius: '10px',
                      overflow: 'hidden', marginBottom: '0.55rem', border: '1px solid var(--surface-border)',
                      background: '#090d16', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        position: 'absolute', inset: '-15px', backgroundImage: `url(${activeAd.imageUrl})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(0.32) saturate(1.25)',
                        opacity: 0.65, pointerEvents: 'none', transform: 'scale(1.1)',
                      }} />
                      <Image src={activeAd.imageUrl} alt="Ad Creative" fill style={{ objectFit: 'contain', zIndex: 1, filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45))' }} unoptimized />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%', height: '205px', borderRadius: '10px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', marginBottom: '0.55rem',
                      border: '1px dashed var(--surface-border)', opacity: 0.4, flexShrink: 0,
                    }}>
                      <p style={{ fontSize: '0.8rem' }}>Ad Image will appear here</p>
                    </div>
                  )}

                  {/* Card Title & Description */}
                  <div>
                    <h3 style={{
                      fontSize: '1.18rem', fontWeight: 750, lineHeight: 1.22, letterSpacing: '-0.02em',
                      margin: '0 0 0.25rem', color: 'var(--foreground)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {activeAd.title || 'Your Campaign Headline'}
                    </h3>
                    {activeAd.description && (
                      <p style={{
                        fontSize: '0.82rem', lineHeight: 1.42, opacity: 0.72, margin: 0, color: 'var(--foreground)',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {activeAd.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Row with The Black Button */}
                <div style={{
                  position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '0.85rem', borderTop: '1px solid var(--surface-border)', marginTop: 'auto', height: '48px', flexShrink: 0,
                }}>
                  {/* THE BLACK BUTTON (as requested by user) */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem',
                    borderRadius: '10px', background: 'var(--foreground)', color: 'var(--background)',
                    fontSize: '0.88rem', fontWeight: 600, letterSpacing: '-0.01em', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    <span>{activeAd.buttonText || 'Explore Now'}</span>
                    <span style={{ fontSize: '0.95rem' }}>&rarr;</span>
                  </div>

                  {/* Pagination indicators matching total ads */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {ads.slice(0, 5).map((a, i) => (
                        <span
                          key={a.id}
                          style={{
                            width: i === 0 ? '22px' : '7px', height: '7px', borderRadius: '999px',
                            background: i === 0 ? 'var(--foreground)' : 'var(--surface-border)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.8rem', opacity: 0.85 }}>
                🎯 <strong>Button Destination:</strong> <code>{activeAd.link}</code>
                <br />
                Clicking the black button or the banner image on the homepage will immediately navigate to this target URL.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: WHATSAPP BROADCAST ===================== */}
      {activeTab === 'whatsapp' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
                <FaWhatsapp />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Send Offers via WhatsApp</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  {loading ? 'Loading…' : `${usersWithMobile.length} users with WhatsApp • auto-includes new signups`}
                </p>
              </div>
            </div>

            {/* Campaign Selector for Broadcast */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Campaign to Send:</span>
              <select
                value={broadcastAdId}
                onChange={e => setBroadcastAdId(e.target.value)}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'var(--surface-highlight)',
                  border: '1px solid var(--surface-border)', color: 'var(--foreground)', fontSize: '0.85rem',
                  fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}
              >
                {ads.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    #{i + 1} {a.title} ({a.badge})
                  </option>
                ))}
              </select>
            </div>

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
              ⚠️ Please configure an Ad Headline or Image before sending.
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
                        <td style={{ padding: '0.85rem 1rem', opacity: 0.6, fontSize: '0.85rem' }} suppressHydrationWarning>
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <a
                            href={isAdReady ? getAdWhatsAppUrl(user) : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => isAdReady && markSent(user.id)}
                            title={isAdReady ? 'Open WhatsApp chat' : 'Set ad content first'}
                            suppressHydrationWarning
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: isAdReady ? 'rgba(37,211,102,0.15)' : 'var(--surface-highlight)',
                              border: `1px solid ${isAdReady ? 'rgba(37,211,102,0.3)' : 'var(--surface-border)'}`,
                              color: isAdReady ? '#25D366' : 'var(--foreground)',
                              fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
                              cursor: isAdReady ? 'pointer' : 'not-allowed', opacity: isAdReady ? 1 : 0.4,
                            }}
                          >
                            <FaWhatsapp /> Send
                          </a>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <button
                            onClick={() => markSent(user.id, !isSent)}
                            type="button"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem',
                              border: 'none', cursor: 'pointer',
                              background: isSent ? 'rgba(16,185,129,0.15)' : 'var(--surface-highlight)',
                              color: isSent ? 'var(--success)' : 'var(--foreground)',
                              opacity: isSent ? 1 : 0.6, fontWeight: 500,
                            }}
                          >
                            {isSent ? 'Sent' : 'Mark sent'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
