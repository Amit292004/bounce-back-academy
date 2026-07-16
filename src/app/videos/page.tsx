"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaYoutube, FaTimes } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';
import styles from './page.module.css';
import { logger } from '@/lib/logger'

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

function VideosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedChapter, setSelectedChapter] = useState(searchParams.get('chapter') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

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
          // Bug Fix #7: authReady must become true even if the API returns non-OK,
          // otherwise content never loads when auth is unavailable.
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Video <span className="kinetic-text">Lectures</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>Curated YouTube video lectures by class and subject. Watch free anytime.</p>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaYoutube style={{ fontSize: '4rem', marginBottom: '1rem', color: '#ff0000' }} />
          <p>No videos available yet. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {videos.map((video, idx) => {
            const videoId = getYoutubeId(video.youtubeLink);
            return (
              <div
                key={video.id}
                className="tactile-card"
                style={{
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  animation: `fadeIn 0.5s ease-out forwards ${idx * 0.05}s`,
                  opacity: 0
                }}
              >
                {videoId ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    <iframe
                      loading="lazy"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
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
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: 1.4, height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{video.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '999px', color: 'var(--primary)', fontWeight: 600 }}>{video.category}</span>
                      {video.subject && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(139,92,246,0.1)', borderRadius: '999px', color: 'var(--accent)', fontWeight: 600 }}>{video.subject.name}</span>
                      )}
                      {video.lectureNumber > 0 && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(245,158,11,0.1)', borderRadius: '999px', color: '#f59e0b', fontWeight: 600 }}>Lec {video.lectureNumber}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}>
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
                      {video.pdfUrl && (
                        <a
                          href={video.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="haptic-btn"
                          style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--primary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, transition: 'var(--transition)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Notes
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
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading page...</div>}>
      <VideosContent />
    </Suspense>
  );
}
