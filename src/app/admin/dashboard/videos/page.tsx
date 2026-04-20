"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaYoutube } from 'react-icons/fa';

interface Subject {
  id: string;
  name: string;
}

interface Video {
  id: string;
  title: string;
  youtubeLink: string;
  category: string;
  subjectId?: string | null;
  subject?: Subject | null;
  pdfUrl?: string | null;
  createdAt: string;
}

const CATEGORIES = ['General', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'CUET', 'JEE', 'NEET'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [category, setCategory] = useState('General');
  const [subjectId, setSubjectId] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const fetchVideos = async () => {
    const res = await fetch('/api/admin/videos');
    if (res.ok) {
      const data = await res.json();
      setVideos(data);
    }
  };

  const fetchSubjects = async () => {
    const res = await fetch('/api/admin/subjects');
    if (res.ok) {
      const data = await res.json();
      setSubjects(data);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchSubjects();
  }, []);

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeLink.trim()) return;
    
    const videoId = getYoutubeId(youtubeLink);
    if (!videoId) {
      setMessage('Invalid YouTube URL. Please use a valid link.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    let finalPdfUrl = pdfUrl;
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'videos');
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
        finalPdfUrl = uploadData.url;
      } catch (err: any) {
        setMessage(err.message);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          youtubeLink: youtubeLink.trim(), 
          category, 
          subjectId: subjectId || null,
          pdfUrl: finalPdfUrl 
        }),
      });
      if (res.ok) {
        setTitle('');
        setYoutubeLink('');
        setCategory('General');
        setSubjectId('');
        setPdfUrl('');
        setFile(null);
        setMessage('Video added successfully!');
        fetchVideos();
      } else {
        const d = await res.json();
        setMessage(d.error || 'Failed to add video.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
    fetchVideos();
  };

  const filteredVideos = filterCat === 'All' ? videos : videos.filter(v => v.category === filterCat);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Manage Videos</h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Add YouTube video links by category and subject.</p>

      {/* Add Video Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Add New Video</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Video Title</label>
              <input
                type="text"
                placeholder="e.g. Introduction to Algebra"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Subject</label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none' }}
                >
                  <option value="">No Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>YouTube URL</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={e => setYoutubeLink(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none', marginBottom: '1rem' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Google Drive / PDF Link (Optional)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={pdfUrl}
                onChange={e => setPdfUrl(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Upload PDF File (Optional)</label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={e => setFile(e.target.files?.[0] || null)} 
                style={{ width: '100%', padding: '0.45rem 1rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none' }} 
              />
            </div>
          </div>

          {message && (
            <p style={{ color: message.includes('success') ? 'var(--success)' : 'var(--error)', fontSize: '0.875rem' }}>
              {message}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--surface-border)',
              background: filterCat === cat ? 'var(--primary)' : 'transparent',
              color: filterCat === cat ? 'white' : 'var(--foreground)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              transition: 'var(--transition)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          <FaYoutube style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ff0000' }} />
          <p>No videos found. Add one above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredVideos.map(video => {
            const videoId = getYoutubeId(video.youtubeLink);
            return (
              <div key={video.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                {videoId && (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.95rem' }}>{video.title}</h3>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>{video.category}</span>
                        {video.subject && (
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{video.subject.name}</span>
                        )}
                        {video.pdfUrl && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--surface-highlight)', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>Notes</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(video.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
                      title="Delete video"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
