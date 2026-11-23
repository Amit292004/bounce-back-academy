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
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', gap: '0.35rem' }}>
          <div className="skeleton" style={{ width: 65, height: 20, borderRadius: 5 }} />
          <div className="skeleton" style={{ width: 75, height: 20, borderRadius: 5 }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" style={{ width: '85%', height: '1.1rem', marginBottom: '0.4rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', height: '1.1rem', marginBottom: '0.85rem' }} />
      <div className={styles.cardDivider} />
      <div className={styles.cardFooter}>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.45rem', width: '100%' }}>
          <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 7 }} />
          <div className="skeleton" style={{ flex: 1.5, height: 34, borderRadius: 7 }} />
        </div>
      </div>
    </div>
  );
}

function NotesContent({ initialNotes = [] }: { initialNotes?: Note[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(initialNotes.length === 0);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedChapter, setSelectedChapter] = useState(searchParams.get('chapter') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(initialNotes.length > 0);

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

  const normalizeClass = (c: string) => (c || '').toLowerCase().replace(/^class\s*/i, '').trim();

  const handleClassSelect = (cls: string) => {
    const newVal = normalizeClass(cls) === normalizeClass(selectedClass) ? '' : cls;
    setSelectedClass(newVal);
    setSelectedSubject('');
    setSelectedChapter('');
    updateURL({ class: newVal, subject: '', chapter: '' });
  };

  const filteredChapters = chapters.filter(ch =>
    (selectedClass ? normalizeClass(ch.className) === normalizeClass(selectedClass) : true) &&
    (selectedSubject ? ch.subjectId === selectedSubject : true)
  );

  const filteredNotes = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasFilters = !!(selectedClass || selectedSubject || selectedChapter);

  return (
    <div className={styles.container}>

      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Chapter Revision Notes</span>
        </div>
        <h1 className={styles.title}>Study Notes</h1>
        <p className={styles.subtitle}>
          Comprehensive, syllabus-aligned chapter notes for all subjects. Free preview with instant PDF download.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search notes by title, subject or chapter…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search study notes"
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear} aria-label="Clear search">
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      {/* SaaS Filter Bar */}
      <div className={styles.filterBarWrapper}>
        <div className={styles.filterBar}>
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
              onChange={e => {
                setSelectedChapter(e.target.value);
                updateURL({ chapter: e.target.value });
              }}
              disabled={filteredChapters.length === 0}
              className={styles.filterBarSelect}
            >
              <option value="">All Chapters</option>
              {filteredChapters.map(ch => (
                <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.name}</option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              className={styles.clearSegment}
              onClick={() => {
                setSelectedClass('');
                setSelectedSubject('');
                setSelectedChapter('');
                updateURL({ class: '', subject: '', chapter: '' });
              }}
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
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} available
          </span>
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className={styles.notesGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', opacity: 0.6 }}>
            <FaBook size={40} />
          </div>
          <h3 className={styles.emptyStateTitle}>No notes found</h3>
          <p className={styles.emptyStateText}>
            {search ? `No notes match "${search}". Try a different search term or clear your filters.` : 'No notes available for the selected filters yet. Check back soon!'}
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
        <div className={styles.notesGrid}>
          {filteredNotes.map((note) => {
            const { color } = getSubjectColor(note.subject.name);
            const displayClass = note.className.toLowerCase().startsWith('class') || ['cuet', 'jee', 'neet'].includes(note.className.toLowerCase())
              ? note.className
              : `Class ${note.className}`;
            const isChapterRedundant = !note.chapter?.name || note.chapter.name.trim().toLowerCase() === note.title.trim().toLowerCase();

            return (
              <div key={note.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIconBox} style={{ color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                    <FaBook size={16} />
                  </div>
                  <div className={styles.cardBadges}>
                    <span className={styles.cardBadge}>{displayClass}</span>
                    <span className={styles.cardBadge} style={{ color }}>{note.subject.name}</span>
                    {note.chapter && (
                      <span className={styles.cardBadge}>Ch {note.chapter.number}</span>
                    )}
                  </div>
                </div>

                <h3 className={styles.cardTitle} title={note.title}>
                  {note.title}
                </h3>
                <p className={styles.cardMeta}>
                  {!isChapterRedundant ? `${note.chapter!.name} • Revision Notes` : 'Comprehensive Chapter Study Guide & Solutions'}
                </p>

                <div className={styles.cardDivider} />

                <div className={styles.cardFooter}>
                  <div className={styles.cardInteractions}>
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

                  <div className={styles.cardActions}>
                    {(note.viewUrl || note.downloadFile) && (
                      <a
                        href={(() => {
                          const base = getViewLink(note.viewUrl || note.downloadFile);
                          if (base.startsWith('/view')) return `${base}&title=${encodeURIComponent(note.title)}`;
                          return base;
                        })()}
                        className={styles.btnView}
                        aria-label={`View ${note.title}`}
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
                    ) : (note.downloadFile || note.viewUrl) ? (
                      <button
                        onClick={() => handleDownload(getDownloadLink(note.downloadFile || note.viewUrl), `${note.title}.pdf`)}
                        className={styles.btnDownload}
                        aria-label={`Download ${note.title}`}
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

export default function NotesClient({ initialNotes = [] }: { initialNotes?: Note[] }) {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className="skeleton" style={{ width: 260, height: 42, marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: 380, marginBottom: '2rem' }} />
        <div className={styles.notesGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    }>
      <NotesContent initialNotes={initialNotes} />
    </Suspense>
  );
}
