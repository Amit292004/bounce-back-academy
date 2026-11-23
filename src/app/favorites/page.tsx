"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  FileText, 
  BookOpen, 
  Trophy, 
  Search, 
  X, 
  Eye, 
  Download, 
  Bookmark,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import InteractionButtons from '@/components/InteractionButtons';
import PWVideoPlayer from '@/components/video/PWVideoPlayer';
import { getViewLink, getDownloadLink } from '@/lib/utils';
import { logger } from '@/lib/logger';
import styles from './page.module.css';

function getSubjectColor(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('math'))    return { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' };
  if (n.includes('science')) return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  if (n.includes('english')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (n.includes('social'))  return { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' };
  if (n.includes('hindi'))   return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  if (n.includes('physics')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' };
  if (n.includes('chem'))    return { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
  if (n.includes('bio'))     return { color: '#84cc16', bg: 'rgba(132,204,22,0.1)' };
  return { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' };
}

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
  const [search, setSearch] = useState('');
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
          setIsAuthenticated(false);
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
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  const videosCount = data.videos?.length || 0;
  const notesCount = data.notes?.length || 0;
  const papersCount = data.papers?.length || 0;
  const quizzesCount = data.quizzes?.length || 0;
  const totalCount = videosCount + notesCount + papersCount + quizzesCount;

  // Filter items by search query
  const q = search.trim().toLowerCase();
  const filterBySearch = (item: any) => {
    if (!q) return true;
    const titleMatch = (item.title || '').toLowerCase().includes(q);
    const subjectMatch = (item.subject?.name || '').toLowerCase().includes(q);
    const classMatch = (item.className || '').toLowerCase().includes(q);
    return titleMatch || subjectMatch || classMatch;
  };

  const filteredVideos = data.videos.filter(filterBySearch);
  const filteredNotes = data.notes.filter(filterBySearch);
  const filteredPapers = data.papers.filter(filterBySearch);
  const filteredQuizzes = data.quizzes.filter(filterBySearch);

  const getDisplayItems = () => {
    const items: Array<{ type: 'VIDEO' | 'NOTE' | 'PAPER' | 'QUIZ'; raw: any }> = [];
    if (activeTab === 'all' || activeTab === 'videos') {
      filteredVideos.forEach(v => items.push({ type: 'VIDEO', raw: v }));
    }
    if (activeTab === 'all' || activeTab === 'notes') {
      filteredNotes.forEach(n => items.push({ type: 'NOTE', raw: n }));
    }
    if (activeTab === 'all' || activeTab === 'papers') {
      filteredPapers.forEach(p => items.push({ type: 'PAPER', raw: p }));
    }
    if (activeTab === 'all' || activeTab === 'quizzes') {
      filteredQuizzes.forEach(qz => items.push({ type: 'QUIZ', raw: qz }));
    }
    return items;
  };

  const displayItems = getDisplayItems();

  if (!loading && !isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            <span>Personal Study Archive</span>
          </div>
          <h1 className={styles.title}>Saved Favourites</h1>
          <p className={styles.subtitle}>
            Your bookmarked question papers, chapter revision notes, video lectures, and practice quizzes.
          </p>
        </div>

        <div className={styles.emptyState}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.85rem' }}>🔖</div>
          <h3 className={styles.emptyStateTitle}>Sign in to view your saved items</h3>
          <p className={styles.emptyStateText}>
            Bookmark and sync questions papers, chapter revision notes, and video lectures to access them anytime here.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Link href="/login?redirect=/favorites" className={styles.btnDownload} style={{ width: 'auto', padding: '0 1.5rem' }}>
              Sign In to View
            </Link>
            <Link href="/library" className={styles.btnView} style={{ width: 'auto', padding: '0 1.25rem' }}>
              Browse Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Personal Study Archive</span>
        </div>
        <h1 className={styles.title}>Saved Favourites</h1>
        <p className={styles.subtitle}>
          Your bookmarked question papers, chapter revision notes, video lectures, and practice quizzes in one unified place.
        </p>
      </div>

      {/* 2. Toolbar (Mode Switcher + Search) */}
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl} role="tablist" aria-label="Favorites category filter">
          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`${styles.segmentedBtn} ${activeTab === 'all' ? styles.segmentedBtnActive : ''}`}
          >
            <Layers size={13} />
            <span>All</span>
            {totalCount > 0 && <span className={styles.tabCount}>{totalCount}</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'videos'}
            onClick={() => setActiveTab('videos')}
            className={`${styles.segmentedBtn} ${activeTab === 'videos' ? styles.segmentedBtnActive : ''}`}
          >
            <Play size={12} fill="currentColor" />
            <span>Videos</span>
            {videosCount > 0 && <span className={styles.tabCount}>{videosCount}</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            className={`${styles.segmentedBtn} ${activeTab === 'notes' ? styles.segmentedBtnActive : ''}`}
          >
            <FileText size={13} />
            <span>Notes</span>
            {notesCount > 0 && <span className={styles.tabCount}>{notesCount}</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'papers'}
            onClick={() => setActiveTab('papers')}
            className={`${styles.segmentedBtn} ${activeTab === 'papers' ? styles.segmentedBtnActive : ''}`}
          >
            <BookOpen size={13} />
            <span>Papers</span>
            {papersCount > 0 && <span className={styles.tabCount}>{papersCount}</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'quizzes'}
            onClick={() => setActiveTab('quizzes')}
            className={`${styles.segmentedBtn} ${activeTab === 'quizzes' ? styles.segmentedBtnActive : ''}`}
          >
            <Trophy size={13} />
            <span>Quizzes</span>
            {quizzesCount > 0 && <span className={styles.tabCount}>{quizzesCount}</span>}
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={14} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search in your saved favorites…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search saved favorites"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Results count */}
      {!loading && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {displayItems.length} saved item{displayItems.length !== 1 ? 's' : ''} available
            {search ? ` matching "${search}"` : ''}
          </span>
        </div>
      )}

      {/* 4. Cards Grid */}
      <div className={styles.favsGrid}>
        {loading ? (
          <div className={styles.emptyState}>
            <p>Loading your saved study materials…</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.85rem' }}>🔖</div>
            <h3 className={styles.emptyStateTitle}>No favorites found</h3>
            <p className={styles.emptyStateText}>
              {search
                ? `No bookmarked items match "${search}". Try a different keyword.`
                : activeTab === 'all'
                ? "You haven't bookmarked any study materials yet. Explore our classes to get started."
                : `You haven't bookmarked any ${activeTab} yet. Explore classes to save materials.`}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/notes" className={styles.btnView} style={{ width: 'auto', padding: '0 1rem' }}>
                Browse Notes
              </Link>
              <Link href="/papers" className={styles.btnView} style={{ width: 'auto', padding: '0 1rem' }}>
                Browse Papers
              </Link>
              <Link href="/videos" className={styles.btnView} style={{ width: 'auto', padding: '0 1rem' }}>
                Browse Videos
              </Link>
              <Link href="/quiz" className={styles.btnView} style={{ width: 'auto', padding: '0 1rem' }}>
                Practice Quizzes
              </Link>
            </div>
          </div>
        ) : (
          displayItems.map(({ type, raw }) => {
            const subjectName = raw.subject?.name || (type === 'VIDEO' ? 'Lecture' : 'General');
            const { color, bg } = getSubjectColor(subjectName);
            const displayClass = raw.className
              ? raw.className.toLowerCase().includes('class') || ['cuet', 'jee', 'neet'].includes(raw.className.toLowerCase())
                ? raw.className
                : `Class ${raw.className}`
              : 'Class 10';

            if (type === 'VIDEO') {
              return (
                <div key={`video-${raw.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.cardIconBox}
                      style={{
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                    </div>
                    <div className={styles.cardBadges}>
                      <span className={styles.cardTypeBadge} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)' }}>
                        Video
                      </span>
                      <span className={styles.cardBadge}>{displayClass}</span>
                      <span className={styles.cardBadge} style={{ color }}>{subjectName}</span>
                    </div>
                  </div>

                  <h3 className={styles.cardTitle} title={raw.title}>
                    {raw.title}
                  </h3>
                  <p className={styles.cardMeta}>
                    Interactive Video Lesson • PW Theater Player
                  </p>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardFooter}>
                    <div className={styles.cardInteractions}>
                      <InteractionButtons
                        targetId={raw.id}
                        targetType="VIDEO"
                        initialLikes={raw.likesCount || 0}
                        initialShares={raw.sharesCount || 0}
                        initialFavorites={raw.favoritesCount || 1}
                        isLiked={raw.isLiked}
                        isFavorited={raw.isFavorited ?? true}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => setSelectedVideo(raw)}
                        className={styles.btnDownload}
                        style={{ flex: 1 }}
                        aria-label={`Watch ${raw.title}`}
                      >
                        <Play size={11} fill="currentColor" /> Watch Video
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === 'NOTE') {
              const viewUrl = getViewLink(raw.viewUrl || raw.downloadFile);
              return (
                <div key={`note-${raw.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.cardIconBox}
                      style={{
                        color: '#0d9488',
                        background: 'rgba(13, 148, 136, 0.1)',
                        borderColor: 'rgba(13, 148, 136, 0.25)',
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div className={styles.cardBadges}>
                      <span className={styles.cardTypeBadge} style={{ color: '#0d9488', borderColor: 'rgba(13, 148, 136, 0.25)', background: 'rgba(13, 148, 136, 0.08)' }}>
                        Note
                      </span>
                      <span className={styles.cardBadge}>{displayClass}</span>
                      <span className={styles.cardBadge} style={{ color }}>{subjectName}</span>
                    </div>
                  </div>

                  <h3 className={styles.cardTitle} title={raw.title}>
                    {raw.title}
                  </h3>
                  <p className={styles.cardMeta}>
                    Official Chapter Revision Note • NBSE Curriculum
                  </p>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardFooter}>
                    <div className={styles.cardInteractions}>
                      <InteractionButtons
                        targetId={raw.id}
                        targetType="NOTE"
                        initialLikes={raw.likesCount || 0}
                        initialShares={raw.sharesCount || 0}
                        initialFavorites={raw.favoritesCount || 1}
                        isLiked={raw.isLiked}
                        isFavorited={raw.isFavorited ?? true}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                    <div className={styles.cardActions}>
                      <a
                        href={viewUrl || raw.downloadFile}
                        className={styles.btnView}
                        aria-label={`View ${raw.title}`}
                      >
                        <Eye size={13} /> View
                      </a>
                      <a
                        href={raw.downloadFile || viewUrl}
                        className={styles.btnDownload}
                        aria-label={`Download ${raw.title}`}
                      >
                        <Download size={11} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === 'PAPER') {
              const viewUrl = getViewLink(raw.viewUrl || raw.downloadFile);
              return (
                <div key={`paper-${raw.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.cardIconBox}
                      style={{
                        color,
                        background: bg,
                        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                      }}
                    >
                      <BookOpen size={16} />
                    </div>
                    <div className={styles.cardBadges}>
                      <span className={styles.cardTypeBadge}>Paper</span>
                      <span className={styles.cardBadge}>{displayClass}</span>
                      <span className={styles.cardBadge} style={{ color }}>{subjectName}</span>
                    </div>
                    {raw.year?.year && (
                      <div className={styles.cardYearBadge}>{raw.year.year}</div>
                    )}
                  </div>

                  <h3 className={styles.cardTitle} title={raw.title}>
                    {raw.title}
                  </h3>
                  <p className={styles.cardMeta}>
                    Official NBSE Board Archive • Past Exam Paper
                  </p>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardFooter}>
                    <div className={styles.cardInteractions}>
                      <InteractionButtons
                        targetId={raw.id}
                        targetType="PAPER"
                        initialLikes={raw.likesCount || 0}
                        initialShares={raw.sharesCount || 0}
                        initialFavorites={raw.favoritesCount || 1}
                        isLiked={raw.isLiked}
                        isFavorited={raw.isFavorited ?? true}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                    <div className={styles.cardActions}>
                      <a
                        href={viewUrl || raw.downloadFile}
                        className={styles.btnView}
                        aria-label={`View ${raw.title}`}
                      >
                        <Eye size={13} /> View
                      </a>
                      <a
                        href={raw.downloadFile || viewUrl}
                        className={styles.btnDownload}
                        aria-label={`Download ${raw.title}`}
                      >
                        <Download size={11} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === 'QUIZ') {
              return (
                <div key={`quiz-${raw.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.cardIconBox}
                      style={{
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderColor: 'rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      <Trophy size={16} />
                    </div>
                    <div className={styles.cardBadges}>
                      <span className={styles.cardTypeBadge} style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.08)' }}>
                        Quiz
                      </span>
                      <span className={styles.cardBadge}>{displayClass}</span>
                      <span className={styles.cardBadge} style={{ color }}>{subjectName}</span>
                    </div>
                    <div className={styles.cardYearBadge}>
                      {raw.questions?.length || 0} Qs
                    </div>
                  </div>

                  <h3 className={styles.cardTitle} title={raw.title}>
                    {raw.title}
                  </h3>
                  <p className={styles.cardMeta}>
                    Official Interactive Challenge • Instant Scoring
                  </p>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardFooter}>
                    <div className={styles.cardInteractions}>
                      <InteractionButtons
                        targetId={raw.id}
                        targetType="QUIZ"
                        initialLikes={0}
                        initialShares={0}
                        initialFavorites={1}
                        isLiked={false}
                        isFavorited={true}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                    <div className={styles.cardActions}>
                      <Link
                        href="/quiz"
                        className={styles.btnView}
                        aria-label={`View ${raw.title}`}
                      >
                        <Eye size={13} /> View
                      </Link>
                      <Link
                        href="/quiz"
                        className={styles.btnDownload}
                        aria-label={`Start ${raw.title}`}
                      >
                        <Play size={10} fill="currentColor" /> Start Quiz
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* 5. Video Player Modal */}
      {selectedVideo && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedVideo(null)}>
          <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>Now Playing</span>
                <h3 className={styles.modalTitle}>{selectedVideo.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedVideo(null)} aria-label="Close video player">
                <X size={18} />
              </button>
            </div>

            <div className={styles.videoEmbed}>
              {getYoutubeId(selectedVideo.youtubeLink) ? (
                <PWVideoPlayer
                  youtubeUrl={selectedVideo.youtubeLink}
                  title={selectedVideo.title}
                  subtitle="Saved Favorite Lecture"
                  autoPlay={true}
                  onBack={() => setSelectedVideo(null)}
                />
              ) : (
                <div className={styles.videoEmbedError}>
                  <AlertCircle size={32} opacity={0.5} />
                  <p>Video link is invalid or missing.</p>
                  <a href={selectedVideo.youtubeLink} target="_blank" rel="noreferrer" className={styles.btnView} style={{ padding: '0.5rem 1rem' }}>
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
