"use client";

import { useState, useEffect, useCallback } from 'react';
import { FaYoutube } from 'react-icons/fa';

interface Video {
  id: string;
  title: string;
  youtubeLink: string;
  category: string;
  pdfUrl?: string | null;
}

const CATEGORIES = ['General', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'CUET', 'JEE', 'NEET'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    const res = await fetch(`/api/videos?${params.toString()}`);
    if (res.ok) setVideos(await res.json());
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Video <span className="text-gradient">Lectures</span>
        </h1>
        <p style={{ opacity: 0.7 }}>Curated YouTube video lectures by class and subject. Watch free anytime.</p>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={() => setSelectedCategory('')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: !selectedCategory ? 'var(--primary)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedCategory === cat ? 'var(--primary)' : 'transparent', color: selectedCategory === cat ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
          >
            {cat}
          </button>
        ))}
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
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>{video.category}</span>
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
                          View Notes
                        </a>
                        <a 
                          href={video.pdfUrl} 
                          download
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '0.8rem', color: '#fff', background: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', transition: 'var(--transition)' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          Download
                        </a>
                      </div>
                    )}
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
