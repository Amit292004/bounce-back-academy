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
  if (n.includes('math'))    return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
  if (n.includes('science')) return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  if (n.includes('english')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (n.includes('social'))  return { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' };
  if (n.includes('hindi'))   return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  if (n.includes('physics')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' };
  if (n.includes('chem'))    return { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
  if (n.includes('bio'))     return { color: '#84cc16', bg: 'rgba(132,204,22,0.1)' };
  return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '75%', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '45%', height: '0.75rem' }} />
        </div>
        <div className="skeleton" style={{ width: 52, height: 24, borderRadius: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 55, height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function PapersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mode, setMode] = useState<'year-wise' | 'chapter-wise'>('year-wise');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedClass,   setSelectedClass]   = useState(searchParams.get('class')   || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedYear,    setSelectedYear]    = useState(searchParams.get('year')    || '');
  const [selectedChapter, setSelectedChapter] = useState(searchParams.get('chapter') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady,       setAuthReady]       = useState(false);

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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(1.5rem,5vw,2.5rem) clamp(1rem,3vw,1.5rem)' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(2rem,7vw,2.8rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Question <span className="kinetic-text">Papers</span>
        </h1>
        <p style={{ opacity: 0.65, fontSize: '1rem', lineHeight: 1.65 }}>
          NBSE past papers from 2016 onwards. View free — download after login.
        </p>
      </div>

      {/* Mode Toggle + Search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
          gap: '0.25rem',
        }}>
          <button
            onClick={() => { setMode('year-wise'); setSelectedChapter(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none',
              background: mode === 'year-wise' ? 'var(--primary)' : 'transparent',
              color: mode === 'year-wise' ? 'white' : 'var(--foreground)',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease', fontSize: '0.88rem',
            }}
          >
            <FaCalendarAlt /> Year-wise
          </button>
          <button
            onClick={() => { setMode('chapter-wise'); setSelectedYear(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none',
              background: mode === 'chapter-wise' ? 'var(--primary)' : 'transparent',
              color: mode === 'chapter-wise' ? 'white' : 'var(--foreground)',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease', fontSize: '0.88rem',
            }}
          >
            <FaLayerGroup /> Chapter-wise
          </button>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FaSearch style={{ position: 'absolute', left: '1rem', color: 'var(--primary)', opacity: 0.6, zIndex: 1 }} />
          <input
            type="text"
            placeholder="Search by title, subject or year…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-md)', color: 'var(--foreground)',
              fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s ease',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--surface-border)')}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.5 }}>
              <FaTimes />
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

      {/* Results count */}
      {!loading && (
        <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '1.25rem', fontWeight: 600 }}>
          {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Papers Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPapers.length === 0 ? (
        <div style={{
          padding: '5rem 2rem', textAlign: 'center',
          background: 'var(--surface)', border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>No papers found</h3>
          <p style={{ opacity: 0.55, marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {filteredPapers.map((paper, idx) => {
            const { color, bg } = getSubjectColor(paper.subject.name);
            const displayClass = paper.className.startsWith('Class') || ['CUET','JEE','NEET'].includes(paper.className)
              ? paper.className : `Class ${paper.className}`;

            return (
              <div
                key={paper.id}
                className="premium-card"
                style={{
                  padding: '1.5rem',
                  animation: `fadeIn 0.5s ease-out forwards ${idx * 0.04}s`,
                  opacity: 0,
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, fontSize: '1.4rem', flexShrink: 0,
                    border: `1px solid ${color}33`,
                  }}>
                    <FaFileAlt />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                      {paper.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{displayClass}</span>
                      <span className="badge" style={{ background: bg, color }}>{paper.subject.name}</span>
                      {paper.chapter && (
                        <span className="badge badge-success">Ch {paper.chapter.number}</span>
                      )}
                      {paper.phase && (
                        <span className="badge badge-amber">{paper.phase}</span>
                      )}
                    </div>
                  </div>
                  {/* Year Badge — prominent */}
                  {paper.year && (
                    <div style={{
                      flexShrink: 0,
                      padding: '0.3rem 0.65rem',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      letterSpacing: '0.02em',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                    }}>
                      {paper.year.year}
                    </div>
                  )}
                </div>

                {/* Interaction row */}
                <div style={{ marginBottom: '1rem' }}>
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

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {(paper.viewUrl || paper.downloadFile) && (
                    <a
                      href={(() => {
                        const base = getViewLink(paper.viewUrl || paper.downloadFile);
                        if (base.startsWith('/view')) return `${base}&title=${encodeURIComponent(paper.title)}`;
                        return base;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary haptic-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                    >
                      <FaEye style={{ marginRight: '0.4rem' }} /> View
                    </a>
                  )}
                  {!isAuthenticated ? (
                    <Link
                      href="/login"
                      className="btn-primary haptic-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                    >
                      <FaDownload style={{ marginRight: '0.4rem' }} /> Login to Download
                    </Link>
                  ) : (paper.downloadFile || paper.viewUrl) ? (
                    <button
                      onClick={() => handleDownload(getDownloadLink(paper.downloadFile || paper.viewUrl), `${paper.title}.pdf`)}
                      className="btn-primary haptic-btn"
                      style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                    >
                      <FaDownload style={{ marginRight: '0.4rem' }} /> Download
                    </button>
                  ) : (
                    <button disabled className="btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', opacity: 0.4, cursor: 'not-allowed' }}>
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PapersPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="skeleton" style={{ width: 300, height: 48, marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: 400, marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 210, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    }>
      <PapersContent />
    </Suspense>
  );
}
