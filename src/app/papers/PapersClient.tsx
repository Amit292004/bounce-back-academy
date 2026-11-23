"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFileAlt, FaDownload, FaEye, FaSearch, FaTimes, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';
import { getDownloadLink, getViewLink, handleDownload } from '@/lib/utils';
import styles from './page.module.css';

interface Paper {
  id: string;
  title: string;
  className: string;
  phase: string | null;
  subject: { id: string; name: string };
  year: { id: string; year: string };
  chapter?: { id: string; name: string; number: number } | null;
  viewUrl: string;
  downloadFile: string;
  likesCount: number;
  sharesCount: number;
  favoritesCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface Subject { id: string; name: string; }
interface Year    { id: string; year: string; }
interface Chapter { id: string; name: string; number: number; className: string; subjectId: string; }
interface Course  { id: string; name: string; }

function getSubjectColor(name: string) {
  const n = name.toLowerCase();
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

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', gap: '0.35rem' }}>
          <div className="skeleton" style={{ width: 65, height: 20, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 75, height: 20, borderRadius: 5 }} />
        </div>
        <div className="skeleton" style={{ width: 44, height: 22, borderRadius: 6, flexShrink: 0 }} />
      </div>
      <div className="skeleton skeleton-text" style={{ width: '85%', height: '1.1rem', marginBottom: '0.5rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: '1.1rem', marginBottom: '1rem' }} />
      <div className={styles.cardDivider} />
      <div className={styles.cardFooter}>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ flex: 1.6, height: 36, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

function PapersContent({ initialPapers = [] }: { initialPapers?: Paper[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mode, setMode] = useState<'year-wise' | 'chapter-wise'>('year-wise');
  const [loading, setLoading] = useState(initialPapers.length === 0);
  const [search, setSearch] = useState('');

  const [selectedClass,   setSelectedClass]   = useState(searchParams.get('class')   || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedYear,    setSelectedYear]    = useState(searchParams.get('year')    || '');
  const [selectedChapter, setSelectedChapter] = useState(searchParams.get('chapter') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady,       setAuthReady]       = useState(initialPapers.length > 0);

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const fetchMeta = async () => {
    const [sRes, yRes, cRes, coursesRes] = await Promise.all([
      fetch('/api/admin/subjects'),
      fetch('/api/admin/years'),
      fetch('/api/admin/chapters'),
      fetch('/api/admin/courses'),
    ]);
    if (sRes.ok)       setSubjects(await sRes.json());
    if (yRes.ok)       setYears(await yRes.json());
    if (cRes.ok)       setChapters(await cRes.json());
    if (coursesRes.ok) setCourses(await coursesRes.json());
  };

  useEffect(() => {
    fetchMeta();
    (async () => {
      try {
        const cachedMe = sessionStorage.getItem('bb_student_me');
        if (cachedMe) {
          const data = JSON.parse(cachedMe);
          setIsAuthenticated(data.authenticated);
          if (data.authenticated && data.class && !searchParams.get('class') && !selectedClass) {
            setSelectedClass(data.class);
          }
          setAuthReady(true);
        }
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('bb_student_me', JSON.stringify(data));
          if (!cachedMe) {
            setIsAuthenticated(data.authenticated);
            if (data.authenticated && data.class && !searchParams.get('class') && !selectedClass) {
              setSelectedClass(data.class);
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

  const fetchPapers = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (selectedClass)   params.set('class',   selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedYear)    params.set('year',    selectedYear);
    if (selectedChapter) params.set('chapter', selectedChapter);
    const url = `/api/papers?${params.toString()}`;
    setLoading(true);
    const res = await fetch(url);
    if (res.ok) setPapers(await res.json());
    setLoading(false);
  }, [mode, selectedClass, selectedSubject, selectedYear, selectedChapter]);

  useEffect(() => {
    if (authReady) fetchPapers();
  }, [authReady, fetchPapers]);

  const handleClassSelect = (cls: string) => {
    const newVal = cls === selectedClass ? '' : cls;
    setSelectedClass(newVal);
    setSelectedSubject('');
    setSelectedYear('');
    setSelectedChapter('');
    updateURL({ class: newVal, subject: '', year: '', chapter: '' });
  };

  const filteredChapters = chapters.filter(ch =>
    (selectedClass   ? ch.className  === selectedClass   : true) &&
    (selectedSubject ? ch.subjectId  === selectedSubject : true)
  );

  const filteredPapers = papers.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.subject.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.year?.year || '').includes(search)
  );

  const hasFilters = !!(selectedClass || selectedSubject || selectedYear || selectedChapter);

  return (
    <div className={styles.container}>

      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>NBSE Board Archive</span>
        </div>
        <h1 className={styles.title}>
          Question Papers
        </h1>
        <p className={styles.subtitle}>
          Official NBSE past board examination papers from 2016 onwards. Free online preview and instant PDF download.
        </p>
      </div>

      {/* Mode Toggle + Search Toolbar */}
      <div className={styles.toolbar}>
        {/* Mode Toggle */}
        <div className={styles.segmentedControl} role="tablist" aria-label="Question paper grouping mode">
          <button
            role="tab"
            aria-selected={mode === 'year-wise'}
            onClick={() => { setMode('year-wise'); setSelectedChapter(''); }}
            className={`${styles.segmentedBtn} ${mode === 'year-wise' ? styles.segmentedBtnActive : ''}`}
          >
            <FaCalendarAlt size={13} />
            <span>Year-wise</span>
          </button>
          <button
            role="tab"
            aria-selected={mode === 'chapter-wise'}
            onClick={() => { setMode('chapter-wise'); setSelectedYear(''); }}
            className={`${styles.segmentedBtn} ${mode === 'chapter-wise' ? styles.segmentedBtnActive : ''}`}
          >
            <FaLayerGroup size={13} />
            <span>Chapter-wise</span>
          </button>
        </div>

        {/* Search Input */}
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title, subject or year…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search question papers"
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear} aria-label="Clear search">
              <FaTimes size={13} />
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </div>

          {/* Class */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>Class</span>
            <select
              value={selectedClass}
              onChange={e => {
                const val = e.target.value;
                setSelectedClass(val);
                setSelectedSubject('');
                setSelectedYear('');
                setSelectedChapter('');
                updateURL({ class: val, subject: '', year: '', chapter: '' });
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

          {/* Year / Chapter */}
          <div className={styles.filterBarSegment}>
            <span className={styles.filterBarLabel}>{mode === 'chapter-wise' ? 'Chapter' : 'Year'}</span>
            {mode === 'chapter-wise' ? (
              <select
                value={selectedChapter}
                onChange={e => { setSelectedChapter(e.target.value); updateURL({ chapter: e.target.value }); }}
                className={styles.filterBarSelect}
                disabled={!selectedSubject && !selectedClass}
              >
                <option value="">All Chapters</option>
                {filteredChapters.map(ch => (
                  <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); updateURL({ year: e.target.value }); }}
                className={styles.filterBarSelect}
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            )}
          </div>

          {/* Clear — only when filters active */}
          {hasFilters && (
            <button
              className={styles.clearSegment}
              onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedYear(''); setSelectedChapter(''); router.push('/papers'); }}
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
            {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} available
          </span>
        </div>
      )}

      {/* Papers Grid */}
      {loading ? (
        <div className={styles.papersGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 className={styles.emptyStateTitle}>No papers found</h3>
          <p className={styles.emptyStateText}>
            {search
              ? `No papers match "${search}". Try a different search term or adjust your filters.`
              : 'No papers available for the selected filters. Try selecting a different class or year.'}
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedClass(''); setSelectedSubject(''); setSelectedYear(''); setSelectedChapter(''); router.push('/papers'); }}
            className="btn-primary"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={styles.papersGrid}>
          {filteredPapers.map((paper) => {
            const { color } = getSubjectColor(paper.subject.name);
            const displayClass = paper.className.startsWith('Class') || ['CUET','JEE','NEET'].includes(paper.className)
              ? paper.className : `Class ${paper.className}`;
            const isChapterRedundant = !paper.chapter?.name || paper.title.toLowerCase().includes(paper.chapter.name.toLowerCase());

            return (
              <div key={paper.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIconBox} style={{ color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                    <FaFileAlt size={16} />
                  </div>
                  <div className={styles.cardBadges}>
                    <span className={styles.cardBadge}>{displayClass}</span>
                    <span className={styles.cardBadge} style={{ color }}>{paper.subject.name}</span>
                    {paper.chapter && (
                      <span className={styles.cardBadge}>Ch {paper.chapter.number}</span>
                    )}
                    {paper.phase && (
                      <span className={styles.cardBadge}>{paper.phase}</span>
                    )}
                  </div>
                  {paper.year && (
                    <div className={styles.cardYearBadge}>
                      {paper.year.year}
                    </div>
                  )}
                </div>

                <h3 className={styles.cardTitle} title={paper.title}>
                  {paper.title}
                </h3>
                <p className={styles.cardMeta}>
                  Official NBSE Board Archive{!isChapterRedundant ? ` • ${paper.chapter!.name}` : ' • Past Exam Paper'}
                </p>

                <div className={styles.cardDivider} />

                <div className={styles.cardFooter}>
                  <div className={styles.cardInteractions}>
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

                  <div className={styles.cardActions}>
                    {(paper.viewUrl || paper.downloadFile) && (
                      <a
                        href={(() => {
                          const base = getViewLink(paper.viewUrl || paper.downloadFile);
                          if (base.startsWith('/view')) return `${base}&title=${encodeURIComponent(paper.title)}`;
                          return base;
                        })()}
                        className={styles.btnView}
                        aria-label={`View ${paper.title}`}
                      >
                        <FaEye size={13} /> View
                      </a>
                    )}
                    {!isAuthenticated ? (
                      <Link
                        href="/login"
                        className={styles.btnDownload}
                        aria-label="Login to Download"
                      >
                        <FaDownload size={12} /> Login to Download
                      </Link>
                    ) : (paper.downloadFile || paper.viewUrl) ? (
                      <button
                        onClick={() => handleDownload(getDownloadLink(paper.downloadFile || paper.viewUrl), `${paper.title}.pdf`)}
                        className={styles.btnDownload}
                        aria-label={`Download ${paper.title}`}
                      >
                        <FaDownload size={12} /> Download
                      </button>
                    ) : (
                      <button
                        disabled
                        className={styles.btnView}
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                      >
                        Not Available
                      </button>
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

export default function PapersClient({ initialPapers = [] }: { initialPapers?: Paper[] }) {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className="skeleton" style={{ width: 260, height: 42, marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: 380, marginBottom: '2rem' }} />
        <div className={styles.papersGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    }>
      <PapersContent initialPapers={initialPapers} />
    </Suspense>
  );
}
