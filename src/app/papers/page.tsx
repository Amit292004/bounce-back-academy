"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFileAlt, FaDownload, FaEye, FaFilter } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';
import { getDownloadLink, getViewLink, handleDownload } from '@/lib/utils';
import CustomSelect from '@/components/CustomSelect';

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
interface Year { id: string; year: string; }
interface Chapter { id: string; name: string; number: number; className: string; subjectId: string; }
interface Course { id: string; name: string; }

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

  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
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
    const cachedSub = sessionStorage.getItem('bb_subjects');
    const cachedChap = sessionStorage.getItem('bb_chapters');
    const cachedYear = sessionStorage.getItem('bb_years');
    const cachedCourses = sessionStorage.getItem('bb_courses');
    if (cachedSub) setSubjects(JSON.parse(cachedSub));
    if (cachedChap) setChapters(JSON.parse(cachedChap));
    if (cachedYear) setYears(JSON.parse(cachedYear));
    if (cachedCourses) setCourses(JSON.parse(cachedCourses));

    const [sRes, yRes, cRes, coursesRes] = await Promise.all([
      fetch('/api/admin/subjects'), 
      fetch('/api/admin/years'),
      fetch('/api/admin/chapters'),
      fetch('/api/admin/courses')
    ]);
    if (sRes.ok) {
      const d = await sRes.json();
      setSubjects(d);
      sessionStorage.setItem('bb_subjects', JSON.stringify(d));
    }
    if (yRes.ok) {
      const d = await yRes.json();
      setYears(d);
      sessionStorage.setItem('bb_years', JSON.stringify(d));
    }
    if (cRes.ok) {
      const d = await cRes.json();
      setChapters(d);
      sessionStorage.setItem('bb_chapters', JSON.stringify(d));
    }
    if (coursesRes.ok) {
      const d = await coursesRes.json();
      setCourses(d);
      sessionStorage.setItem('bb_courses', JSON.stringify(d));
    }
  };

  // On mount: fetch auth first, set default class, THEN allow papers fetch
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
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedYear) params.set('year', selectedYear);
    if (selectedChapter) params.set('chapter', selectedChapter);
    const url = `/api/papers?${params.toString()}`;

    const cached = sessionStorage.getItem(`bb_papers_${url}`);
    if (cached) {
      setPapers(JSON.parse(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setPapers(data);
      sessionStorage.setItem(`bb_papers_${url}`, JSON.stringify(data));
    }
    setLoading(false);
  }, [mode, selectedClass, selectedSubject, selectedYear, selectedChapter]);

  // Only fetch papers after auth check is done (so class filter is applied from the start)
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
    (selectedClass ? ch.className === selectedClass : true) && 
    (selectedSubject ? ch.subjectId === selectedSubject : true)
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Question <span className="kinetic-text">Papers</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>NBSE past papers available from 2016 onwards. View free, download after login.</p>
      </div>

      {/* Mode Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem', 
        background: 'var(--surface)', 
        padding: '0.4rem', 
        borderRadius: 'var(--radius-md)', 
        width: '100%', 
        maxWidth: '400px',
        border: '1px solid var(--surface-border)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => { setMode('year-wise'); setSelectedChapter(''); }}
          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: mode === 'year-wise' ? 'var(--primary)' : 'transparent', color: mode === 'year-wise' ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)', fontSize: '0.9rem' }}
        >
          Year-wise
        </button>
        <button
          onClick={() => { setMode('chapter-wise'); setSelectedYear(''); }}
          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: mode === 'chapter-wise' ? 'var(--primary)' : 'transparent', color: mode === 'chapter-wise' ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)', fontSize: '0.9rem' }}
        >
          Chapter-wise
        </button>
      </div>

      {/* Class Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={() => handleClassSelect('')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: !selectedClass ? 'var(--primary)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)', fontSize: '0.875rem' }}
        >
          All Classes
        </button>
        {courses.map(c => (
          <button
            key={c.id}
            onClick={() => handleClassSelect(c.name)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedClass === c.name ? 'var(--primary)' : 'transparent', color: selectedClass === c.name ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)', fontSize: '0.875rem' }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Dropdown Filters */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        marginBottom: '3rem', 
        padding: 'clamp(1.25rem, 5vw, 2rem)', 
        background: 'var(--surface)', 
        border: '1px solid var(--surface-border)', 
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.8 }}>
            <FaFilter style={{ color: 'var(--primary)' }} /> 
            <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em' }}>Refine Your Search</span>
          </div>
          <button
            onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedYear(''); setSelectedChapter(''); router.push('/papers'); }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              opacity: (selectedClass || selectedSubject || selectedYear || selectedChapter) ? 1 : 0.4,
              transition: 'var(--transition)',
              pointerEvents: (selectedClass || selectedSubject || selectedYear || selectedChapter) ? 'auto' : 'none'
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Subject Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '4px', height: '12px', background: 'var(--primary)', borderRadius: '2px' }}></div>
              Select Subject
            </label>
            <CustomSelect
              value={selectedSubject}
              onChange={(val) => { setSelectedSubject(val); setSelectedChapter(''); updateURL({ subject: val, chapter: '' }); }}
              placeholder="All Subjects"
              options={[
                { value: '', label: 'All Subjects' },
                ...subjects.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>

          {/* Chapter/Year Row */}
          {mode === 'chapter-wise' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '4px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                Select Chapter
              </label>
              <CustomSelect
                value={selectedChapter}
                onChange={(val) => { setSelectedChapter(val); updateURL({ chapter: val }); }}
                placeholder="All Chapters"
                disabled={!selectedSubject && !selectedClass}
                options={[
                  { value: '', label: 'All Chapters' },
                  ...filteredChapters.map(ch => ({ value: ch.id, label: `Ch ${ch.number}: ${ch.name}` }))
                ]}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '4px', height: '12px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                Select Year
              </label>
              <CustomSelect
                value={selectedYear}
                onChange={(val) => { setSelectedYear(val); updateURL({ year: val }); }}
                placeholder="All Years"
                options={[
                  { value: '', label: 'All Years' },
                  ...years.map(y => ({ value: y.id, label: y.year }))
                ]}
              />
            </div>
          )}
        </div>

        {(selectedClass || selectedSubject || selectedYear || selectedChapter) && (
          <button
            onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedYear(''); setSelectedChapter(''); router.push('/papers'); }}
            style={{ 
              padding: '0.85rem 1.5rem', 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              borderRadius: 'var(--radius-md)', 
              color: '#ef4444', 
              cursor: 'pointer', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              width: '100%',
              textAlign: 'center',
              transition: 'var(--transition)',
              marginTop: '0.5rem'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Papers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading papers...</div>
      ) : papers.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaFileAlt style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No papers found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {papers.map((paper, idx) => (
            <div
              key={paper.id}
              className="tactile-card"
              style={{ 
                padding: '1.25rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1rem',
                borderRadius: 'var(--radius-md)',
                animation: `fadeIn 0.5s ease-out forwards ${idx * 0.05}s`,
                opacity: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0, fontSize: '1.2rem' }}>
                  <FaFileAlt />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '1.05rem' }}>{paper.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '999px', color: 'var(--primary)', fontWeight: 600 }}>{paper.className.startsWith('Class') || ['CUET', 'JEE', 'NEET'].includes(paper.className) ? paper.className : `Class ${paper.className}`}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(139,92,246,0.1)', borderRadius: '999px', color: 'var(--accent)', fontWeight: 600 }}>{paper.subject.name}</span>
                    {paper.chapter && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(16,185,129,0.1)', borderRadius: '999px', color: '#10b981', fontWeight: 600 }}>Ch {paper.chapter.number}: {paper.chapter.name}</span>}
                    {paper.year && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', opacity: 0.8 }}>{paper.year.year}</span>}
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {(paper.viewUrl || paper.downloadFile) && (
                  <a
                    href={`${getViewLink(paper.viewUrl || paper.downloadFile)}&title=${encodeURIComponent(paper.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary haptic-btn"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <FaEye /> View
                  </a>
                )}
                {!isAuthenticated ? (
                  <Link
                    href="/login"
                    className="btn-primary haptic-btn"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <FaDownload /> Login
                  </Link>
                ) : (paper.downloadFile || paper.viewUrl) ? (
                  <button
                    onClick={() => handleDownload(getDownloadLink(paper.downloadFile || paper.viewUrl), `${paper.title}.pdf`)}
                    className="btn-primary haptic-btn"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                  >
                    <FaDownload /> Download
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    <FaDownload /> Empty
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PapersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading page...</div>}>
      <PapersContent />
    </Suspense>
  );
}
