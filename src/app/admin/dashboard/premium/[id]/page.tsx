"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaPlus, FaTrash, FaFilePdf, FaVideo,
  FaFileAlt, FaFolderPlus, FaFolder, FaChevronUp, FaChevronDown,
  FaBook, FaLayerGroup, FaBookOpen, FaTrophy, FaBullhorn, FaTag
} from 'react-icons/fa';
import { logger } from '@/lib/logger';

interface PremiumItem {
  id: string;
  title: string;
  type: string;
  price: number;
  isActive: boolean;
}

interface SubjectItem {
  id: string;
  name: string;
  order: number;
  modules?: ModuleItem[];
}

interface ModuleItem {
  id: string;
  title: string;
  order: number;
  subjectId?: string | null;
}

interface PremiumContent {
  id: string;
  contentType: string;
  title: string;
  description: string | null;
  viewUrl: string | null;
  downloadUrl: string | null;
  youtubeLink: string | null;
  sortOrder: number;
  moduleId: string | null;
  createdAt: string;
}

interface PremiumNotice {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
}

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  VIDEO: { label: 'Video Lecture', icon: <FaVideo />, color: '#ef4444' },
  NOTE: { label: 'Chapter Notes (PDF)', icon: <FaFilePdf />, color: '#6366f1' },
  DPP: { label: 'DPP / Practice Sheet', icon: <FaBookOpen />, color: '#10b981' },
  TEST: { label: 'Chapter Test / Quiz', icon: <FaTrophy />, color: '#f59e0b' },
  PAPER: { label: 'Question Paper / PYQ', icon: <FaFileAlt />, color: '#06b6d4' }
};

