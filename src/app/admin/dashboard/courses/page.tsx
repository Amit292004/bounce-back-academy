"use client";
import { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPlus, FaUpload, FaEdit, FaSave, FaTimes, FaImage } from 'react-icons/fa';
import { logger } from '@/lib/logger'

interface Course {
  id: string;
  name: string;
  caption?: string;
  imageUrl?: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
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
  }, []);

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
    if (!confirm('Are you sure you want to delete this class/course? Doing so will not delete the videos/notes but may hide them from filters.')) return;

    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch (err) {
      logger.error(err);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>Loading classes...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Courses / Classes</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Course / Class</h2>
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
              placeholder="Caption (e.g. Study materials & past papers)"
              style={{ flex: '1 1 200px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface-highlight)', color: 'var(--foreground)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleNewImageUpload} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled={uploadingNew}>
              <FaUpload /> {uploadingNew ? 'Uploading...' : 'Upload Logo'}
            </button>
            {newImageUrl && <img src={newImageUrl} alt="preview" style={{ height: '40px', borderRadius: '4px' }} />}
            <button type="submit" className="btn-primary" style={{ marginLeft: 'auto' }}>
              <FaPlus /> Add Class
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-highlight)' }}>
              <th style={{ padding: '1rem', width: '60px' }}>Logo</th>
              <th style={{ padding: '1rem' }}>Name & Caption</th>
              <th style={{ padding: '1rem', width: '150px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No courses found.</td>
              </tr>
            ) : courses.map(course => (
              <tr key={course.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                {editingId === course.id ? (
                  <>
                    <td style={{ padding: '1rem' }}>
                      <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageUpload} style={{ display: 'none' }} />
                      <div 
                        onClick={() => editFileInputRef.current?.click()} 
                        style={{ width: '40px', height: '40px', background: 'var(--surface-highlight)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
                      >
                        {uploadingEdit ? '...' : editImageUrl ? <img src={editImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaImage opacity={0.5} />}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' }} />
                      <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)} placeholder="Caption" style={{ display: 'block', width: '100%', padding: '0.5rem', background: 'var(--surface-highlight)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' }} />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleSaveEdit(course.id)} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}><FaSave /></button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--surface-border)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}><FaTimes /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '1rem' }}>
                      {course.imageUrl ? <img src={course.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', background: 'var(--surface-highlight)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage opacity={0.5} /></div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{course.name}</div>
                      {course.caption && <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{course.caption}</div>}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => startEditing(course)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}><FaEdit size={18} /></button>
                      <button onClick={() => handleDelete(course.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}><FaTrash size={18} /></button>
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
