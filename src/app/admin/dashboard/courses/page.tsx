"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaTrash, FaPlus, FaUpload, FaEdit, FaSave, FaTimes, FaImage, FaBook, FaUsers, FaChalkboardTeacher, FaLayerGroup, FaExternalLinkAlt } from 'react-icons/fa';
import { logger } from '@/lib/logger';

interface Course {
  id: string;
  name: string;
  caption?: string;
  imageUrl?: string;
}

interface Stats {
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats>({ totalClasses: 0, totalSubjects: 0, totalStudents: 0 });
  const [newCourse, setNewCourse] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingNew, setUploadingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [coursesRes, subjectsRes, usersRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/subjects'),
        fetch('/api/admin/users'),
      ]);
      const [coursesData, subjectsData, usersData] = await Promise.all([
        coursesRes.json(),
        subjectsRes.json(),
        usersRes.json(),
      ]);
      setStats({
        totalClasses: Array.isArray(coursesData) ? coursesData.length : 0,
        totalSubjects: Array.isArray(subjectsData) ? subjectsData.length : 0,
        totalStudents: Array.isArray(usersData) ? usersData.length : 0,
      });
    } catch (err) {
      logger.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'courses');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url;
  };

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingNew(true);
    const url = await uploadFile(e.target.files[0]);
    if (url) setNewImageUrl(url);
    setUploadingNew(false);
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingEdit(true);
    const url = await uploadFile(e.target.files[0]);
    if (url) setEditImageUrl(url);
    setUploadingEdit(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim()) return;
    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourse, caption: newCaption, imageUrl: newImageUrl }),
      });
      setNewCourse('');
      setNewCaption('');
      setNewImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchCourses();
      fetchStats();
    } catch (err) {
      logger.error(err);
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await fetch(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, caption: editCaption, imageUrl: editImageUrl }),
      });
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      logger.error(err);
    }
  };

  const startEditing = (course: Course) => {
    setEditingId(course.id);
    setEditName(course.name);
    setEditCaption(course.caption || '');
    setEditImageUrl(course.imageUrl || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class/course?')) return;
    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
      fetchStats();
    } catch (err) {
      logger.error(err);
    }
  };

  const statCards = [
    { label: 'Total Classes', value: stats.totalClasses, icon: 'chalkboard', color: '#6366f1' },
    { label: 'Subjects', value: stats.totalSubjects, icon: 'book', color: '#10b981' },
    { label: 'Total Students', value: stats.totalStudents, icon: 'users', color: '#ec4899' },
    { label: 'Active Courses', value: courses.length, icon: 'layers', color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', width: '40px', height: '40px',
          border: '3px solid var(--surface-border)', borderTop: '3px solid var(--primary)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '1rem', opacity: 0.6 }}>Loading classes...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Courses / Classes</h1>

      {/* Stat Cards - matching Dashboard Overview style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="glass-panel"
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px ${stat.color}40`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
            }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `${stat.color}20`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon === 'chalkboard' && <FaChalkboardTeacher size={24} />}
              {stat.icon === 'book' && <FaBook size={24} />}
              {stat.icon === 'users' && <FaUsers size={24} />}
              {stat.icon === 'layers' && <FaLayerGroup size={24} />}
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ opacity: 0.8, fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Class */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FaPlus style={{ color: 'var(--primary)' }} /> Add New Course / Class
        </h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              placeholder="Class Name (e.g. Class 12 Commerce)"
              style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)' }}
              required
            />
            <input
              type="text"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Caption (optional description)"
              style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleNewImageUpload} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled={uploadingNew}>
              <FaUpload /> {uploadingNew ? 'Uploading...' : 'Upload Logo'}
            </button>
            {newImageUrl && <img src={newImageUrl} alt="preview" style={{ height: '40px', borderRadius: '6px', border: '1px solid var(--surface-border)' }} />}
            <button type="submit" className="btn-primary" style={{ marginLeft: 'auto' }}>
              <FaPlus /> Add Class
            </button>
          </div>
        </form>
      </div>

      {/* Classes Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>All Classes ({courses.length})</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem 1.5rem', width: '70px', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.65 }}>Logo</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.65 }}>Name & Caption</th>
              <th style={{ padding: '1rem 1.5rem', width: '160px', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.65 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                  <FaChalkboardTeacher size={32} style={{ display: 'block', margin: '0 auto 0.75rem' }} />
                  No classes found. Add your first class above.
                </td>
              </tr>
            ) : courses.map(course => (
              <tr
                key={course.id}
                style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-highlight)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
              >
                {editingId === course.id ? (
                  <>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageUpload} style={{ display: 'none' }} />
                      <div
                        onClick={() => editFileInputRef.current?.click()}
                        title="Click to change logo"
                        style={{ width: '44px', height: '44px', background: 'var(--surface-highlight)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed var(--primary)' }}
                      >
                        {uploadingEdit ? '...' : editImageUrl ? <img src={editImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaImage opacity={0.5} />}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--surface-highlight)', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--foreground)', fontWeight: 600 }} />
                      <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)} placeholder="Caption" style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button onClick={() => handleSaveEdit(course.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '6px', cursor: 'pointer', marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}><FaSave /> Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--surface-border)', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><FaTimes /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {course.imageUrl
                        ? <img src={course.imageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                        : <div style={{ width: '44px', height: '44px', background: 'var(--surface-highlight)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage opacity={0.4} /></div>
                      }
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{course.name}</div>
                      {course.caption && <div style={{ fontSize: '0.82rem', opacity: 0.65, marginTop: '0.2rem' }}>{course.caption}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <Link
                        href={`/class/${encodeURIComponent(course.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Preview student dashboard"
                        style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', marginRight: '0.25rem', transition: 'background 0.15s', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                      >
                        <FaExternalLinkAlt size={15} />
                      </Link>
                      <button
                        onClick={() => startEditing(course)}
                        title="Edit"
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', marginRight: '0.25rem', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                      >
                        <FaEdit size={17} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        title="Delete"
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                      >
                        <FaTrash size={17} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
