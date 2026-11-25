"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaYoutube, FaTimes } from 'react-icons/fa';
import { Play, X, Layers, FileText } from 'lucide-react';
import PWVideoPlayer from '@/components/video/PWVideoPlayer';
import InteractionButtons from '@/components/InteractionButtons';
import styles from './page.module.css';
import { logger } from '@/lib/logger';

interface Video {
  id: string;
  title: string;
  youtubeLink: string;
  category: string;
  pdfUrl?: string | null;
  subject?: { id: string; name: string } | null;
  chapter?: { id: string; name: string; number: number } | null;
  lectureNumber: number;
  likesCount: number;
  sharesCount: number;
  favoritesCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface Subject { id: string; name: string; }
interface Course { id: string; name: string; }
interface Chapter { id: string; name: string; number: number; className: string; subjectId: string; }

function VideosContent({ initialVideos = [] }: { initialVideos?: Video[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(initialVideos.length === 0);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedChapter, setSelectedChapter] = useState(searchParams.get('chapter') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(initialVideos.length > 0);
  const [activePlayerVideo, setActivePlayerVideo] = useState<Video | null>(null);

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const fetchMeta = async () => {
    try {
      const cachedSub = sessionStorage.getItem('bb_subjects');
      const cachedChap = sessionStorage.getItem('bb_chapters');
      const cachedCourses = sessionStorage.getItem('bb_courses');
      if (cachedSub) setSubjects(JSON.parse(cachedSub));
      if (cachedChap) setChapters(JSON.parse(cachedChap));
      if (cachedCourses) setCourses(JSON.parse(cachedCourses));

      const [subRes, chapRes, coursesRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/chapters'),
        fetch('/api/admin/courses')
      ]);
      if (subRes.ok) {
        const d = await subRes.json();
        setSubjects(d);
        sessionStorage.setItem('bb_subjects', JSON.stringify(d));
      }
      if (chapRes.ok) {
        const d = await chapRes.json();
        setChapters(d);
        sessionStorage.setItem('bb_chapters', JSON.stringify(d));
      }
      if (coursesRes.ok) {
        const d = await coursesRes.json();
        setCourses(d);
        sessionStorage.setItem('bb_courses', JSON.stringify(d));
      }
    } catch (error) {
      logger.error('Failed to fetch metadata:', error);
    }
  };

  // On mount: fetch auth first, set default class, THEN allow video fetch
  useEffect(() => {
    fetchMeta();
    (async () => {
      try {
        const cachedMe = sessionStorage.getItem('bb_student_me');
        if (cachedMe) {
          const data = JSON.parse(cachedMe);
          setIsAuthenticated(data.authenticated);
          if (data.authenticated && data.class && !searchParams.get('class') && !selectedCategory) {
            setSelectedCategory(data.class);
          }
          setAuthReady(true);
        }

        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('bb_student_me', JSON.stringify(data));
          if (!cachedMe) {
            setIsAuthenticated(data.authenticated);
            if (data.authenticated && data.class && !searchParams.get('class') && !selectedCategory) {
              setSelectedCategory(data.class);
            }
            setAuthReady(true);
          }
        } else if (!cachedMe) {
          setIsAuthenticated(false);
          setAuthReady(true);
        }
      } catch {
        if (!sessionStorage.getItem('bb_student_me')) {
          setIsAuthenticated(false);
          setAuthReady(true);
        }
      }
    })();
  }, []);

  const fetchVideos = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedChapter) params.set('chapter', selectedChapter);
    const url = `/api/videos?${params.toString()}`;

    const cached = sessionStorage.getItem(`bb_vid_${url}`);
    if (cached) {
      setVideos(JSON.parse(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setVideos(data);
      sessionStorage.setItem(`bb_vid_${url}`, JSON.stringify(data));
    }
    setLoading(false);
  }, [selectedCategory, selectedSubject, selectedChapter]);

