"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaBook, FaDownload, FaEye, FaFilter } from 'react-icons/fa';
import InteractionButtons from '@/components/InteractionButtons';

interface Note {
  id: string;
  title: string;
  className: string;
  subject: { id: string; name: string };
  viewUrl: string;
  downloadFile: string;
  likesCount: number;
  sharesCount: number;
  favoritesCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface Subject { id: string; name: string; }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/student/me');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const fetchMeta = async () => {
    const res = await fetch('/api/admin/subjects');
    if (res.ok) setSubjects(await res.json());
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    const res = await fetch(`/api/notes?${params.toString()}`);
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, [selectedClass, selectedSubject]);

  useEffect(() => { fetchMeta(); fetchAuth(); }, []);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Study <span className="text-gradient">Notes</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>Comprehensive notes for all levels. View free, download after login.</p>
      </div>

      {/* Class Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', '8', '9', '10', '11', '12', 'CUET', 'JEE', 'NEET'].map(cls => (
          <button
            key={cls}
            onClick={() => { setSelectedClass(cls); setSelectedSubject(''); }}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedClass === cls ? 'var(--primary)' : 'transparent', color: selectedClass === cls ? 'white' : 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
          >
            {cls === '' ? 'All Classes' : (['CUET', 'JEE', 'NEET'].includes(cls) ? cls : `Class ${cls}`)}
          </button>
        ))}
      </div>

      {/* Subject Filter */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}><FaFilter /><span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subject:</span></div>
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none', flex: 1, minWidth: '140px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(selectedClass || selectedSubject) && (
          <button onClick={() => { setSelectedClass(''); setSelectedSubject(''); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem' }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaBook style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No notes found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notes.map(note => (
            <div key={note.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                  <FaBook />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{note.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>{['CUET', 'JEE', 'NEET'].includes(note.className) ? note.className : `Class ${note.className}`}</span>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{note.subject.name}</span>
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
                  <a href={note.viewUrl || note.downloadFile} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaEye /> View
                  </a>
                )}
                {!isAuthenticated ? (
                  <Link href="/login" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaDownload /> Login to Download
                  </Link>
                ) : note.downloadFile ? (
                  <a href={note.downloadFile} download className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaDownload /> Download
                  </a>
                ) : (
                  <button disabled className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.5, cursor: 'not-allowed' }}>
                    <FaDownload /> No File Attached
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
