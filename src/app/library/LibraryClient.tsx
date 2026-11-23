"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  Search,
  BookOpen,
  FileText,
  Video as VideoIcon,
  Download,
  Eye,
  Play,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import PWVideoPlayer from '@/components/video/PWVideoPlayer';
import InteractionButtons from '@/components/InteractionButtons';
import { handleDownload, getViewLink } from '@/lib/utils';

interface ResourceItem {
  id: string;
  title: string;
  type: 'NOTE' | 'PAPER' | 'VIDEO' | 'QUIZ';
  className: string;
  subject: string;
  chapter?: string;
  year?: string;
  viewUrl?: string;
  downloadUrl?: string;
  youtubeLink?: string;
  pdfUrl?: string | null;
  lectureNumber?: number;
  questionCount?: number;
  likesCount?: number;
  sharesCount?: number;
  favoritesCount?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

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

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
  return match ? match[1] : null;
};

export default function LibraryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || 'all');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all');

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    notes: ResourceItem[];
    papers: ResourceItem[];
    videos: ResourceItem[];
    quizzes: ResourceItem[];
    totalCount: number;
  }>({
    notes: [],
    papers: [],
    videos: [],
    quizzes: [],
    totalCount: 0,
  });

  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  const [activeVideo, setActiveVideo] = useState<ResourceItem | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state for downloads & favorites
  useEffect(() => {
    (async () => {
      try {
        const cachedMe = sessionStorage.getItem('bb_student_me');
        if (cachedMe) {
          const data = JSON.parse(cachedMe);
          setIsAuthenticated(data.authenticated);
        }
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('bb_student_me', JSON.stringify(data));
          setIsAuthenticated(data.authenticated);
        }
      } catch {
        // silent
      }
    })();
  }, []);

  // Sync with URL
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') sp.set(k, v);
        else sp.delete(k);
      });
      router.push(`/library?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch subjects list for filter pills
  useEffect(() => {
    fetch('/api/admin/subjects')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjectsList(data))
      .catch(() => {});
  }, []);

  // Fetch library data
  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set('q', query.trim());
      if (activeTab !== 'all') sp.set('type', activeTab);
      if (selectedClass !== 'all') sp.set('class', selectedClass);
      if (selectedSubject !== 'all') sp.set('subject', selectedSubject);

      const res = await fetch(`/api/library?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently retain existing results
    } finally {
      setLoading(false);
    }
  }, [query, activeTab, selectedClass, selectedSubject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLibrary();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLibrary]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    updateURL({ type: tabId });
  };

  // Combine results according to tab
  const displayItems = (
    activeTab === 'notes'
      ? results.notes
      : activeTab === 'papers'
      ? results.papers
      : activeTab === 'videos'
      ? results.videos
      : activeTab === 'quizzes'
      ? results.quizzes
      : [...results.notes, ...results.papers, ...results.videos, ...results.quizzes]
  );

  const classesList = [
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
    'JEE',
    'NEET',
    'CUET',
    'Skills',
  ];

  const hasFilters = query !== '' || selectedClass !== 'all' || selectedSubject !== 'all' || activeTab !== 'all';

  const handleClearFilters = () => {
    setQuery('');
    setSelectedClass('all');
    setSelectedSubject('all');
    setActiveTab('all');
    router.push('/library');
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Universal Study Library</span>
        </div>
        <h1 className={styles.title}>Study Library</h1>
        <p className={styles.subtitle}>
          Search across all verified NBSE notes, previous year exam papers, video lectures, and practice quizzes in one place.
        </p>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className={styles.toolbar}>
        {/* Resource Type Segmented Switcher */}
        <div className={styles.segmentedControl}>
          {[
            { id: 'all', label: 'All', count: results.totalCount },
            { id: 'notes', label: 'Notes', count: results.notes.length },
            { id: 'papers', label: 'Papers', count: results.papers.length },
            { id: 'videos', label: 'Videos', count: results.videos.length },
            { id: 'quizzes', label: 'Quizzes', count: results.quizzes.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${styles.segmentedBtn} ${activeTab === tab.id ? styles.segmentedBtnActive : ''}`}
            >
              <span>{tab.label}</span>
              <span className={styles.segmentedCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={15} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title, subject, chapter, or keyword..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateURL({ q: e.target.value });
            }}
            className={styles.searchInput}
            aria-label="Search study resources"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                updateURL({ q: '' });
              }}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── SaaS Filter Bar ── */}
      <div className={styles.filterBarWrapper}>
        <div className={styles.filterBar}>
          {/* Filter icon */}
          <div className={styles.filterBarIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>

          {/* Class / Curriculum Segment */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Class</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClass(val);
                updateURL({ class: val });
              }}
              className={styles.filterBarSelect}
            >
              <option value="all">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Subject Segment */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Subject</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSubject(val);
                updateURL({ subject: val });
              }}
              className={styles.filterBarSelect}
            >
              <option value="all">All Subjects</option>
              {subjectsList.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Clear — only when filters active */}
          {hasFilters && (
            <button
              className={styles.clearSegment}
              onClick={handleClearFilters}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count Bar */}
      {!loading && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {displayItems.length} resource{displayItems.length !== 1 ? 's' : ''} available
            {query ? ` matching "${query}"` : ''}
          </span>
        </div>
      )}

      {/* Cards Grid / Skeletons / Empty State */}
      {loading ? (
        <div className={styles.resourceGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) =>
            activeTab === 'videos' ? (
              <div key={i} className={styles.videoCard}>
                <div className="skeleton" style={{ width: '100%', paddingBottom: '56.25%', borderRadius: 0 }} />
                <div style={{ padding: '1rem 1.15rem' }}>
                  <div className="skeleton skeleton-text" style={{ width: '85%', height: '1.1rem', marginBottom: '0.45rem' }} />
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem' }}>
                    <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 5 }} />
                    <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 5 }} />
                  </div>
                  <div className="skeleton" style={{ width: '100%', height: 34, borderRadius: 7 }} />
                </div>
              </div>
            ) : (
              <div key={i} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', gap: '0.35rem' }}>
                    <div className="skeleton" style={{ width: 75, height: 20, borderRadius: 5 }} />
                    <div className="skeleton" style={{ width: 65, height: 20, borderRadius: 5 }} />
                  </div>
                  <div className="skeleton" style={{ width: 44, height: 20, borderRadius: 5, flexShrink: 0 }} />
                </div>
                <div className="skeleton skeleton-text" style={{ width: '88%', height: '1.1rem', marginBottom: '0.45rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%', height: '1.1rem', marginBottom: '0.85rem' }} />
                <div className={styles.cardDivider} />
                <div className={styles.cardFooter}>
                  <div className="skeleton" style={{ width: '100%', height: 34, borderRadius: 7 }} />
                </div>
              </div>
            )
          )}
        </div>
      ) : displayItems.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No study resources found"
          description="Try broadening your keywords or clearing the level and subject filters to explore all available material."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setSelectedClass('all');
                setSelectedSubject('all');
                setActiveTab('all');
                router.push('/library');
              }}
            >
              Reset Search Filters
            </Button>
          }
        />
      ) : (
        <div className={styles.resourceGrid}>
          {displayItems.map((item) => {
            const { color, bg } = getSubjectColor(item.subject);
            const displayClass = (item.className || '').toLowerCase().startsWith('class') || ['cuet', 'jee', 'neet'].includes((item.className || '').toLowerCase())
              ? item.className
              : `Class ${item.className}`;

            const baseView = item.viewUrl || item.downloadUrl || '';
            const viewLink = baseView
              ? (getViewLink(baseView).startsWith('/view')
                  ? `${getViewLink(baseView)}&title=${encodeURIComponent(item.title)}`
                  : getViewLink(baseView))
              : '';

            const isChapterRedundant = !item.chapter || item.chapter.trim().toLowerCase() === item.title.trim().toLowerCase();

            if (item.type === 'VIDEO') {
              const videoId = getYoutubeId(item.youtubeLink || '');
              const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

              return (
                <div key={`${item.type}-${item.id}`} className={styles.videoCard}>
                  {/* Interactive High-Def Video Thumbnail with Play Overlay */}
                  <div
                    className={styles.thumbnailContainer}
                    onClick={() => setActiveVideo(item)}
                    title={`Play "${item.title}" in Theater Player`}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={item.title}
                        className={styles.thumbnailImg}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={36} color="var(--primary)" />
                      </div>
                    )}

                    <div className={styles.thumbnailOverlay}>
                      <div className={styles.playGlowBtn}>
                        <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
                      </div>
                    </div>

                    {item.lectureNumber && item.lectureNumber > 0 && (
                      <div className={styles.topPillBadge}>
                        <span>Lecture {item.lectureNumber}</span>
                      </div>
                    )}

                    <div className={styles.pwPillBadge}>
                      <Sparkles size={10} />
                      <span>Watch</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div>
                      <h3
                        onClick={() => setActiveVideo(item)}
                        className={styles.cardTitle}
                        title={item.title}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.title}
                      </h3>

                      <div className={styles.cardBadges} style={{ marginBottom: '0.65rem' }}>
                        <span className={`${styles.cardTypeBadge} ${styles.cardTypeVideo}`}>Video Lecture</span>
                        <span className={styles.cardBadge}>{displayClass}</span>
                        <span className={styles.cardBadge} style={{ color }}>{item.subject}</span>
                        {item.chapter && !isChapterRedundant && (
                          <span className={styles.cardBadge}>{item.chapter}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardInteractions}>
                        <InteractionButtons
                          targetId={item.id}
                          targetType="VIDEO"
                          initialLikes={item.likesCount || 0}
                          initialShares={item.sharesCount || 0}
                          initialFavorites={item.favoritesCount || 0}
                          isLiked={item.isLiked}
                          isFavorited={item.isFavorited}
                          isAuthenticated={isAuthenticated}
                        />
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          onClick={() => setActiveVideo(item)}
                          className={styles.btnDownload}
                          aria-label={`Watch ${item.title}`}
                        >
                          <Play size={12} fill="currentColor" /> Watch
                        </button>
                        {item.pdfUrl && (
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnView}
                            aria-label={`Notes PDF for ${item.title}`}
                          >
                            <FileText size={12} /> Notes PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={`${item.type}-${item.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <div
                    className={styles.cardIconBox}
                    style={{
                      color,
                      background: bg,
                      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                    }}
                  >
                    {item.type === 'PAPER' && <FileText size={16} />}
                    {item.type === 'NOTE' && <BookOpen size={16} />}
                    {item.type === 'QUIZ' && <Sparkles size={16} />}
                  </div>

                  <div className={styles.cardBadges}>
                    <span
                      className={`${styles.cardTypeBadge} ${
                        item.type === 'NOTE'
                          ? styles.cardTypeNote
                          : item.type === 'PAPER'
                          ? styles.cardTypePaper
                          : styles.cardTypeQuiz
                      }`}
                    >
                      {item.type === 'NOTE'
                        ? 'Study Note'
                        : item.type === 'PAPER'
                        ? 'Question Paper'
                        : 'Practice Quiz'}
                    </span>
                    <span className={styles.cardBadge}>{displayClass}</span>
                    <span className={styles.cardBadge} style={{ color }}>{item.subject}</span>
                    {item.chapter && !isChapterRedundant && (
                      <span className={styles.cardBadge}>{item.chapter}</span>
                    )}
                    {typeof item.questionCount === 'number' && (
                      <span className={styles.cardBadge}>{item.questionCount} Qs</span>
                    )}
                  </div>

                  {item.year && (
                    <div className={styles.cardYearBadge}>
                      {item.year}
                    </div>
                  )}
                </div>

                <h3 className={styles.cardTitle} title={item.title}>
                  {item.title}
                </h3>
                <p className={styles.cardMeta}>
                  {item.type === 'PAPER'
                    ? `Official NBSE Board Archive${item.chapter && !isChapterRedundant ? ` • ${item.chapter}` : ' • Past Exam Paper'}`
                    : item.type === 'NOTE'
                    ? (!isChapterRedundant
                        ? `${item.chapter} • Full Revision Notes`
                        : 'Comprehensive Chapter Revision Notes & Solutions')
                    : `${item.questionCount || 10} Practice MCQs & Step-by-Step Solutions`}
                </p>

                <div className={styles.cardDivider} />

                <div className={styles.cardFooter}>
                  <div className={styles.cardInteractions}>
                    <InteractionButtons
                      targetId={item.id}
                      targetType={item.type}
                      initialLikes={item.likesCount || 0}
                      initialShares={item.sharesCount || 0}
                      initialFavorites={item.favoritesCount || 0}
                      isLiked={item.isLiked}
                      isFavorited={item.isFavorited}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>

                  <div className={styles.cardActions}>
                    {item.type === 'NOTE' && (
                      <>
                        {viewLink && (
                          <Link
                            href={viewLink}
                            className={styles.btnView}
                            aria-label={`View ${item.title}`}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        )}
                        {!isAuthenticated ? (
                          <Link
                            href="/login"
                            className={styles.btnDownload}
                            aria-label="Login to Download"
                          >
                            <Download size={12} />
                            <span>Login to Download</span>
                          </Link>
                        ) : item.downloadUrl ? (
                          <button
                            onClick={() => handleDownload(item.downloadUrl || '', item.title)}
                            className={styles.btnDownload}
                            aria-label={`Download ${item.title}`}
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        ) : null}
                      </>
                    )}

                    {item.type === 'PAPER' && (
                      <>
                        {viewLink && (
                          <Link
                            href={viewLink}
                            className={styles.btnView}
                            aria-label={`View ${item.title}`}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        )}
                        {!isAuthenticated ? (
                          <Link
                            href="/login"
                            className={styles.btnDownload}
                            aria-label="Login to Download"
                          >
                            <Download size={12} />
                            <span>Login to Download</span>
                          </Link>
                        ) : item.downloadUrl ? (
                          <button
                            onClick={() => handleDownload(item.downloadUrl || '', item.title)}
                            className={styles.btnDownload}
                            aria-label={`Download ${item.title}`}
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        ) : null}
                      </>
                    )}

                    {item.type === 'QUIZ' && (
                      <Link
                        href="/quiz"
                        className={styles.btnDownload}
                        style={{ width: '100%' }}
                      >
                        <Sparkles size={13} />
                        <span>Start Quiz</span>
                      </Link>
                    )}

                    {!viewLink && !item.downloadUrl && item.type !== 'QUIZ' && (
                      <button
                        disabled
                        className={styles.btnView}
                        style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}
                      >
                        <span>Not Available</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PW Video Player Modal for Library Videos */}
      {activeVideo && activeVideo.youtubeLink && (
        <div className={styles.modalBackdrop} onClick={() => setActiveVideo(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,23,42,0.6)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#818cf8',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {activeVideo.className} · {activeVideo.subject}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ width: '100%', background: '#000' }}>
              <PWVideoPlayer
                youtubeUrl={activeVideo.youtubeLink}
                title={activeVideo.title}
                subtitle={`${activeVideo.className} · ${activeVideo.subject}`}
                pdfNotesUrl={activeVideo.pdfUrl}
                autoPlay={true}
                onBack={() => setActiveVideo(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
