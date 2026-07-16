"use client";

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Video as VideoIcon, 
  FileText, 
  BookOpen, 
  Play, 
  X, 
  Bookmark, 
  AlertCircle, 
  Eye,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import InteractionButtons from '@/components/InteractionButtons';
import { logger } from '@/lib/logger';
import styles from './page.module.css';

// ─── VideoThumbnail Component ─────────────────────────────────────────────────
const VideoThumbnail = ({ src, alt }: { src: string | null; alt: string }) => {
  const [isError, setIsError] = useState(false);
  if (isError || !src) {
    return (
      <div className={styles.videoThumbFallback}>
        <Play size={20} fill="white" color="white" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={styles.videoThumbImg}
      onError={() => setIsError(true)}
    />
  );
};

export default function FavoritesPage() {
  const [data, setData] = useState<{ videos: any[], notes: any[], papers: any[], quizzes: any[] }>({ 
    videos: [], 
    notes: [], 
    papers: [],
    quizzes: []
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'notes' | 'papers' | 'quizzes'>('all');
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedFavs = sessionStorage.getItem('bb_favorites');
        if (cachedFavs) {
          setData(JSON.parse(cachedFavs));
          setIsAuthenticated(true);
          setLoading(false);
        }

        const res = await fetch('/api/interactions/favorites');
        if (res.ok) {
          const fetchedData = await res.json();
          setData({
            videos: fetchedData.videos || [],
            notes: fetchedData.notes || [],
            papers: fetchedData.papers || [],
            quizzes: fetchedData.quizzes || []
          });
          setIsAuthenticated(true);
          sessionStorage.setItem('bb_favorites', JSON.stringify(fetchedData));
        } else if (res.status === 401 && !cachedFavs) {
          window.location.href = '/login';
        }
      } catch (error) {
        logger.error('Failed to fetch favorites:', error);
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
    return (
      <div className={styles.favoritesShell}>
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>
          Loading your favorites...
        </div>
      </div>
    );
  }

  // Filter dynamic counts
  const videosCount = data.videos?.length || 0;
  const notesCount = data.notes?.length || 0;
  const papersCount = data.papers?.length || 0;
  const quizzesCount = data.quizzes?.length || 0;

  const hasAnyFavorites = videosCount > 0 || notesCount > 0 || papersCount > 0 || quizzesCount > 0;

  const tabsList = [
    { id: 'all' as const, label: 'All', icon: <Bookmark size={14} /> },
    { id: 'videos' as const, label: `Videos (${videosCount})`, icon: <VideoIcon size={14} /> },
    { id: 'notes' as const, label: `Notes (${notesCount})`, icon: <FileText size={14} /> },
    { id: 'papers' as const, label: `Papers (${papersCount})`, icon: <BookOpen size={14} /> },
    { id: 'quizzes' as const, label: `Quizzes (${quizzesCount})`, icon: <Trophy size={14} /> },
  ];

  // Helper to determine if a section should render based on activeTab
  const shouldRender = (tabId: 'videos' | 'notes' | 'papers' | 'quizzes') => {
    if (activeTab === 'all') return (data[tabId]?.length || 0) > 0;
    return activeTab === tabId && (data[tabId]?.length || 0) > 0;
  };

  const isTabEmpty = (tabId: 'all' | 'videos' | 'notes' | 'papers' | 'quizzes') => {
    if (tabId === 'all') return !hasAnyFavorites;
    return (data[tabId]?.length || 0) === 0;
  };

  return (
    <div className={styles.favoritesShell}>
      
      {/* ── COMPACT HEADER ── */}
      <div className={styles.classHeader}>
        <div className={styles.classHeaderInner}>
          <div className={styles.classHeaderLeft}>
            <Link href="/" className={styles.classBackBtn} title="Back to home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <span className={styles.classHeaderTitle}>My Favorites</span>
          </div>
          <nav className={styles.classHeaderTabs}>
            {tabsList.map(tab => (
              <button
                key={tab.id}
                className={`${styles.classTabBtn} ${activeTab === tab.id ? styles.classTabBtnActive : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.appMain}>
        <div className={styles.tabContent}>

          {isTabEmpty(activeTab) ? (
            <div className={styles.emptyState}>
              <Bookmark className={styles.emptyIcon} />
              <h4>No favorites found</h4>
              <p>
                {activeTab === 'all' 
                  ? "You haven't bookmarked any study materials yet. Explore our classes to get started." 
                  : `You haven't bookmarked any ${activeTab} yet. Explore classes to save materials.`}
              </p>
              <div className={styles.emptyActions}>
                <Link href="/videos" className={`btn-secondary ${styles.emptyBtn}`}>Browse Videos</Link>
                <Link href="/notes" className={`btn-secondary ${styles.emptyBtn}`}>Browse Notes</Link>
                <Link href="/papers" className={`btn-secondary ${styles.emptyBtn}`}>Browse Papers</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Videos Section */}
              {shouldRender('videos') && (
                <section>
                  <div className={styles.sectionHeader}>
                    <h3><VideoIcon size={18} style={{ color: '#ff0000' }} /> Videos</h3>
                  </div>
                  <div className={styles.gridContent}>
                    {data.videos.map(video => {
                      const ytId = getYoutubeId(video.youtubeLink);
                      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                      return (
                        <div 
                          key={video.id} 
                          className={styles.videoCard}
                          onClick={() => setSelectedVideo(video)}
                        >
                          <div className={styles.videoThumb}>
                            <VideoThumbnail src={thumb} alt={video.title} />
                            <div className={styles.videoPlayOverlay}>
                              <Play size={16} fill="white" color="white" />
                            </div>
                          </div>
                          <div className={styles.videoInfo}>
                            <div className={styles.videoMeta}>
                              <span className={styles.videoTag}>Lecture Video</span>
                            </div>
                            <h4 className={styles.videoTitle}>{video.title}</h4>
                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Notes Section */}
              {shouldRender('notes') && (
                <section>
                  <div className={styles.sectionHeader}>
                    <h3><FileText size={18} style={{ color: '#0d9488' }} /> Study Notes</h3>
                  </div>
                  <div className={styles.listContent}>
                    {data.notes.map(note => (
                      <div key={note.id} className={styles.docCard}>
                        <div className={styles.docIcon} style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488' }}>
                          <FileText size={18} />
                        </div>
                        <div className={styles.docInfo}>
                          <h4 className={styles.docTitle}>{note.title}</h4>
                          <div className={styles.docMeta}>
                            <span className={styles.metaClass}>Class {note.className}</span>
                            <span className={styles.metaSubject}>{note.subject?.name || "Subject"}</span>
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
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
                        <a 
                          href={note.viewUrl || note.downloadFile} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`btn-secondary ${styles.viewBtn}`}
                        >
                          <Eye size={14} /> View
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Papers Section */}
              {shouldRender('papers') && (
                <section>
                  <div className={styles.sectionHeader}>
                    <h3><BookOpen size={18} style={{ color: 'var(--primary)' }} /> Question Papers</h3>
                  </div>
                  <div className={styles.listContent}>
                    {data.papers.map(paper => (
                      <div key={paper.id} className={styles.docCard}>
                        <div className={styles.docIcon} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>
                          <BookOpen size={18} />
                        </div>
                        <div className={styles.docInfo}>
                          <h4 className={styles.docTitle}>{paper.title}</h4>
                          <div className={styles.docMeta}>
                            <span className={styles.metaClass}>Class {paper.className}</span>
                            <span className={styles.metaSubject}>{paper.subject?.name || "Subject"}</span>
                            {paper.year?.year && (
                              <span className={styles.metaYear}>{paper.year.year}</span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
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
                        <a 
                          href={paper.viewUrl || paper.downloadFile} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`btn-secondary ${styles.viewBtn}`}
                        >
                          <Eye size={14} /> View
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Quizzes Section */}
              {shouldRender('quizzes') && (
                <section>
                  <div className={styles.sectionHeader}>
                    <h3><Trophy size={18} style={{ color: '#f59e0b' }} /> Quizzes</h3>
                  </div>
                  <div className={styles.listContent}>
                    {data.quizzes.map(quiz => (
                      <div key={quiz.id} className={styles.docCard}>
                        <div className={styles.docIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                          <Trophy size={18} />
                        </div>
                        <div className={styles.docInfo}>
                          <h4 className={styles.docTitle}>{quiz.title}</h4>
                          <div className={styles.docMeta}>
                            <span className={styles.metaClass}>Class {quiz.className}</span>
                            {quiz.subject?.name && (
                              <span className={styles.metaSubject}>{quiz.subject.name}</span>
                            )}
                            <span className={styles.metaYear}>{quiz.questions?.length || 0} Questions</span>
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
                            <InteractionButtons 
                              targetId={quiz.id}
                              targetType="QUIZ"
                              initialLikes={0}
                              initialShares={0}
                              initialFavorites={1}
                              isLiked={false}
                              isFavorited={true}
                              isAuthenticated={isAuthenticated}
                            />
                          </div>
                        </div>
                        <Link 
                          href={`/class/${encodeURIComponent(quiz.className)}`}
                          className={`btn-secondary ${styles.viewBtn}`}
                        >
                          <Play size={12} fill="currentColor" /> Start
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ─── MODAL: VIDEO PLAYER ─── */}
      {selectedVideo && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedVideo(null)}>
          <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>Now Playing</span>
                <h3 className={styles.modalTitle}>{selectedVideo.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedVideo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.videoEmbed}>
              {getYoutubeId(selectedVideo.youtubeLink) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.youtubeLink)}?autoplay=1&rel=0&modestbranding=1`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className={styles.videoEmbedError}>
                  <AlertCircle size={32} opacity={0.5} />
                  <p>Video link is invalid or missing.</p>
                  <a href={selectedVideo.youtubeLink} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    Open in YouTube
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
