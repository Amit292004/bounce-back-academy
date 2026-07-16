"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTrash, FaPlus, FaCog, FaChevronRight } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  number: number;
}

interface Quiz {
  id: string;
  title: string;
  className: string;
  subjectId?: string | null;
  subject?: Subject | null;
  chapterId?: string | null;
  chapter?: Chapter | null;
  _count: {
    questions: number;
  };
  createdAt: string;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newChapterId, setNewChapterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (newClass && newSubjectId) {
      fetchChapters(newClass, newSubjectId);
    } else {
      setChapters([]);
      setNewChapterId('');
    }
  }, [newClass, newSubjectId]);

  const fetchInitialData = async () => {
    try {
      const [qzRes, sbRes, clRes] = await Promise.all([
        fetch('/api/admin/quizzes'),
        fetch('/api/admin/subjects'),
        fetch('/api/admin/courses')
      ]);

      if (qzRes.ok) setQuizzes(await qzRes.json());
      if (sbRes.ok) {
        const subs = await sbRes.json();
        setSubjects(subs);
        if (subs.length > 0) setNewSubjectId(subs[0].id);
      }
      if (clRes.ok) {
        const cls = await clRes.json();
        setCourses(cls);
        if (cls.length > 0) setNewClass(cls[0].name);
      }
    } catch (err) {
      logger.error('Failed to fetch initial admin quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (cls: string, subId: string) => {
    try {
      const res = await fetch(`/api/admin/chapters?className=${cls}&subjectId=${subId}`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
        if (data.length > 0) {
          setNewChapterId(data[0].id);
        } else {
          setNewChapterId('');
        }
      }
    } catch (err) {
      logger.error('Failed to fetch chapters:', err);
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClass) return;

    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          className: newClass,
          subjectId: newSubjectId || null,
          chapterId: newChapterId || null
        })
      });

      if (res.ok) {
        setNewTitle('');
        // Reload quizzes list
        const qzRes = await fetch('/api/admin/quizzes');
        if (qzRes.ok) setQuizzes(await qzRes.json());
      }
    } catch (err) {
      logger.error('Failed to create quiz:', err);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz? All questions will be permanently deleted.')) return;

    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== id));
      }
    } catch (err) {
      logger.error('Failed to delete quiz:', err);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (selectedClassFilter === 'all') return true;
    const normalize = (name: string) => name.toLowerCase().replace('class', '').trim();
    return normalize(q.className) === normalize(selectedClassFilter);
  });

  if (loading) return <div>Loading quizzes dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Manage Quizzes & Tests</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedClassFilter('all')}
            className={selectedClassFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              border: '1px solid var(--surface-border)',
              cursor: 'pointer'
            }}
          >
            All Classes
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassFilter(c.name)}
              className={selectedClassFilter === c.name ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                border: '1px solid var(--surface-border)',
                cursor: 'pointer'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Quiz Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Create New Quiz</h2>
        <form onSubmit={handleAddQuiz} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Quiz Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Electric Current & Circuits Practice"
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
              }}
              required
            />
          </div>

          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Class</label>
            <select
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              {courses.length === 0 && <option value="">No Classes Configured</option>}
            </select>
          </div>

          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Subject</label>
            <select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
              }}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              {subjects.length === 0 && <option value="">No Subjects Configured</option>}
            </select>
          </div>

          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Chapter (Optional)</label>
            <select
              value={newChapterId}
              onChange={(e) => setNewChapterId(e.target.value)}
              style={{
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)'
              }}
            >
              <option value="">General (No Chapter)</option>
              {chapters.map(c => (
                <option key={c.id} value={c.id}>Ch {c.number}: {c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '46px' }}>
            <FaPlus /> Create Quiz
          </button>
        </form>
      </div>

      {/* Quizzes list table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem' }}>Class</th>
              <th style={{ padding: '1rem' }}>Subject</th>
              <th style={{ padding: '1rem' }}>Quiz Title</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Questions</th>
              <th style={{ padding: '1rem', width: '150px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizzes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No quizzes found.</td>
              </tr>
            ) : filteredQuizzes.map(quiz => (
              <tr key={quiz.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  {quiz.className.toLowerCase().includes('class') ? quiz.className : `Class ${quiz.className}`}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div>{quiz.subject?.name || 'General'}</div>
                  {quiz.chapter && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                      Ch {quiz.chapter.number}: {quiz.chapter.name}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{quiz.title}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {quiz._count.questions} questions
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Link
                      href={`/admin/dashboard/quizzes/${quiz.id}`}
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                        textDecoration: 'none', borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <FaCog /> Manage Questions <FaChevronRight size={10} />
                    </Link>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
