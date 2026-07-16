"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBook, FaDownload, FaEye, FaSearch, FaTimes } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';
import { getDownloadLink, getViewLink, handleDownload } from '@/lib/utils';
import styles from './page.module.css';

interface Note {
  id: string;
  title: string;
  className: string;
  subject: { id: string; name: string };
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
          <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function NotesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
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
    const [subRes, chapRes, coursesRes] = await Promise.all([
      fetch('/api/admin/subjects'),
      fetch('/api/admin/chapters'),
      fetch('/api/admin/courses'),
    ]);
    if (subRes.ok) setSubjects(await subRes.json());
    if (chapRes.ok) setChapters(await chapRes.json());
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

  const fetchNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedChapter) params.set('chapter', selectedChapter);
    const url = `/api/notes?${params.toString()}`;
    setLoading(true);
    const res = await fetch(url);
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, [selectedClass, selectedSubject, selectedChapter]);

  useEffect(() => {
    if (authReady) fetchNotes();
  }, [authReady, fetchNotes]);

  const handleClassSelect = (cls: string) => {
    const newVal = cls === selectedClass ? '' : cls;
    setSelectedClass(newVal);
    setSelectedSubject('');
    setSelectedChapter('');
    updateURL({ class: newVal, subject: '', chapter: '' });
  };

  const filteredChapters = chapters.filter(ch =>
    (selectedClass ? ch.className === selectedClass : true) &&
    (selectedSubject ? ch.subjectId === selectedSubject : true)
  );

  const filteredNotes = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasFilters = !!(selectedClass || selectedSubject || selectedChapter);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(1.5rem,5vw,2.5rem) clamp(1rem,3vw,1.5rem)' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(2rem,7vw,2.8rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Study <span className="kinetic-text">Notes</span>
        </h1>
        <p style={{ opacity: 0.65, fontSize: '1rem', lineHeight: 1.65 }}>
          Comprehensive notes for all levels. View free — download after login.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1,
          minWidth: 200,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <FaSearch style={{ position: 'absolute', left: '1rem', color: 'var(--primary)', opacity: 0.6, zIndex: 1 }} />
          <input
            type="text"
            placeholder="Search notes by title or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
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
              disabled={!selectedSubject && !selectedClass}
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
              onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); updateURL({ class: '', subject: '', chapter: '' }); }}
            >
              <FaTimes size={10} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '1.25rem', fontWeight: 600 }}>
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>No notes found</h3>
          <p style={{ opacity: 0.55, marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
            {search ? `No notes match "${search}". Try a different search or clear your filters.` : 'No notes available for the selected filters yet. Check back soon!'}
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); updateURL({ class: '', subject: '', chapter: '' }); }}
            className="btn-primary"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {filteredNotes.map((note, idx) => {
            const { color, bg } = getSubjectColor(note.subject.name);
            return (
              <div
                key={note.id}
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
                    width: 52, height: 52,
                    borderRadius: 14,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, fontSize: '1.4rem', flexShrink: 0,
                    border: `1px solid ${color}33`,
                  }}>
                    <FaBook />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: '0.4rem', lineHeight: 1.35 }}
                        title={note.title}>
                      {note.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">
                        {note.className.startsWith('Class') || ['CUET','JEE','NEET'].includes(note.className)
                          ? note.className : `Class ${note.className}`}
                      </span>
                      <span className="badge" style={{ background: bg, color }}>
                        {note.subject.name}
                      </span>
                      {note.chapter && (
                        <span className="badge badge-success">Ch {note.chapter.number}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interaction row */}
                <div style={{ marginBottom: '1rem' }}>
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

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {(note.viewUrl || note.downloadFile) && (
                    <a
                      href={(() => {
                        const base = getViewLink(note.viewUrl || note.downloadFile);
                        if (base.startsWith('/view')) return `${base}&title=${encodeURIComponent(note.title)}`;
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
                  ) : (note.downloadFile || note.viewUrl) ? (
                    <button
                      onClick={() => handleDownload(getDownloadLink(note.downloadFile || note.viewUrl), `${note.title}.pdf`)}
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

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="skeleton" style={{ width: 280, height: 48, marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: 360, marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}
