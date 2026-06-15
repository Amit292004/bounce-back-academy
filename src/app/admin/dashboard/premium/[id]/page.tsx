"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaPlus, FaTrash, FaFilePdf, FaVideo,
  FaFileAlt, FaSortNumericDown, FaLink, FaCheck, FaTimes
} from 'react-icons/fa';
import { logger } from '@/lib/logger';

interface PremiumItem {
  id: string;
  title: string;
  type: string;
  price: number;
  isActive: boolean;
}

interface PremiumContent {
  id: string;
  contentType: string;
  title: string;
  description: string | null;
  viewUrl: string | null;
  downloadUrl: string | null;
  youtubeLink: string | null;
  sortOrder: number;
  createdAt: string;
}

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  NOTE: { label: 'PDF Notes', icon: <FaFilePdf />, color: '#6366f1' },
  VIDEO: { label: 'Video Lecture', icon: <FaVideo />, color: '#ef4444' },
  PAPER: { label: 'Question Paper', icon: <FaFileAlt />, color: '#10b981' }
};

export default function AdminPremiumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [premiumItem, setPremiumItem] = useState<PremiumItem | null>(null);
  const [contents, setContents] = useState<PremiumContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [contentType, setContentType] = useState('NOTE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewUrl, setViewUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (itemId) {
      fetchData();
    }
  }, [itemId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemRes, contentRes] = await Promise.all([
        fetch('/api/admin/premium'),
        fetch(`/api/admin/premium/${itemId}/content`)
      ]);

      if (itemRes.ok) {
        const items = await itemRes.json();
        const found = items.find((i: PremiumItem) => i.id === itemId);
        if (found) setPremiumItem(found);
      }

      if (contentRes.ok) {
        setContents(await contentRes.json());
      }
    } catch (err) {
      logger.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setViewUrl('');
    setDownloadUrl('');
    setYoutubeLink('');
    setSortOrder(String(contents.length));
    setContentType('NOTE');
    setShowForm(false);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentType) return;
    setAdding(true);
    try {
      const body: Record<string, string | number> = {
        contentType,
        title: title.trim(),
        description: description.trim(),
        sortOrder: parseInt(sortOrder) || contents.length
      };
      if (contentType === 'VIDEO') {
        body.youtubeLink = youtubeLink.trim();
      } else {
        body.viewUrl = viewUrl.trim();
        body.downloadUrl = downloadUrl.trim();
      }

      const res = await fetch(`/api/admin/premium/${itemId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add content');
      }
    } catch (err) {
      logger.error(err);
      alert('Error adding content');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Delete this content item?')) return;
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/content/${contentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContents(prev => prev.filter(c => c.id !== contentId));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const getTypeColor = (type: string) => CONTENT_TYPE_META[type]?.color || '#6366f1';
  const getTypeIcon = (type: string) => CONTENT_TYPE_META[type]?.icon || <FaFileAlt />;
  const getTypeLabel = (type: string) => CONTENT_TYPE_META[type]?.label || type;

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--surface-border)',
    background: 'var(--surface-highlight)',
    color: 'var(--foreground)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 700,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.4rem',
    display: 'block'
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.7 }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        Loading package details...
      </div>
    );
  }

  if (!premiumItem) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ opacity: 0.6, marginBottom: '1rem' }}>Premium package not found.</p>
        <button onClick={() => router.push('/admin/dashboard/premium')} className="btn-primary">
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/admin/dashboard/premium')}
          style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--foreground)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginTop: '0.2rem', whiteSpace: 'nowrap' }}
        >
          <FaArrowLeft size={12} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{premiumItem.title}</h1>
            <span style={{
              padding: '0.2rem 0.65rem', borderRadius: '100px',
              background: 'rgba(99,102,241,0.12)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
            }}>
              {premiumItem.type}
            </span>
          </div>
          <p style={{ opacity: 0.5, marginTop: '0.3rem', fontSize: '0.9rem' }}>
            ₹{premiumItem.price} · {premiumItem.isActive ? '✅ Active' : '⛔ Hidden'} · {contents.length} content item{contents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) setSortOrder(String(contents.length)); }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontSize: '0.9rem', padding: '0.65rem 1.25rem' }}
        >
          <FaPlus size={12} /> Add Content
        </button>
      </div>

      {/* Add Content Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.25)', animation: 'fadeInUp 0.3s ease-out forwards' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus style={{ color: 'var(--primary)' }} /> Add New Content Item
          </h2>
          <form onSubmit={handleAddContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Content Type */}
            <div>
              <label style={labelStyle}>Content Type</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {Object.entries(CONTENT_TYPE_META).map(([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '8px',
                      border: `2px solid ${contentType === type ? meta.color : 'var(--surface-border)'}`,
                      background: contentType === type ? `${meta.color}18` : 'var(--surface-highlight)',
                      color: contentType === type ? meta.color : 'var(--foreground)',
                      fontWeight: 700, fontSize: '0.85rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {meta.icon} {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Sort Order */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={contentType === 'VIDEO' ? 'e.g. Chapter 3 – Motion (Full Lecture)' : 'e.g. Class 10 Science Chapter 5 Notes'}
                  required
                />
              </div>
              <div style={{ minWidth: '100px' }}>
                <label style={labelStyle}><FaSortNumericDown size={10} style={{ marginRight: '0.2rem' }} />Order</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Short Description (Optional)</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical' }}
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this content item..."
              />
            </div>

            {/* URL Fields — dynamic based on content type */}
            {contentType === 'VIDEO' ? (
              <div>
                <label style={labelStyle}><FaLink size={10} style={{ marginRight: '0.2rem' }} />YouTube Video URL *</label>
                <input
                  style={inputStyle}
                  type="url"
                  value={youtubeLink}
                  onChange={e => setYoutubeLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.35rem' }}>
                  Paste a YouTube watch URL or embed URL. It will be displayed as an embedded player.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}><FaLink size={10} style={{ marginRight: '0.2rem' }} />View / Embed URL</label>
                  <input
                    style={inputStyle}
                    type="url"
                    value={viewUrl}
                    onChange={e => setViewUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <p style={{ fontSize: '0.73rem', opacity: 0.5, marginTop: '0.3rem' }}>Google Drive share or PDF embed link</p>
                </div>
                <div>
                  <label style={labelStyle}><FaLink size={10} style={{ marginRight: '0.2rem' }} />Download URL</label>
                  <input
                    style={inputStyle}
                    type="url"
                    value={downloadUrl}
                    onChange={e => setDownloadUrl(e.target.value)}
                    placeholder="https://example.com/notes.pdf"
                  />
                  <p style={{ fontSize: '0.73rem', opacity: 0.5, marginTop: '0.3rem' }}>Direct PDF or file download link</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="btn-primary"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', opacity: adding ? 0.7 : 1 }}
              >
                {adding ? 'Adding...' : <><FaPlus size={12} /> Add Content Item</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content Items List */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', opacity: 0.8 }}>
          Content Items ({contents.length})
        </h2>

        {contents.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📦</div>
            <p style={{ opacity: 0.5, marginBottom: '1.25rem' }}>No content added yet to this premium package.</p>
            <button
              onClick={() => { setShowForm(true); setSortOrder('0'); }}
              className="btn-primary"
              style={{ fontSize: '0.9rem' }}
            >
              <FaPlus size={12} /> Add First Content Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {contents.map((content, idx) => (
              <div
                key={content.id}
                className="glass-panel"
                style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', borderLeft: `3px solid ${getTypeColor(content.contentType)}` }}
              >
                {/* Rank badge */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                  background: `${getTypeColor(content.contentType)}18`,
                  color: getTypeColor(content.contentType),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  {getTypeIcon(content.contentType)}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.97rem' }}>{content.title}</span>
                    <span style={{
                      padding: '0.1rem 0.5rem', borderRadius: '4px',
                      background: `${getTypeColor(content.contentType)}18`,
                      color: getTypeColor(content.contentType),
                      fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {getTypeLabel(content.contentType)}
                    </span>
                    <span style={{ opacity: 0.35, fontSize: '0.75rem' }}>#{idx + 1}</span>
                  </div>
                  {content.description && (
                    <p style={{ fontSize: '0.83rem', opacity: 0.6, marginBottom: '0.5rem' }}>{content.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {content.youtubeLink && (
                      <a href={content.youtubeLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FaVideo size={11} /> YouTube Link
                      </a>
                    )}
                    {content.viewUrl && (
                      <a href={content.viewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FaFilePdf size={11} /> View PDF
                      </a>
                    )}
                    {content.downloadUrl && (
                      <a href={content.downloadUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        ↓ Download
                      </a>
                    )}
                    {!content.youtubeLink && !content.viewUrl && !content.downloadUrl && (
                      <span style={{ fontSize: '0.75rem', opacity: 0.35, fontStyle: 'italic' }}>No URLs added yet</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteContent(content.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.3rem', marginTop: '0.1rem', flexShrink: 0, opacity: 0.7, transition: 'opacity 0.15s ease' }}
                  title="Delete this content item"
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                >
                  <FaTrash size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