const NOTICE_TAG_COLORS: Record<string, { bg: string; color: string }> = {
  ANNOUNCEMENT: { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' },
  IMPORTANT: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
  SCHEDULE: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  EXAM: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
};

export default function AdminPremiumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [premiumItem, setPremiumItem] = useState<PremiumItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [contents, setContents] = useState<PremiumContent[]>([]);
  const [notices, setNotices] = useState<PremiumNotice[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject creation fields
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  // Module creation fields
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [moduleSubjectId, setModuleSubjectId] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  // Section toggle
  const [showStructureSection, setShowStructureSection] = useState(true);
  const [showNoticeSection, setShowNoticeSection] = useState(true);

  // Notice creation fields
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTag, setNoticeTag] = useState('ANNOUNCEMENT');
  const [addingNotice, setAddingNotice] = useState(false);

  // Content form fields
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [contentType, setContentType] = useState('VIDEO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewUrl, setViewUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (itemId) {
      fetchData();
    }
  }, [itemId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemRes, contentRes, moduleRes, subjectRes, noticeRes] = await Promise.all([
        fetch('/api/admin/premium'),
        fetch(`/api/admin/premium/${itemId}/content`),
        fetch(`/api/admin/premium/${itemId}/modules`),
        fetch(`/api/admin/premium/${itemId}/subjects`),
        fetch(`/api/admin/premium/${itemId}/notices`)
      ]);

      if (itemRes.ok) {
        const items = await itemRes.json();
        const found = items.find((i: PremiumItem) => i.id === itemId);
        if (found) setPremiumItem(found);
      }

      if (contentRes.ok) {
        setContents(await contentRes.json());
      }

      if (moduleRes.ok) {
        setModules(await moduleRes.json());
      }

      if (subjectRes.ok) {
        setSubjects(await subjectRes.json());
      }

      if (noticeRes.ok) {
        setNotices(await noticeRes.json());
      }
    } catch (err) {
      logger.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setSubjects(prev => [...prev, created]);
        setNewSubjectName('');
      } else {
        alert('Failed to create subject');
      }
    } catch (err) {
      logger.error(err);
      alert('Error creating subject');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject? Chapters inside will become unassigned.')) return;
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/subjects/${subjectId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        setModules(prev => prev.map(m => m.subjectId === subjectId ? { ...m, subjectId: null } : m));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newModuleTitle.trim(),
          subjectId: moduleSubjectId || null
        })
      });
      if (res.ok) {
        const created = await res.json();
        setModules(prev => [...prev, created]);
        setNewModuleTitle('');
      } else {
        alert('Failed to create chapter');
      }
    } catch (err) {
      logger.error(err);
      alert('Error creating chapter');
    } finally {
      setAddingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this chapter? Associated contents will become unassigned.')) return;
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/modules/${moduleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setModules(prev => prev.filter(m => m.id !== moduleId));
        setContents(prev => prev.map(c => c.moduleId === moduleId ? { ...c, moduleId: null } : c));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const openAddContentForModule = (modId: string, preselectType = 'VIDEO') => {
    setSelectedModuleId(modId);
    setContentType(preselectType);
    setShowForm(true);
    setSortOrder(String(contents.filter(c => c.moduleId === modId).length + 1));
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setViewUrl('');
    setDownloadUrl('');
    setYoutubeLink('');
    setSortOrder(String(contents.length));
    setContentType('VIDEO');
    setSelectedModuleId('');
    setShowForm(false);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentType) return;
    setAdding(true);
    try {
      const body: Record<string, string | number | null> = {
        contentType,
        title: title.trim(),
        description: description.trim(),
        sortOrder: parseInt(sortOrder) || contents.length,
        moduleId: selectedModuleId || null
      };
      if (contentType === 'VIDEO') {
        body.youtubeLink = youtubeLink.trim();
      } else {
        body.viewUrl = viewUrl.trim();
        body.downloadUrl = downloadUrl.trim();
      }

      const res = await fetch(`/api/admin/premium/${itemId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add content');
      }
    } catch (err) {
      logger.error(err);
      alert('Error adding content');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Delete this content item?')) return;
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/content/${contentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContents(prev => prev.filter(c => c.id !== contentId));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setAddingNotice(true);
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          tag: noticeTag
        })
      });
      if (res.ok) {
        const created = await res.json();
        setNotices(prev => [created, ...prev]);
        setNoticeTitle('');
        setNoticeContent('');
        setNoticeTag('ANNOUNCEMENT');
      } else {
        alert('Failed to publish notice');
      }
    } catch (err) {
      logger.error(err);
      alert('Error publishing notice');
    } finally {
      setAddingNotice(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`/api/admin/premium/${itemId}/notices/${noticeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotices(prev => prev.filter(n => n.id !== noticeId));
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const getTypeColor = (type: string) => CONTENT_TYPE_META[type]?.color || '#6366f1';
  const getTypeIcon = (type: string) => CONTENT_TYPE_META[type]?.icon || <FaFileAlt />;
  const getTypeLabel = (type: string) => CONTENT_TYPE_META[type]?.label || type;

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--surface-border)',
    background: 'var(--surface-highlight)',
    color: 'var(--foreground)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 700,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.4rem',
    display: 'block'
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.7 }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        Loading package details...
      </div>
    );
  }

  if (!premiumItem) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ opacity: 0.6, marginBottom: '1rem' }}>Premium package not found.</p>
        <button onClick={() => router.push('/admin/dashboard/premium')} className="btn-primary">
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/admin/dashboard/premium')}
          style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--foreground)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginTop: '0.2rem', whiteSpace: 'nowrap' }}
        >
          <FaArrowLeft size={12} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{premiumItem.title}</h1>
            <span style={{
              padding: '0.2rem 0.65rem', borderRadius: '100px',
              background: 'rgba(99,102,241,0.12)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
            }}>
              {premiumItem.type}
            </span>
          </div>
          <p style={{ opacity: 0.5, marginTop: '0.3rem', fontSize: '0.9rem' }}>
            ₹{premiumItem.price} · {subjects.length} Subjects · {modules.length} Chapters · {contents.length} Lessons & Materials · {notices.length} Notices
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) setSortOrder(String(contents.length + 1)); }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontSize: '0.9rem', padding: '0.65rem 1.25rem' }}
        >
          <FaPlus size={12} /> Add Content
        </button>
      </div>

      {/* 1. Structure Manager: Subjects & Chapters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaLayerGroup color="var(--primary)" /> 1. Course Subjects & Chapters Tree
          </h3>
          <button
            onClick={() => setShowStructureSection(!showStructureSection)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', opacity: 0.6 }}
          >
            {showStructureSection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {showStructureSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Create Subject */}
            <div style={{ background: 'var(--surface-highlight)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaBook color="var(--primary)" /> Add Subject / Track (e.g. Science, Mathematics, Python)
              </h4>
              <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Science, Mathematics, or Python Programming"
                  style={{ ...inputStyle, flex: 1 }}
                  required
                />
                <button
                  type="submit"
                  disabled={addingSubject}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', padding: '0.65rem 1rem' }}
                >
                  <FaPlus /> Create Subject
                </button>
              </form>
            </div>

            {/* Create Chapter */}
            <div style={{ background: 'var(--surface-highlight)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaFolder color="#f59e0b" /> Add Chapter / Module
              </h4>
              <form onSubmit={handleCreateModule} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {subjects.length > 0 && (
                  <select
                    value={moduleSubjectId}
                    onChange={e => setModuleSubjectId(e.target.value)}
                    style={{ ...inputStyle, width: '220px' }}
                  >
                    <option value="">-- Assign to Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. Chapter 1: Chemical Reactions or Python Fundamentals"
                  style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
                  required
                />
                <button
                  type="submit"
                  disabled={addingModule}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', padding: '0.65rem 1rem' }}
                >
                  <FaFolderPlus /> Create Chapter
                </button>
              </form>
            </div>

            {/* Hierarchy Tree with Direct Add Buttons for Video, Note, DPP, Test */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>
                Course Content Tree
              </h4>

              {subjects.length === 0 && modules.length === 0 ? (
                <p style={{ opacity: 0.5, fontSize: '0.85rem', margin: 0 }}>
                  No subjects or chapters created yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {subjects.map(s => {
                    const subjectModules = modules.filter(m => m.subjectId === s.id);
                    return (
                      <div
                        key={s.id}
                        style={{
                          borderRadius: '10px',
                          border: '1.5px solid var(--surface-border)',
                          overflow: 'hidden',
                          background: 'var(--surface)'
                        }}
                      >
                        {/* Subject Title Bar */}
                        <div style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: subjectModules.length > 0 ? '1px solid var(--surface-border)' : 'none'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaBook color="var(--primary)" size={14} />
                            <strong style={{ fontSize: '1rem' }}>{s.name}</strong>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                              ({subjectModules.length} chapters)
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubject(s.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                            title="Delete Subject"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>

                        {/* Chapters */}
                        {subjectModules.length > 0 ? (
                          <div style={{ padding: '0.65rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {subjectModules.map((m, mIdx) => {
                              const moduleContents = contents.filter(c => c.moduleId === m.id);
                              return (
                                <div
                                  key={m.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.4rem',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    background: 'var(--surface-highlight)',
                                    border: '1px solid var(--surface-border)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                      {mIdx + 1}. {m.title} ({moduleContents.length} items)
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => openAddContentForModule(m.id, 'VIDEO')}
                                        style={{ padding: '0.22rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      >
                                        <FaVideo size={10} /> + Video
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openAddContentForModule(m.id, 'NOTE')}
                                        style={{ padding: '0.22rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      >
                                        <FaFilePdf size={10} /> + Note
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openAddContentForModule(m.id, 'DPP')}
                                        style={{ padding: '0.22rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      >
                                        <FaBookOpen size={10} /> + DPP
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openAddContentForModule(m.id, 'TEST')}
                                        style={{ padding: '0.22rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      >
                                        <FaTrophy size={10} /> + Test
                                      </button>
                                      <button
                                        onClick={() => handleDeleteModule(m.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                        title="Delete Chapter"
                                      >
                                        <FaTrash size={11} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* List of contents under this module */}
                                  {moduleContents.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(99, 102, 241, 0.2)' }}>
                                      {moduleContents.map(c => (
                                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.85 }}>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ color: getTypeColor(c.contentType) }}>{getTypeIcon(c.contentType)}</span>
                                            {c.title}
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.6 }}>({getTypeLabel(c.contentType)})</span>
                                          </span>
                                          <button
                                            onClick={() => handleDeleteContent(c.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                          >
                                            <FaTrash size={9} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '0.75rem 1rem', opacity: 0.5, fontSize: '0.82rem' }}>
                            No chapters added to this subject yet.
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Direct / Unassigned Modules */}
                  {modules.filter(m => !m.subjectId || !subjects.some(s => s.id === m.subjectId)).length > 0 && (
                    <div style={{
                      borderRadius: '10px',
                      border: '1px dashed var(--surface-border)',
                      padding: '0.85rem 1rem'
                    }}>
                      <strong style={{ fontSize: '0.85rem', opacity: 0.7 }}>Standalone Course Chapters:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {modules.filter(m => !m.subjectId || !subjects.some(s => s.id === m.subjectId)).map((m, idx) => {
                          const moduleContents = contents.filter(c => c.moduleId === m.id);
                          return (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '6px',
                                background: 'var(--surface-highlight)',
                                fontSize: '0.85rem',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                              }}
                            >
                              <span>{idx + 1}. {m.title} ({moduleContents.length} items)</span>
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => openAddContentForModule(m.id, 'VIDEO')}
                                  style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  + Video
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAddContentForModule(m.id, 'NOTE')}
                                  style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  + Note
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAddContentForModule(m.id, 'DPP')}
                                  style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  + DPP
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAddContentForModule(m.id, 'TEST')}
                                  style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  + Test
                                </button>
                                <button
                                  onClick={() => handleDeleteModule(m.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                >
                                  <FaTrash size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Notice Board Manager */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBullhorn color="#f59e0b" /> 2. Send Notices & Batch Announcements ({notices.length})
          </h3>
          <button
            onClick={() => setShowNoticeSection(!showNoticeSection)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', opacity: 0.6 }}
          >
            {showNoticeSection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {showNoticeSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Create Notice Form */}
            <form onSubmit={handleCreateNotice} style={{ background: 'var(--surface-highlight)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Notice Title *</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={e => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Live Doubt Clearing Session on Sunday"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Priority Tag</label>
                  <select
                    value={noticeTag}
                    onChange={e => setNoticeTag(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="IMPORTANT">Important 🚨</option>
                    <option value="SCHEDULE">Schedule ⏰</option>
                    <option value="EXAM">Test / Exam 📝</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notice Details / Message *</label>
                <textarea
                  value={noticeContent}
                  onChange={e => setNoticeContent(e.target.value)}
                  placeholder="Type the full announcement message for enrolled students..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={addingNotice}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                >
                  <FaBullhorn /> {addingNotice ? 'Posting...' : 'Post Notice to Batch'}
                </button>
              </div>
            </form>

            {/* List of Notices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {notices.length === 0 ? (
                <p style={{ opacity: 0.5, fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>
                  No announcements posted yet. Post your first batch notice above!
                </p>
              ) : (
                notices.map(n => {
                  const tagStyle = NOTICE_TAG_COLORS[n.tag] || NOTICE_TAG_COLORS.ANNOUNCEMENT;
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '8px',
                        background: 'var(--surface)',
                        border: '1px solid var(--surface-border)',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: tagStyle.bg,
                            color: tagStyle.color,
                            fontSize: '0.7rem',
                            fontWeight: 800
                          }}>
                            {n.tag}
                          </span>
                          <strong style={{ fontSize: '0.95rem' }}>{n.title}</strong>
                          <span style={{ fontSize: '0.72rem', opacity: 0.4 }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>{n.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                        title="Delete Notice"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Add Content Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.3)', animation: 'fadeInUp 0.3s ease-out forwards' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus style={{ color: 'var(--primary)' }} /> 3. Publish Chapter Material
          </h2>
          <form onSubmit={handleAddContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Assign Module Dropdown */}
            {modules.length > 0 && (
              <div>
                <label style={labelStyle}>Assign to Chapter / Module *</label>
                <select
                  value={selectedModuleId}
                  onChange={e => setSelectedModuleId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- General / No Chapter --</option>
                  {modules.map((m) => {
                    const subjectName = subjects.find(s => s.id === m.subjectId)?.name;
                    return (
                      <option key={m.id} value={m.id}>
                        {subjectName ? `[${subjectName}] ` : ''}{m.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Material Type Selection */}
            <div>
              <label style={labelStyle}>Material Type</label>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {Object.entries(CONTENT_TYPE_META).map(([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    style={{
                      padding: '0.6rem 1.1rem',
                      borderRadius: '8px',
                      border: `2px solid ${contentType === type ? meta.color : 'var(--surface-border)'}`,
                      background: contentType === type ? `${meta.color}15` : 'transparent',
                      color: contentType === type ? meta.color : 'var(--foreground)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  contentType === 'VIDEO' ? 'e.g. Lecture 01: Getting Started & Syntax' :
                  contentType === 'NOTE' ? 'e.g. Complete Handwritten Formula Sheet' :
                  contentType === 'DPP' ? 'e.g. DPP 01: Daily Practice Problems with Answers' :
                  contentType === 'TEST' ? 'e.g. Chapter 1 Assessment Test' :
                  'e.g. Previous Year Solved Paper'
                }
                style={inputStyle}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary or instructions for students..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Dynamic URL Inputs depending on content type */}
            {contentType === 'VIDEO' ? (
              <div>
                <label style={labelStyle}>YouTube Video Link *</label>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={e => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  style={inputStyle}
                  required
                />
              </div>
            ) : contentType === 'TEST' ? (
              <>
                <div>
                  <label style={labelStyle}>Online Test Link / Google Form / Quiz URL *</label>
                  <input
                    type="url"
                    value={viewUrl}
                    onChange={e => setViewUrl(e.target.value)}
                    placeholder="https://forms.gle/... or https://..."
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>PDF Question Sheet Link (Optional)</label>
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={e => setDownloadUrl(e.target.value)}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>PDF View URL (Google Drive / Preview URL)</label>
                  <input
                    type="url"
                    value={viewUrl}
                    onChange={e => setViewUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Direct Download Link (Optional)</label>
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={e => setDownloadUrl(e.target.value)}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {/* Sort Order */}
            <div>
              <label style={labelStyle}>Lecture / Sort Order Number</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                style={{ ...inputStyle, width: '120px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={adding}
                className="btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                {adding ? 'Saving...' : 'Save & Publish Material'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--surface-border)',
                  color: 'var(--foreground)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Published Content List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>All Published Materials ({contents.length})</h2>
        {contents.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', opacity: 0.6 }}>
            <p>No materials yet. Click &quot;+ Video&quot;, &quot;+ Note&quot;, &quot;+ DPP&quot;, or &quot;+ Test&quot; on any chapter above!</p>
          </div>
        ) : (
          contents.map(c => {
            const mod = modules.find(m => m.id === c.moduleId);
            const sub = subjects.find(s => s.id === mod?.subjectId);
            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderLeft: `4px solid ${getTypeColor(c.contentType)}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    background: `${getTypeColor(c.contentType)}15`,
                    color: getTypeColor(c.contentType),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getTypeIcon(c.contentType)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{c.title}</strong>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem',
                        borderRadius: '4px', background: `${getTypeColor(c.contentType)}20`,
                        color: getTypeColor(c.contentType)
                      }}>
                        {getTypeLabel(c.contentType)}
                      </span>
                      {mod && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                          borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b'
                        }}>
                          📁 {sub ? `${sub.name} > ` : ''}{mod.title}
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p style={{ opacity: 0.6, fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{c.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteContent(c.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                  title="Delete Item"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
