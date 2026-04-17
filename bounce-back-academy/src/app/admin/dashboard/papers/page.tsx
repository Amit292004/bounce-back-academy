"use client";

import { useState, useEffect } from 'react';
import { FaTrash, FaUpload, FaEye } from 'react-icons/fa';

export default function PapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('10');
  const [subjectId, setSubjectId] = useState('');
  const [yearId, setYearId] = useState('');
  const [phase, setPhase] = useState('');
  const [viewUrl, setViewUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/papers').then(res => res.json()),
      fetch('/api/admin/subjects').then(res => res.json()),
      fetch('/api/admin/years').then(res => res.json())
    ]).then(([papersData, subjectsData, yearsData]) => {
      setPapers(papersData);
      setSubjects(subjectsData);
      setYears(yearsData);
      if (subjectsData.length > 0) setSubjectId(subjectsData[0].id);
      if (yearsData.length > 0) setYearId(yearsData[0].id);
      setLoading(false);
    });
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !className || !subjectId || !yearId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error);

      const fileUrl = uploadData.url;

      await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          className,
          subjectId,
          yearId,
          phase: (className === '8' || className === '9') ? phase : undefined,
          viewUrl: viewUrl || fileUrl,
          downloadFile: fileUrl
        }),
      });

      const newPapers = await fetch('/api/admin/papers').then(res => res.json());
      setPapers(newPapers);

      setTitle('');
      setFile(null);
      setPhase('');
      setViewUrl('');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this paper?')) return;
    try {
      await fetch(`/api/admin/papers/${id}`, { method: 'DELETE' });
      setPapers(papers.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Question Papers</h1>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Upload New Paper</h2>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }}>
              {['8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Year</label>
            <select value={yearId} onChange={e => setYearId(e.target.value)} required
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }}>
              {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
          </div>

          {(className === '8' || className === '9') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Phase</label>
              <select value={phase} onChange={e => setPhase(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }}>
                <option value="">Select Phase</option>
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Google Drive View URL <span style={{ opacity: 0.5 }}>(optional — for inline preview)</span></label>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/.../view"
              value={viewUrl}
              onChange={e => setViewUrl(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label>Upload PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} required
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={uploading || subjects.length === 0 || years.length === 0}>
              {uploading ? 'Uploading...' : <><FaUpload /> Upload Paper</>}
            </button>
            {(subjects.length === 0 || years.length === 0) && (
              <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                You must create at least one Subject and one Year before uploading.
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Class</th>
              <th style={{ padding: '1rem' }}>Subject</th>
              <th style={{ padding: '1rem' }}>Year</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              <th style={{ padding: '1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {papers.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '1rem' }}>{p.title} {p.phase && `(${p.phase})`}</td>
                <td style={{ padding: '1rem' }}>{p.className}</td>
                <td style={{ padding: '1rem' }}>{p.subject.name}</td>
                <td style={{ padding: '1rem' }}>{p.year.year}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {(p.viewUrl || p.downloadFile) && (
                      <a
                        href={p.viewUrl || p.downloadFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View paper"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500,
                          textDecoration: 'none', transition: 'var(--transition)'
                        }}
                      >
                        <FaEye size={13} /> View
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Delete paper"
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}
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
