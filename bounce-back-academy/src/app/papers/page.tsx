"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFileAlt, FaDownload, FaEye, FaFilter } from 'react-icons/fa';

interface Paper {
  id: string;
  title: string;
  className: string;
  phase: string | null;
  subject: { id: string; name: string };
  year: { id: string; year: string };
  viewUrl: string;
  downloadFile: string;
}

interface Subject { id: string; name: string; }
interface Year { id: string; year: string; }

export default function PapersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchMeta = async () => {
    const [sRes, yRes] = await Promise.all([fetch('/api/admin/subjects'), fetch('/api/admin/years')]);
    if (sRes.ok) setSubjects(await sRes.json());
    if (yRes.ok) setYears(await yRes.json());
  };

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedYear) params.set('year', selectedYear);
    const res = await fetch(`/api/papers?${params.toString()}`);
    if (res.ok) setPapers(await res.json());
    setLoading(false);
  }, [selectedClass, selectedSubject, selectedYear]);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const handleClassSelect = (cls: string) => {
    setSelectedClass(cls === selectedClass ? '' : cls);
    setSelectedSubject('');
    setSelectedYear('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Question <span className="text-gradient">Papers</span>
        </h1>
        <p style={{ opacity: 0.7 }}>NBSE past papers available from 2016 onwards. View free, download after login.</p>
      </div>

      {/* Class Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={() => handleClassSelect('')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: !selectedClass ? 'var(--primary)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
        >
          All Classes
        </button>
        {[8, 9, 10, 11, 12].map(c => (
          <button
            key={c}
            onClick={() => handleClassSelect(String(c))}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid var(--surface-border)', background: selectedClass === String(c) ? 'var(--primary)' : 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, transition: 'var(--transition)' }}
          >
            Class {c}
          </button>
        ))}
      </div>

      {/* Dropdown Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}><FaFilter /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filters:</span></div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'rgba(30,41,59,0.9)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none', flex: 1, minWidth: '140px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'rgba(30,41,59,0.9)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none', flex: 1, minWidth: '120px' }}
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
        </select>

        {(selectedClass || selectedSubject || selectedYear) && (
          <button
            onClick={() => { setSelectedClass(''); setSelectedSubject(''); setSelectedYear(''); router.push('/papers'); }}
            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Papers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>Loading papers...</div>
      ) : papers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
          <FaFileAlt style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>No papers found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {papers.map(paper => (
            <div
              key={paper.id}
              className="glass-panel"
              style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <FaFileAlt />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{paper.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '999px', color: 'var(--primary)' }}>Class {paper.className}</span>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '999px', color: 'var(--accent)' }}>{paper.subject.name}</span>
                    <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', opacity: 0.8 }}>{paper.year.year}</span>
                    {paper.phase && <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', background: 'rgba(16,185,129,0.15)', borderRadius: '999px', color: 'var(--success)' }}>Phase {paper.phase}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {paper.viewUrl && (
                  <a
                    href={paper.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <FaEye /> View
                  </a>
                )}
                {paper.downloadFile ? (
                  <a
                    href={paper.downloadFile}
                    download
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <FaDownload /> Download
                  </a>
                ) : (
                  <Link
                    href="/login"
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <FaDownload /> Login to Download
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
