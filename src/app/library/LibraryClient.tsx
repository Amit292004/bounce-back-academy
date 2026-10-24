"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  Search,
  BookOpen,
  FileText,
  Video as VideoIcon,
  HelpCircle,
  Download,
  Eye,
  Play,
  X,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import PWVideoPlayer from '@/components/video/PWVideoPlayer';
import { handleDownload, getViewLink } from '@/lib/utils';

interface ResourceItem {
  id: string;
  title: string;
  type: 'NOTE' | 'PAPER' | 'VIDEO' | 'QUIZ';
  className: string;
  subject: string;
  chapter?: string;
  year?: string;
  viewUrl?: string;
  downloadUrl?: string;
  youtubeLink?: string;
  pdfUrl?: string | null;
  lectureNumber?: number;
  questionCount?: number;
  isFavorited?: boolean;
}

export default function LibraryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || 'all');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all');

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    notes: ResourceItem[];
    papers: ResourceItem[];
    videos: ResourceItem[];
    quizzes: ResourceItem[];
    totalCount: number;
  }>({
    notes: [],
    papers: [],
    videos: [],
    quizzes: [],
    totalCount: 0,
  });

  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  const [activeVideo, setActiveVideo] = useState<ResourceItem | null>(null);

  // Sync with URL
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') sp.set(k, v);
        else sp.delete(k);
      });
      router.push(`/library?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch subjects list for filter pills
  useEffect(() => {
    fetch('/api/admin/subjects')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubjectsList(data))
      .catch(() => {});
  }, []);

  // Fetch library data
  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set('q', query.trim());
      if (activeTab !== 'all') sp.set('type', activeTab);
      if (selectedClass !== 'all') sp.set('class', selectedClass);
      if (selectedSubject !== 'all') sp.set('subject', selectedSubject);

      const res = await fetch(`/api/library?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently retain existing results
    } finally {
      setLoading(false);
    }
  }, [query, activeTab, selectedClass, selectedSubject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLibrary();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLibrary]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    updateURL({ type: tabId });
  };

  const handleClassChange = (cls: string) => {
    const next = selectedClass === cls ? 'all' : cls;
    setSelectedClass(next);
    updateURL({ class: next });
  };

  const handleSubjectChange = (subId: string) => {
    const next = selectedSubject === subId ? 'all' : subId;
    setSelectedSubject(next);
    updateURL({ subject: next });
  };

  // Combine results according to tab
  const displayItems = (
    activeTab === 'notes'
      ? results.notes
      : activeTab === 'papers'
      ? results.papers
      : activeTab === 'videos'
      ? results.videos
      : activeTab === 'quizzes'
      ? results.quizzes
      : [...results.notes, ...results.papers, ...results.videos, ...results.quizzes]
  );

  const classesList = [
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
    'JEE',
    'NEET',
    'CUET',
    'Skills',
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <BookOpen size={14} />
          <span>Universal Study Library</span>
        </div>
        <h1 className={styles.title}>Study Library &amp; Resource Catalog</h1>
        <p className={styles.subtitle}>
          Search across all verified NBSE notes, previous year exam papers, high-yield video lectures,
          and practice quizzes in one place.
        </p>
      </div>

      {/* Unified Search & Control Bar */}
      <div className={styles.controlsBar}>
        <SearchInput
          value={query}
          onChange={(val) => {
            setQuery(val);
            updateURL({ q: val });
          }}
          placeholder="Search by topic, keyword, subject (e.g. Calculus, Optics, Chemistry, 2023)..."
        />

        {/* Content Type Tabs */}
        <Tabs
          variant="pill"
          activeId={activeTab}
          onChange={handleTabChange}
          items={[
            { id: 'all', label: 'All Resources', count: results.totalCount },
            { id: 'notes', label: 'Study Notes', count: results.notes.length },
            { id: 'papers', label: 'Question Papers', count: results.papers.length },
            { id: 'videos', label: 'Video Lectures', count: results.videos.length },
            { id: 'quizzes', label: 'Practice Quizzes', count: results.quizzes.length },
          ]}
        />

        {/* Class / Curriculum Filter Pills */}
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Level / Exam:</span>
          <div className={styles.pillsScroll}>
            <button
              onClick={() => handleClassChange('all')}
              className={`${styles.filterPill} ${selectedClass === 'all' ? styles.filterPillActive : ''}`}
            >
              All Levels
            </button>
            {classesList.map((cls) => (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                className={`${styles.filterPill} ${selectedClass === cls ? styles.filterPillActive : ''}`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        {subjectsList.length > 0 && (
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Subject:</span>
            <div className={styles.pillsScroll}>
              <button
                onClick={() => handleSubjectChange('all')}
                className={`${styles.filterPill} ${selectedSubject === 'all' ? styles.filterPillActive : ''}`}
              >
                All Subjects
              </button>
              {subjectsList.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`${styles.filterPill} ${selectedSubject === sub.id ? styles.filterPillActive : ''}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className={styles.resultsSummary}>
        <span>
          Showing {displayItems.length} {displayItems.length === 1 ? 'verified resource' : 'verified resources'}
          {query ? ` for "${query}"` : ''}
        </span>
        {(query || selectedClass !== 'all' || selectedSubject !== 'all' || activeTab !== 'all') && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedClass('all');
              setSelectedSubject('all');
              setActiveTab('all');
              router.push('/library');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Cards Grid / Skeletons / Empty State */}
      {loading ? (
        <div className={styles.resourceGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.resourceCard}>
              <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
              <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={14} style={{ marginBottom: 20 }} />
              <Skeleton width="100%" height={36} />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No study resources found"
          description="Try broadening your keywords or clearing the level and subject filters to explore all available material."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setSelectedClass('all');
                setSelectedSubject('all');
                setActiveTab('all');
                router.push('/library');
              }}
            >
              Reset Search Filters
            </Button>
          }
        />
      ) : (
        <div className={styles.resourceGrid}>
          {displayItems.map((item) => {
            const badgeVariant =
              item.type === 'NOTE'
                ? 'warning'
                : item.type === 'PAPER'
                ? 'success'
                : item.type === 'VIDEO'
                ? 'cyan'
                : 'purple';

            return (
              <div key={`${item.type}-${item.id}`} className={styles.resourceCard}>
                <div className={styles.cardHead}>
                  <Badge variant={badgeVariant} size="sm">
                    {item.type === 'NOTE'
                      ? 'Study Note'
                      : item.type === 'PAPER'
                      ? 'Question Paper'
                      : item.type === 'VIDEO'
                      ? 'Video Lecture'
                      : 'Quiz Test'}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {item.className}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{item.title}</h3>

                <div className={styles.cardMeta}>
                  <Badge variant="default" size="sm">{item.subject}</Badge>
                  {item.year && <Badge variant="default" size="sm">Year {item.year}</Badge>}
                  {item.chapter && <Badge variant="default" size="sm">{item.chapter}</Badge>}
                  {typeof item.questionCount === 'number' && (
                    <Badge variant="default" size="sm">{item.questionCount} Questions</Badge>
                  )}
                </div>

                <div className={styles.cardActions}>
                  {item.type === 'NOTE' && (
                    <>
                      <Button
                        href={getViewLink(item.viewUrl || '')}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={13} />}
                      >
                        Read Online
                      </Button>
                      {item.downloadUrl && (
                        <button
                          onClick={() => handleDownload(item.downloadUrl || '', item.title)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ededed',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </button>
                      )}
                    </>
                  )}

                  {item.type === 'PAPER' && (
                    <>
                      <Button
                        href={getViewLink(item.viewUrl || '')}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={13} />}
                      >
                        View Paper
                      </Button>
                      {item.downloadUrl && (
                        <button
                          onClick={() => handleDownload(item.downloadUrl || '', item.title)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ededed',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      )}
                    </>
                  )}

                  {item.type === 'VIDEO' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Play size={13} />}
                      onClick={() => setActiveVideo(item)}
                    >
                      Watch Lecture
                    </Button>
                  )}

                  {item.type === 'QUIZ' && (
                    <Button
                      href="/quiz"
                      variant="primary"
                      size="sm"
                      leftIcon={<Sparkles size={13} />}
                    >
                      Start Quiz
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PW Video Player Modal for Library Videos */}
      {activeVideo && activeVideo.youtubeLink && (
        <div className={styles.modalBackdrop} onClick={() => setActiveVideo(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,23,42,0.6)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#818cf8',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {activeVideo.className} · {activeVideo.subject}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ width: '100%', background: '#000' }}>
              <PWVideoPlayer
                youtubeUrl={activeVideo.youtubeLink}
                title={activeVideo.title}
                subtitle={`${activeVideo.className} · ${activeVideo.subject}`}
                pdfNotesUrl={activeVideo.pdfUrl}
                autoPlay={true}
                onBack={() => setActiveVideo(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
