"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaUpload, FaSave, FaCheckCircle, FaImage, FaUserCircle, FaTrash } from 'react-icons/fa';

interface Branding {
  siteLogo?: string | null;
  adminPhoto?: string | null;
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<Branding>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/branding')
      .then(res => res.json())
      .then(data => setBranding(data || {}));
  }, []);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || data.path || null;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadFile(file, 'branding');
    if (url) setBranding(prev => ({ ...prev, siteLogo: url }));
    setUploadingLogo(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadFile(file, 'branding');
    if (url) setBranding(prev => ({ ...prev, adminPhoto: url }));
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        setMessage('Branding saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save branding.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Branding</h1>
          <p style={{ opacity: 0.6, marginTop: '0.25rem' }}>Manage your site logo and admin profile photo.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
        </button>
      </div>

      {message && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
          background: message.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.includes('success') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: message.includes('success') ? 'var(--success)' : 'var(--error)',
          marginBottom: '1.5rem', marginTop: '1rem'
        }}>
          {message.includes('success') && <FaCheckCircle />}
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* Site Logo */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FaImage />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Site Logo</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Displayed in the navbar & header</p>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            width: '100%', height: '160px', borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--surface-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: '1.25rem', overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)', position: 'relative'
          }}>
            {branding.siteLogo ? (
              <>
                <Image
                  src={branding.siteLogo}
                  alt="Site Logo Preview"
                  fill
                  style={{ objectFit: 'contain', padding: '1rem' }}
                  unoptimized
                />
                <button
                  onClick={() => setBranding(prev => ({ ...prev, siteLogo: null }))}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                >
                  <FaTrash size={11} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.4 }}>
                <FaImage style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>No logo uploaded</p>
              </div>
            )}
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <FaUpload /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
          </button>
          <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', textAlign: 'center' }}>PNG, JPG, SVG recommended. Max 2MB.</p>
        </div>

        {/* Admin Photo */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <FaUserCircle />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Admin Photo</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Shown in the sidebar footer</p>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            width: '100%', height: '160px', borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--surface-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: '1.25rem', overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)', position: 'relative'
          }}>
            {branding.adminPhoto ? (
              <>
                <Image
                  src={branding.adminPhoto}
                  alt="Admin Photo Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
                <button
                  onClick={() => setBranding(prev => ({ ...prev, adminPhoto: null }))}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                >
                  <FaTrash size={11} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.4 }}>
                <FaUserCircle style={{ fontSize: '3rem', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>No photo uploaded</p>
              </div>
            )}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <FaUpload /> {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </button>
          <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', textAlign: 'center' }}>Square image recommended. Max 2MB.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>💡 Tips</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.25rem', opacity: 0.7, fontSize: '0.875rem' }}>
          <li>Upload images first, then click <strong>Save Changes</strong> to persist them.</li>
          <li>Site Logo appears in the public navbar — use a transparent PNG for best results.</li>
          <li>Admin Photo is used in the admin dashboard sidebar.</li>
          <li>Click the <strong>red × button</strong> on a preview to remove an image before saving.</li>
        </ul>
      </div>
    </div>
  );
}
