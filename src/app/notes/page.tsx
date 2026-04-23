"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBook, FaDownload, FaEye, FaFilter } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';
import { getDownloadLink, getViewLink, handleDownload } from '@/lib/utils';
import CustomSelect from '@/components/CustomSelect';

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

function NotesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
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
    const [subRes, chapRes] = await Promise.all([
      fetch('/api/admin/subjects'),
      fetch('/api/admin/chapters')
    ]);
    if (subRes.ok) setSubjects(await subRes.json());
    if (chapRes.ok) setChapters(await chapRes.json());
  };

  // On mount: fetch auth first, set default class, THEN allow notes fetch
  useEffect(() => {
    fetchMeta();
    (async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated);
          if (data.authenticated && data.class && !searchParams.get('class') && !selectedClass) {
            setSelectedClass(data.class);
          }
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedChapter) params.set('chapter', selectedChapter);
    const res = await fetch(`/api/notes?${params.toString()}`);
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, [selectedClass, selectedSubject, selectedChapter]);

  // Only fetch notes after auth check is done (so class filter is applied from the start)
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Study <span className="kinetic-text">Notes</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>Comprehensive notes for all levels. View free, download after login.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={() => handleClassSelect('')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: !selectedClass ? 'var(--primary)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)', fontSize: '0.875rem' }}
        >
          All Classes
        </button>
        {['8', '9', '10', '11', '12', 'CUET', 'JEE', 'NEET'].map(cls => (
          <button
            key={cls}
            onClick={() => handleClassSelect(cls)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedClass === cls ? 'var(--primary)' : 'transparent', color: selectedClass === cls ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)', fontSize: '0.875rem' }}
          >
            {['CUET', 'JEE', 'NEET'].includes(cls) ? cls : `Class ${cls}`}
          </button>
        ))}
      </div>

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
            onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); updateURL({ class: '', subject: '', chapter: '' }); }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              opacity: (selectedClass || selectedSubject || selectedChapter) ? 1 : 0.4,
              transition: 'var(--transition)',
              pointerEvents: (selectedClass || selectedSubject || selectedChapter) ? 'auto' : 'none'
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
        </div>

        {(selectedClass || selectedSubject || selectedChapter) && (
          <button
            onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedChapter(''); updateURL({ class: '', subject: '', chapter: '' }); }}
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
          >
            Reset All Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaBook style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No notes found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes.map((note, idx) => (
            <div 
              key={note.id} 
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
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0, fontSize: '1.2rem' }}>
                  <FaBook />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '1.05rem' }}>{note.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '999px', color: 'var(--primary)', fontWeight: 600 }}>{['CUET', 'JEE', 'NEET'].includes(note.className) ? note.className : `Class ${note.className}`}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(139,92,246,0.1)', borderRadius: '999px', color: 'var(--accent)', fontWeight: 600 }}>{note.subject.name}</span>
                    {note.chapter && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(16,185,129,0.1)', borderRadius: '999px', color: '#10b981', fontWeight: 600 }}>Ch {note.chapter.number}: {note.chapter.name}</span>
                    )}
                  </div>
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {(note.viewUrl || note.downloadFile) && (
                  <a href={`${getViewLink(note.viewUrl || note.downloadFile)}&title=${encodeURIComponent(note.title)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary haptic-btn" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }}>
                    <FaEye /> View
                  </a>
                )}
                {!isAuthenticated ? (
                  <Link href="/login" className="btn-primary haptic-btn" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }}>
                    <FaDownload /> Login
                  </Link>
                ) : (note.downloadFile || note.viewUrl) ? (
                  <button 
                    onClick={() => handleDownload(getDownloadLink(note.downloadFile || note.viewUrl), `${note.title}.pdf`)}
                    className="btn-primary haptic-btn" 
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                  >
                    <FaDownload /> Download
                  </button>
                ) : (
                  <button disabled className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', opacity: 0.5, cursor: 'not-allowed' }}>
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

export default function NotesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading page...</div>}>
      <NotesContent />
    </Suspense>
  );
}
