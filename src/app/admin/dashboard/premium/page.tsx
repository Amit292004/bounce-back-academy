"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaTrash, FaPlus, FaTag, FaCheck, FaTimes, FaList, FaLink, 
  FaCoins, FaFolderOpen, FaUsers, FaEnvelope, FaPhone, FaCalendarAlt, FaSearch 
} from 'react-icons/fa';
import { getDriveImageUrl } from '@/lib/driveImage';
import { logger } from '@/lib/logger'

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  resourceId: string | null;
  isActive: boolean;
  _count?: {
    purchases: number;
  };
  createdAt: string;
}

interface ResourceOption {
  id: string;
  title: string;
  name?: string; // Courses use 'name' instead of 'title'
}

export default function AdminPremiumStorePage() {
  const [listings, setListings] = useState<PremiumItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('NOTE'); // NOTE, PYQ, COURSE, LECTURE
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [resourceId, setResourceId] = useState('');

  // Loaded resource list for easy dropdown linking
  const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Buyer Details Modal States
  const [selectedItemForBuyers, setSelectedItemForBuyers] = useState<PremiumItem | null>(null);
  const [buyersList, setBuyersList] = useState<any[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [buyersSearchQuery, setBuyersSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  // Fetch linked resources whenever product type selection changes
  useEffect(() => {
    fetchResourceOptions();
  }, [type]);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/admin/premium');
      if (res.ok) setListings(await res.json());
    } catch (err) {
      logger.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResourceOptions = async () => {
    setResourceId('');
    setResourceOptions([]);
    setLoadingResources(true);

    let endpoint = '';
    if (type === 'NOTE') endpoint = '/api/admin/notes';
    else if (type === 'PYQ') endpoint = '/api/admin/papers';
    else if (type === 'COURSE') endpoint = '/api/admin/courses';
    else if (type === 'LECTURE') endpoint = '/api/admin/videos';

    if (!endpoint) {
      setLoadingResources(false);
      return;
    }

    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        // Standardize list to match id and title/name
        setResourceOptions(data || []);
      }
    } catch (err) {
      logger.error(`Failed to load resource options for ${type}:`, err);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) return;

    // Process pipe separated features string
    const processedFeatures = featuresInput
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          imageUrl: imageUrl.trim() || null,
          features: processedFeatures,
          resourceId: resourceId || null
        })
      });

      if (res.ok) {
        // Clear form
        setTitle('');
        setDescription('');
        setPrice('');
        setOriginalPrice('');
        setImageUrl('');
        setFeaturesInput('');
        setResourceId('');
        
        // Reload list
        fetchListings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create premium listing.');
      }
    } catch (err) {
      logger.error(err);
      alert('Error creating listing.');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paid listing? Purchased histories will remain unaffected but new students will not be able to buy it.')) return;

    try {
      const res = await fetch(`/api/admin/premium/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setListings(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const handleToggleActive = async (item: PremiumItem) => {
    try {
      const res = await fetch(`/api/admin/premium/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive })
      });

      if (res.ok) {
        setListings(prev => prev.map(l => l.id === item.id ? { ...l, isActive: !l.isActive } : l));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const handleViewBuyers = async (item: PremiumItem) => {
    setSelectedItemForBuyers(item);
    setBuyersList([]);
    setLoadingBuyers(true);
    setBuyersSearchQuery('');

    try {
      const res = await fetch(`/api/admin/premium/${item.id}/purchases`);
      if (res.ok) {
        const data = await res.json();
        setBuyersList(data || []);
      } else {
        logger.error('Failed to load buyers details');
      }
    } catch (err) {
      logger.error('Error fetching buyers:', err);
    } finally {
      setLoadingBuyers(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', opacity: 0.7 }}>Loading Premium Store Dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Premium Store Listings</h1>
        <div style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
          💰 Total Products: {listings.length}
        </div>
      </div>

      {/* Create New Product Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlus /> List New Premium Item
        </h2>
        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Product Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Class 10 Trigonometry Study Package"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
                required
              />
            </div>

            {/* Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Material Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
              >
                <option value="NOTE">Premium Study Notes</option>
                <option value="PYQ">Previous Year Questions (PYQs)</option>
                <option value="COURSE">Structured Classes / Courses</option>
                <option value="LECTURE">Paid Lectures / Lessons</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            {/* Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Sales Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 99"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
                required
              />
            </div>

            {/* Original Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Original Price (₹ - Optional slash)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="e.g. 499"
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Linking Resource ID Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FaLink size={12} /> Link to Active Resource (Optional)
              </label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                disabled={loadingResources}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                  opacity: loadingResources ? 0.6 : 1
                }}
              >
                <option value="">-- No Direct File Link --</option>
                {resourceOptions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title || r.name || 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Short Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight the package. What knowledge or files are included?"
                rows={3}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            {/* Features (Pipe-separated highlight bullets) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FaList size={12} /> Package Feature Highlights (One per line)
              </label>
              <textarea
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="Direct PDF Download Link&#10;Full video explanation included&#10;Expert live doubt support"
                rows={3}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Cover image URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Cover Image URL (Optional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="e.g. https://example.com/notes-cover.jpg"
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <FaPlus /> Create Premium Listing
          </button>
        </form>
      </div>

      {/* Listing list */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Active Listings</h2>
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem' }}>Cover</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Price</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Purchases</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No premium store items listed yet.</td>
              </tr>
            ) : listings.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
                    {(() => {
                      const imgSrc = getDriveImageUrl(item.imageUrl);
                      return imgSrc ? (
                        <img
                          src={imgSrc}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.4 }}>{item.type[0]}</span>
                      );
                    })()}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: item.type === 'NOTE' ? 'rgba(99,102,241,0.1)' : item.type === 'PYQ' ? 'rgba(16,185,129,0.1)' : item.type === 'COURSE' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: item.type === 'NOTE' ? 'var(--primary)' : item.type === 'PYQ' ? '#10b981' : item.type === 'COURSE' ? '#f59e0b' : '#ef4444',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
                  }}>
                    {item.type}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span>{item.title}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.price}</span>
                    {item.originalPrice && (
                      <span style={{ fontSize: '0.8rem', opacity: 0.4, textDecoration: 'line-through' }}>₹{item.originalPrice}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleViewBuyers(item)}
                    style={{
                      padding: '0.22rem 0.6rem', borderRadius: '4px',
                      background: 'rgba(99,102,241,0.06)', color: 'var(--primary)',
                      fontWeight: 700, fontSize: '0.8rem', border: '1px solid rgba(99,102,241,0.12)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      transition: 'all 0.2s hover'
                    }}
                    title="Click to view student details"
                  >
                    {item._count?.purchases || 0} unlocks
                  </button>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleActive(item)}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: item.isActive ? '#10b981' : 'var(--error)'
                    }}
                  >
                    {item.isActive ? <FaCheck size={16} /> : <FaTimes size={16} />}
                  </button>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                    <button
                      onClick={() => handleViewBuyers(item)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.35rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                        fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)',
                        transition: 'all 0.15s ease', cursor: 'pointer'
                      }}
                      title="View Unlocked Students"
                    >
                      <FaUsers size={12} /> Buyers
                    </button>
                    <Link
                      href={`/admin/dashboard/premium/${item.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.35rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
                        fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(99,102,241,0.2)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Manage Content"
                    >
                      <FaFolderOpen size={12} /> Content
                    </Link>
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                      title="Delete listing"
                    >
                      <FaTrash size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Buyers Details Modal */}
      {selectedItemForBuyers && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '680px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaUsers style={{ color: 'var(--primary)' }} /> Student Unlock Details
                </h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>
                  For product: <strong style={{ color: 'var(--foreground)' }}>{selectedItemForBuyers.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForBuyers(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--foreground)', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Search Input for Buyers */}
            {buyersList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-highlight)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', marginBottom: '1.25rem' }}>
                <FaSearch size={14} style={{ opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Search students by name, email, or mobile..."
                  value={buyersSearchQuery}
                  onChange={(e) => setBuyersSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                />
                {buyersSearchQuery && (
                  <button onClick={() => setBuyersSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', opacity: 0.5, cursor: 'pointer' }}>
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body / Table of Buyers */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
              {loadingBuyers ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid rgba(99,102,241,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Loading unlock details...</span>
                </div>
              ) : (() => {
                const filteredBuyers = buyersList.filter(p => {
                  const query = buyersSearchQuery.toLowerCase();
                  return (
                    p.user?.name?.toLowerCase().includes(query) ||
                    p.user?.email?.toLowerCase().includes(query) ||
                    p.user?.mobile?.toLowerCase().includes(query) ||
                    p.user?.class?.toLowerCase().includes(query)
                  );
                });

                if (buyersList.length === 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '0.75rem', opacity: 0.6 }}>
                      <FaCoins size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                      <strong style={{ fontSize: '1.05rem' }}>No Unlocks Yet</strong>
                      <span style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: '280px' }}>This item hasn't been unlocked by any students yet.</span>
                    </div>
                  );
                }

                if (filteredBuyers.length === 0) {
                  return (
                    <div style={{ padding: '3rem 0', textAlign: 'center', opacity: 0.5 }}>
                      No student matches "{buyersSearchQuery}"
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredBuyers.map(purchase => (
                      <div key={purchase.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)',
                        borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
                            {purchase.user?.name}
                          </span>
                          <span style={{
                            padding: '0.15rem 0.4rem', borderRadius: '4px',
                            background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
                            fontSize: '0.7rem', fontWeight: 800
                          }}>
                            CLASS {purchase.user?.class}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FaEnvelope style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            <span>{purchase.user?.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FaPhone style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            <span>{purchase.user?.mobile || 'No Mobile Number'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', gridColumn: '1 / -1' }}>
                            <FaCalendarAlt style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            <span>Unlocked on {new Date(purchase.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedItemForBuyers(null)}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