  // Only fetch videos after auth check is done (so class filter is applied from the start)
  useEffect(() => {
    if (authReady) fetchVideos();
  }, [authReady, fetchVideos]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePlayerVideo) {
        setActivePlayerVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePlayerVideo]);

  const currentClassName = selectedCategory;
  const filteredChapters = chapters.filter(ch =>
    (currentClassName && currentClassName !== 'General' ? ch.className === currentClassName : true) &&
    (selectedSubject ? ch.subjectId === selectedSubject : true)
  );

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  };

  const hasFilters = !!(selectedCategory || selectedSubject || selectedChapter);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Video Lectures</span>
        </div>
        <h1 className={styles.title}>Video Lessons</h1>
        <p className={styles.subtitle}>
          Curated video lessons and lectures by class and subject. Watch free anytime in the theater player.
        </p>
      </div>

      {/* ── SaaS Filter Bar ── */}
      <div className={styles.filterBarWrapper}>
        <div className={styles.filterBar}>

          {/* Filter icon */}
          <div className={styles.filterBarIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </div>

          {/* Class */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Class</span>
            <select
              value={selectedCategory}
              onChange={e => {
                const val = e.target.value;
                setSelectedCategory(val);
                setSelectedSubject('');
                setSelectedChapter('');
                updateURL({ class: val, subject: '', chapter: '' });
              }}
              className={styles.filterBarSelect}
            >
              <option value="">All Classes</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Subject</span>
            <select
              value={selectedSubject}
              onChange={e => {
                const val = e.target.value;
                setSelectedSubject(val);
                setSelectedChapter('');
                updateURL({ subject: val, chapter: '' });
              }}
              className={styles.filterBarSelect}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Chapter */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Chapter</span>
            <select
              value={selectedChapter}
              onChange={e => { setSelectedChapter(e.target.value); updateURL({ chapter: e.target.value }); }}
              className={styles.filterBarSelect}
              disabled={!selectedSubject && !selectedCategory}
            >
              <option value="">All Chapters</option>
              {filteredChapters.map(ch => (
                <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.name}</option>
              ))}
            </select>
          </div>

          {/* Clear — only when filters active */}
          {hasFilters && (
            <button
              className={styles.clearSegment}
              onClick={() => { setSelectedCategory(''); setSelectedSubject(''); setSelectedChapter(''); updateURL({ class: '', subject: '', chapter: '' }); }}
            >
              <FaTimes size={10} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count bar */}
      {!loading && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {videos.length} video{videos.length !== 1 ? 's' : ''} available
          </span>
        </div>
      )}

      {loading ? (
        <div className={styles.videosGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.videoCard}>
              <div className="skeleton" style={{ width: '100%', paddingBottom: '56.25%' }} />
              <div style={{ padding: '1rem' }}>
                <div className="skeleton skeleton-text" style={{ width: '80%', height: '1.2rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: '1rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '4rem', textAlign: 'center', color: 'var(--secondary)' }}>
          <FaYoutube style={{ fontSize: '4rem', marginBottom: '1rem', color: '#ef4444' }} />
          <p>No videos available yet. Check back soon!</p>
        </div>
      ) : (
        <div className={styles.videosGrid}>
          {videos.map((video) => {
            const videoId = getYoutubeId(video.youtubeLink);
            const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <div
                key={video.id}
                className={styles.videoCard}
              >
                {/* Interactive High-Def Thumbnail with PW Video Player Launcher */}
                <div 
                  className={styles.thumbnailContainer}
                  onClick={() => setActivePlayerVideo(video)}
                  title={`Play "${video.title}" in Theater Player`}
                >
                  {thumbUrl ? (
                    <img 
                      src={thumbUrl} 
                      alt={video.title} 
                      className={styles.thumbnailImg} 
                      loading="lazy" 
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaYoutube style={{ fontSize: '3rem', color: '#ef4444' }} />
                    </div>
                  )}

                  <div className={styles.thumbnailOverlay}>
                    <div className={styles.playGlowBtn}>
                      <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
                    </div>
                  </div>

                  {video.lectureNumber > 0 && (
                    <div className={styles.topPillBadge}>
                      <Layers size={11} color="#f97316" />
                      <span>Lecture {video.lectureNumber}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div>
                    <h3 
                      onClick={() => setActivePlayerVideo(video)}
                      className={styles.cardTitle}
                      title={video.title}
                    >
                      {video.title}
                    </h3>

                    <div className={styles.cardBadges}>
                      <span className={styles.cardBadge}>{video.category}</span>
                      {video.subject && (
                        <span className={styles.cardBadge} style={{ color: 'var(--primary)' }}>{video.subject.name}</span>
                      )}
                      {video.chapter && (
                        <span className={styles.cardBadge}>Ch {video.chapter.number}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardInteractions}>
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
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => setActivePlayerVideo(video)}
                        className={styles.btnDownload}
                        aria-label={`Watch ${video.title}`}
                      >
                        <Play size={12} fill="currentColor" /> Watch
                      </button>
                      {video.pdfUrl && (
                        <a
                          href={video.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnView}
                          aria-label={`Notes PDF for ${video.title}`}
                        >
                          <FileText size={12} /> Notes PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PW Video Player Theater Modal ── */}
      {activePlayerVideo && (
        <div className={styles.modalBackdrop} onClick={() => setActivePlayerVideo(null)}>
          <div className={styles.modalDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activePlayerVideo.category} {activePlayerVideo.subject ? `· ${activePlayerVideo.subject.name}` : ''} {activePlayerVideo.lectureNumber ? `· Lecture ${activePlayerVideo.lectureNumber}` : ''}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {activePlayerVideo.title}
                </h3>
              </div>
              <button 
                className={styles.modalCloseBtn} 
                onClick={() => setActivePlayerVideo(null)}
                title="Close Player (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalPlayerBody}>
              <PWVideoPlayer
                youtubeUrl={activePlayerVideo.youtubeLink}
                title={activePlayerVideo.title}
                subtitle={`${activePlayerVideo.category}${activePlayerVideo.subject ? ` · ${activePlayerVideo.subject.name}` : ''}`}
                pdfNotesUrl={activePlayerVideo.pdfUrl}
                autoPlay={true}
                onBack={() => setActivePlayerVideo(null)}
              />
            </div>

            <div className={styles.modalFooter}>
              <InteractionButtons
                targetId={activePlayerVideo.id}
                targetType="VIDEO"
                initialLikes={activePlayerVideo.likesCount}
                initialShares={activePlayerVideo.sharesCount}
                initialFavorites={activePlayerVideo.favoritesCount}
                isLiked={activePlayerVideo.isLiked}
                isFavorited={activePlayerVideo.isFavorited}
                isAuthenticated={isAuthenticated}
              />
              {activePlayerVideo.pdfUrl && (
                <a
                  href={activePlayerVideo.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="haptic-btn"
                  style={{
                    fontSize: '0.85rem',
                    background: 'var(--surface-card)',
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    border: '1px solid var(--surface-border)',
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Download Lecture Notes
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideosClient({ initialVideos = [] }: { initialVideos?: Video[] }) {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className="skeleton" style={{ width: 260, height: 42, marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: 380, marginBottom: '2rem' }} />
        <div className={styles.videosGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.videoCard}>
              <div className="skeleton" style={{ width: '100%', paddingBottom: '56.25%' }} />
              <div style={{ padding: '1rem' }}>
                <div className="skeleton skeleton-text" style={{ width: '80%', height: '1.2rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: '1rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <VideosContent initialVideos={initialVideos} />
    </Suspense>
  );
}
