"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaBook, FaExternalLinkAlt } from 'react-icons/fa';

interface Note {
  id: string;
  title: string;
  className: string;
  subject: { name: string };
  viewUrl: string;
  downloadFile: string;
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({ title: '', className: '8', subjectId: '', viewUrl: '', downloadFile: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const fetchAll = async () => {
    const [notesRes, subjectsRes] = await Promise.all([
      fetch('/api/admin/notes'),
      fetch('/api/admin/subjects'),
    ]);
    if (notesRes.ok) setNotes(await notesRes.json());
    if (subjectsRes.ok) setSubjects(await subjectsRes.json());
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setUploading(true);

    let downloadPath = '';

    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'notes');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setMessage(uploadData.error || 'File upload failed.');
        setUploading(false);
        return;
      }
      downloadPath = uploadData.url;
    }

    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          className: form.className,
          subjectId: form.subjectId,
          viewUrl: form.viewUrl,
          downloadFile: downloadPath || form.downloadFile,
        }),
      });
      if (res.ok) {
        setForm({ title: '', className: '8', subjectId: '', viewUrl: '', downloadFile: '' });
        setFile(null);
        setMessage('Note added successfully!');
        fetchAll();
      } else {
        const d = await res.json();
        setMessage(d.error || 'Failed to add note.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const filteredNotes = filterClass === 'All' ? notes : notes.filter(n => n.className === filterClass);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Manage Notes</h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Upload study notes by class and subject.</p>

      {/* Add Note Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Add New Note</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Title</label>
              <input name="title" type="text" placeholder="Note title" value={form.title} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Class</label>
              <select name="className" value={form.className} onChange={handleChange} required style={selectStyle}>
                {[8, 9, 10, 11, 12].map(c => <option key={c} value={String(c)}>Class {c}</option>)}
                <option value="CUET">CUET</option>
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Subject</label>
              <select name="subjectId" value={form.subjectId} onChange={handleChange} required style={selectStyle}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Google Drive / PDF Link</label>
              <input name="viewUrl" type="url" placeholder="https://drive.google.com/..." value={form.viewUrl} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>Upload PDF File</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.45rem 1rem' }} />
            </div>
          </div>

          {message && (
            <p style={{ color: message.includes('success') ? 'var(--success)' : 'var(--error)', fontSize: '0.875rem' }}>
              {message}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={uploading} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {uploading ? 'Uploading...' : 'Add Note'}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', '8', '9', '10', '11', '12'].map(cls => (
          <button
            key={cls}
            onClick={() => setFilterClass(cls)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid var(--surface-border)',
              background: filterClass === cls ? 'var(--primary)' : 'transparent',
              color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              transition: 'var(--transition)'
            }}
          >
            {cls === 'All' ? 'All Classes' : `Class ${cls}`}
          </button>
        ))}
      </div>

      {/* Notes Table */}
      {filteredNotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          <FaBook style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>No notes found. Add one above!</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                {['Title', 'Class', 'Subject', 'View', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map(note => (
                <tr key={note.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'var(--transition)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{note.title}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>Class {note.className}</td>
                  <td style={{ padding: '0.85rem 1rem', opacity: 0.8 }}>{note.subject?.name || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {note.viewUrl ? (
                      <a href={note.viewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <FaExternalLinkAlt /> View
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button onClick={() => handleDelete(note.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 1rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 1rem',
  background: 'rgba(30,41,59,0.9)', border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', outline: 'none',
};
