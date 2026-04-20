"use client";

import { useState, useEffect } from 'react';
import { FaHeart, FaBookmark, FaYoutube, FaBook, FaFileAlt, FaEye, FaDownload } from 'react-icons/fa';
import Link from 'next/link';
import InteractionButtons from '@/components/InteractionButtons';

export default function FavoritesPage() {
  const [data, setData] = useState<{ videos: any[], notes: any[], papers: any[] }>({ videos: [], notes: [], papers: [] });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/interactions/favorites');
        if (res.ok) {
          setData(await res.json());
          setIsAuthenticated(true);
        } else if (res.status === 401) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading your favorites...</div>;
  }

  const hasAnyFavorites = data.videos.length > 0 || data.notes.length > 0 || data.papers.length > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          My <span className="text-gradient">Favorites</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>All your saved study materials in one place.</p>
      </div>

      {!hasAnyFavorites ? (
        <div className="glass-panel" style={{ padding: 'clamp(2rem, 10vw, 4rem) 1rem', textAlign: 'center', opacity: 0.6 }}>
          <FaBookmark style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>You haven't added any favorites yet.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/videos" className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Videos</Link>
            <Link href="/notes" className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Notes</Link>
            <Link href="/papers" className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Papers</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          {/* Videos Section */}
          {data.videos.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaYoutube style={{ color: '#ff0000' }} /> Videos
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {data.videos.map(video => {
                  const videoId = getYoutubeId(video.youtubeLink);
                  return (
                    <div key={video.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                      {videoId ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                          <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={video.title}
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div style={{ height: '180px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaYoutube style={{ fontSize: '3rem', color: '#ff0000' }} />
                        </div>
                      )}
                      <div style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{video.title}</h3>
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
            </section>
          )}

          {/* Notes Section */}
          {data.notes.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaBook style={{ color: 'var(--accent)' }} /> Study Notes
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.notes.map(note => (
                  <div key={note.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                        <FaBook />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{note.title}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>Class {note.className}</span>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{note.subject.name}</span>
                        </div>
                        <InteractionButtons 
                          targetId={note.id}
                          targetType="NOTE"
                          initialLikes={note.likesCount}
                          initialShares={note.sharesCount}
                          initialFavorites={note.favoritesCount}
                          isLiked={note.isLiked}
                          isFavorited={note.isFavorited}
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <a href={note.viewUrl || note.downloadFile} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaEye /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Papers Section */}
          {data.papers.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaFileAlt style={{ color: 'var(--primary)' }} /> Question Papers
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.papers.map(paper => (
                  <div key={paper.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <FaFileAlt />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{paper.title}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>Class {paper.className}</span>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{paper.subject.name}</span>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', opacity: 0.8 }}>{paper.year.year}</span>
                        </div>
                        <InteractionButtons 
                          targetId={paper.id}
                          targetType="PAPER"
                          initialLikes={paper.likesCount}
                          initialShares={paper.sharesCount}
                          initialFavorites={paper.favoritesCount}
                          isLiked={paper.isLiked}
                          isFavorited={paper.isFavorited}
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <a href={paper.viewUrl || paper.downloadFile} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaEye /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
