"use client";

import { useState, useEffect, useCallback } from 'react';
import { FaYoutube, FaFilter } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';

interface Video {
  id: string;
  title: string;
  youtubeLink: string;
  category: string;
  pdfUrl?: string | null;
  subject?: { id: string; name: string } | null;
  likesCount: number;
  sharesCount: number;
  favoritesCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface Subject { id: string; name: string; }

const CATEGORIES = ['General', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'CUET', 'JEE', 'NEET'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/student/me');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const res = await fetch('/api/admin/subjects');
      if (res.ok) setSubjects(await res.json());
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubject) params.set('subject', selectedSubject);
    const res = await fetch(`/api/videos?${params.toString()}`);
    if (res.ok) setVideos(await res.json());
    setLoading(false);
  }, [selectedCategory, selectedSubject]);

  useEffect(() => { fetchMeta(); fetchAuth(); }, []);
  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Video <span className="text-gradient">Lectures</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>Curated YouTube video lectures by class and subject. Watch free anytime.</p>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setSelectedCategory(''); setSelectedSubject(''); }}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: !selectedCategory ? 'var(--primary)' : 'transparent', color: !selectedCategory ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat === selectedCategory ? '' : cat); setSelectedSubject(''); }}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedCategory === cat ? 'var(--primary)' : 'transparent', color: selectedCategory === cat ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subject Filter */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}><FaFilter /><span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subject:</span></div>
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none', flex: 1, minWidth: '140px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(selectedCategory || selectedSubject) && (
          <button onClick={() => { setSelectedCategory(''); setSelectedSubject(''); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem' }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaYoutube style={{ fontSize: '4rem', marginBottom: '1rem', color: '#ff0000' }} />
          <p>No videos available yet. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {videos.map(video => {
            const videoId = getYoutubeId(video.youtubeLink);
            return (
              <div key={video.id} className="glass-panel" style={{ overflow: 'hidden', transition: 'var(--transition)' }}>
                {videoId ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ height: '180px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaYoutube style={{ fontSize: '3rem', color: '#ff0000' }} />
                  </div>
                )}
                <div style={{ padding: '1rem 1.25rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem', lineHeight: 1.4 }}>{video.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>{video.category}</span>
                      {video.subject && (
                        <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{video.subject.name}</span>
                      )}
                    </div>
                    {video.pdfUrl && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a 
                          href={video.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', transition: 'var(--transition)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Notes
                        </a>
                      </div>
                    )}
                  </div>
                  <InteractionButtons 
                    targetId={video.id}
                    targetType="VIDEO"
                    initialLikes={video.likesCount}
                    initialShares={video.sharesCount}
                    initialFavorites={video.favoritesCount}
                    isLiked={video.isLiked}
                    isFavorited={video.isFavorited}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
