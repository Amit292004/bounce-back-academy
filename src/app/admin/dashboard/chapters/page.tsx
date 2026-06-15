"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { logger } from '@/lib/logger'

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('1');
  const [className, setClassName] = useState('10');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chaptersData, subjectsData, coursesData] = await Promise.all([
        fetch('/api/admin/chapters').then(res => res.json()),
        fetch('/api/admin/subjects').then(res => res.json()),
        fetch('/api/admin/courses').then(res => res.json())
      ]);
      // Sort chapters by number
      const sortedChapters = Array.isArray(chaptersData) 
        ? chaptersData.sort((a, b) => (a.number || 0) - (b.number || 0))
        : [];
      setChapters(sortedChapters);
      setSubjects(subjectsData);
      setCourses(coursesData);
      if (subjectsData.length > 0 && !subjectId) setSubjectId(subjectsData[0].id);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className || !subjectId) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, number, className, subjectId }),
      });
      if (res.ok) {
        setName('');
        setNumber(String(parseInt(number) + 1));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create chapter');
      }
    } catch (error) {
      logger.error('Error creating chapter:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter? All associated content will lose its chapter reference.')) return;
    try {
      const res = await fetch(`/api/admin/chapters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChapters(chapters.filter(c => c.id !== id));
      } else {
        const err = await res.json();
        alert(err.error + (err.details ? ': ' + err.details : ''));
      }
    } catch (error: any) {
      logger.error('Error deleting chapter:', error);
      alert('Error deleting chapter: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;



  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Chapters</h1>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add New Chapter</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 80px' }}>
            <label>No.</label>
            <input 
              type="number" 
              value={number} 
              onChange={e => setNumber(e.target.value)} 
              min="1"
              required 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '2 1 200px' }}>
            <label>Chapter Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Trigonometry"
              required 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 120px' }}>
            <label>Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)} style={selectStyle}>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 150px' }}>
            <label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required style={selectStyle}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={creating} style={{ height: '42px', flex: '1 1 100px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {creating ? 'Adding...' : <><FaPlus /> Add</>}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem', width: '80px' }}>No.</th>
              <th style={{ padding: '1rem' }}>Chapter Name</th>
              <th style={{ padding: '1rem' }}>Class</th>
              <th style={{ padding: '1rem' }}>Subject</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>{c.number}</td>
                <td style={{ padding: '1rem' }}>{c.name}</td>
                <td style={{ padding: '1rem' }}>Class {c.className}</td>
                <td style={{ padding: '1rem' }}>{c.subject?.name}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {chapters.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No chapters found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem',
  background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem',
  background: 'var(--background)', border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none',
};
