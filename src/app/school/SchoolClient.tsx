'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Video as VideoIcon,
  Search,
  Eye,
  Download,
  Play,
  X,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import PWVideoPlayer from '@/components/video/PWVideoPlayer';
import { getViewLink, handleDownload } from '@/lib/utils';

export interface SchoolResource {
  id: string;
  title: string;
  type: 'NOTE' | 'PAPER' | 'VIDEO';
  className: string;
  subjectName: string;
  subjectId?: string;
  chapterName?: string | null;
  year?: string | null;
  viewUrl?: string;
  downloadFile?: string;
  youtubeLink?: string;
  pdfUrl?: string | null;
}

export interface SchoolPremiumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  className: string | null;
}

export interface SubjectItem {
  id: string;
  name: string;
}

interface SchoolClientProps {
  initialClasses: string[];
  initialSubjects: SubjectItem[];
  allNotes: SchoolResource[];
  allPapers: SchoolResource[];
  allVideos: SchoolResource[];
  premiumItems?: SchoolPremiumItem[];
}

const SCHOOL_CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

// Helper to match class variants (e.g. "Class 10", "10", "10th")
function classMatches(itemClass: string, targetClass: string): boolean {
  if (!itemClass || !targetClass) return false;
  const rawTarget = targetClass.toLowerCase().replace(/^class\s*/i, '').trim();
  const rawItem = itemClass.toLowerCase().replace(/^class\s*/i, '').replace(/th$/, '').trim();
  return rawTarget === rawItem || itemClass.toLowerCase() === targetClass.toLowerCase();
}

function SchoolClientInner({
  initialClasses,
  initialSubjects,
  allNotes,
  allPapers,
  allVideos,
  premiumItems = [],
}: SchoolClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlClassParam = searchParams.get('class');
  const defaultClass = useMemo(() => {
    if (!urlClassParam) return 'Class 10';
    const found = SCHOOL_CLASSES.find(
      (c) => c.toLowerCase() === urlClassParam.toLowerCase() || c.replace('Class ', '') === urlClassParam
    );
    return found || 'Class 10';
  }, [urlClassParam]);

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get('subject') || 'all');
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'papers' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<SchoolResource | null>(null);

  const matchingPremiumCount = useMemo(() => {
    if (!premiumItems || premiumItems.length === 0) return 0;
    return premiumItems.filter(
      (p) => !p.className || classMatches(p.className, selectedClass)
    ).length;
  }, [premiumItems, selectedClass]);

  const handleClassSelect = (cls: string) => {
    setSelectedClass(cls);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('class', cls);
    router.replace(`/school?${sp.toString()}`, { scroll: false });
  };

  const handleSubjectSelect = (subName: string) => {
    setSelectedSubject(subName);
    const sp = new URLSearchParams(searchParams.toString());
    if (subName !== 'all') {
      sp.set('subject', subName);
    } else {
      sp.delete('subject');
    }
    router.replace(`/school?${sp.toString()}`, { scroll: false });
  };

  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filterList = (items: SchoolResource[]) =>
      items.filter((item) => {
        const matchesCls = classMatches(item.className, selectedClass);
        if (!matchesCls) return false;

        if (selectedSubject !== 'all') {
          if (item.subjectName.toLowerCase() !== selectedSubject.toLowerCase()) return false;
        }

        if (q) {
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSubject = item.subjectName.toLowerCase().includes(q);
          const matchChapter = item.chapterName?.toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchChapter) return false;
        }

        return true;
      });

    const notes = filterList(allNotes);
    const papers = filterList(allPapers);
    const videos = filterList(allVideos);

    return {
      notes,
      papers,
      videos,
      all: [...notes, ...papers, ...videos],
    };
  }, [allNotes, allPapers, allVideos, selectedClass, selectedSubject, searchQuery]);

  const displayList = useMemo(() => {
    if (activeTab === 'notes') return filteredResources.notes;
    if (activeTab === 'papers') return filteredResources.papers;
    if (activeTab === 'videos') return filteredResources.videos;
    return filteredResources.all;
  }, [activeTab, filteredResources]);

  const tabs = [
    { id: 'all', label: 'All Resources', count: filteredResources.all.length },
    { id: 'notes', label: 'Study Notes', count: filteredResources.notes.length },
    { id: 'papers', label: 'Question Papers', count: filteredResources.papers.length },
    { id: 'videos', label: 'Video Lectures', count: filteredResources.videos.length },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <GraduationCap size={15} />
          <span>NBSE Curriculum Hub</span>
        </div>
        <h1 className={styles.title}>School Learning (Classes 8–12)</h1>
        <p className={styles.subtitle}>
          Select your class below to browse verified Nagaland Board of School Education chapter notes,
          previous-year board exam question papers, video lectures, and syllabus revision guides.
        </p>
      </div>

      {/* Class Selector Grid */}
      <div className={styles.classGrid}>
        {SCHOOL_CLASSES.map((cls) => {
          const isActive = selectedClass === cls;
          const notesCount = allNotes.filter((n) => classMatches(n.className, cls)).length;
          const papersCount = allPapers.filter((p) => classMatches(p.className, cls)).length;
          const total = notesCount + papersCount;

          return (
            <button
              key={cls}
              type="button"
              onClick={() => handleClassSelect(cls)}
              className={`${styles.classCard} ${isActive ? styles.classCardActive : ''}`}
              aria-pressed={isActive}
            >
              <div className={styles.classCardTop}>
                <span className={styles.classBadge}>
                  {total > 0 ? `${total} Resources` : 'NBSE Syllabus'}
                </span>
                <GraduationCap size={18} color={isActive ? '#818cf8' : 'rgba(255,255,255,0.4)'} />
              </div>
              <div className={styles.className}>{cls}</div>
              <div className={styles.classDesc}>Nagaland Board Syllabus</div>
            </button>
          );
        })}
      </div>

      {/* Class Hub Deep-Dive Banner */}
      <div className={styles.classBanner}>
        <div className={styles.classBannerLeft}>
          <div className={styles.classBannerIcon}>
            <Layers size={22} />
          </div>
          <div>
            <div className={styles.classBannerTitle}>{selectedClass} Comprehensive Curriculum Dashboard</div>
            <div className={styles.classBannerSubtitle}>
              Access complete chapter playlists, MCQ practice quizzes, and full course syllabus for {selectedClass}.
            </div>
          </div>
        </div>
        <div className={styles.classBannerActions}>
          <Button href={`/class/${encodeURIComponent(selectedClass)}`} variant="primary" size="sm">
            <span>Open {selectedClass} Hub</span>
            <ArrowRight size={14} />
          </Button>
          {matchingPremiumCount > 0 && (
            <Button href={`/class/${encodeURIComponent(selectedClass)}?tab=premium`} variant="outline" size="sm">
              <Sparkles size={14} color="#f59e0b" />
              <span>Study Packages ({matchingPremiumCount})</span>
            </Button>
          )}
          <Button href={`/ask?class=${encodeURIComponent(selectedClass)}`} variant="secondary" size="sm">
            <Sparkles size={14} />
            <span>Ask AI Doubt</span>
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={`Search ${selectedClass} notes, papers, and video topics...`}
        />

        {/* Subject Filter Pills */}
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Subject:</span>
          <div className={styles.pillsScroll}>
            <button
              type="button"
              onClick={() => handleSubjectSelect('all')}
              className={`${styles.filterPill} ${selectedSubject === 'all' ? styles.filterPillActive : ''}`}
            >
              All Subjects
            </button>
            {initialSubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubjectSelect(sub.name)}
                className={`${styles.filterPill} ${selectedSubject.toLowerCase() === sub.name.toLowerCase() ? styles.filterPillActive : ''}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Type Tabs */}
        <Tabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          variant="pill"
        />
      </div>

      {/* Resource Display Grid */}
      {displayList.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title={`No ${activeTab === 'all' ? 'materials' : activeTab} found for ${selectedClass}`}
          description={
            searchQuery
              ? `No resources matched your search "${searchQuery}". Try a different keyword or clear filters.`
              : `Study materials for ${selectedClass} ${selectedSubject !== 'all' ? `(${selectedSubject})` : ''} are actively being uploaded by our educators. You can ask our AI Doubt Solver anytime.`
          }
          action={
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {searchQuery && (
                <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
              <Button href={`/ask?class=${encodeURIComponent(selectedClass)}`} variant="primary" size="sm">
                <Sparkles size={14} />
                <span>Ask Bounce Back AI</span>
              </Button>
              <Button href={`/class/${encodeURIComponent(selectedClass)}`} variant="secondary" size="sm">
                Browse Full Class Hub
              </Button>
            </div>
          }
        />
      ) : (
        <div className={styles.resourceGrid}>
          {displayList.map((res) => {
            const isNote = res.type === 'NOTE';
            const isPaper = res.type === 'PAPER';
            const isVideo = res.type === 'VIDEO';

            return (
              <div key={`${res.type}-${res.id}`} className={styles.resourceCard}>
                <div className={styles.cardHead}>
                  <div
                    className={styles.cardIcon}
                    style={{
                      background: isNote
                        ? 'rgba(99, 102, 241, 0.15)'
                        : isPaper
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(6, 182, 212, 0.15)',
                      color: isNote ? '#818cf8' : isPaper ? '#f87171' : '#22d3ee',
                    }}
                  >
                    {isNote && <FileText size={18} />}
                    {isPaper && <BookOpen size={18} />}
                    {isVideo && <VideoIcon size={18} />}
                  </div>
                  <Badge
                    variant={isNote ? 'primary' : isPaper ? 'danger' : 'cyan'}
                    size="sm"
                  >
                    {isNote ? 'Study Note' : isPaper ? 'Board Paper' : 'Video Lesson'}
                  </Badge>
                </div>

                <h3 className={styles.cardTitle}>{res.title}</h3>

                <div className={styles.cardMeta}>
                  <Badge variant="outline" size="sm">
                    {res.className}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {res.subjectName}
                  </Badge>
                  {res.year && (
                    <Badge variant="purple" size="sm">
                      Year {res.year}
                    </Badge>
                  )}
                  {res.chapterName && (
                    <Badge variant="warning" size="sm">
                      {res.chapterName}
                    </Badge>
                  )}
                </div>

                <div className={styles.cardActions}>
                  {isVideo ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveVideo(res)}
                      style={{ width: '100%' }}
                    >
                      <Play size={14} />
                      <span>Watch Lecture</span>
                    </Button>
                  ) : (
                    <>
                      {res.viewUrl && (
                        <Button
                          href={getViewLink(res.viewUrl)}
                          variant="secondary"
                          size="sm"
                          style={{ flex: 1 }}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Button>
                      )}
                      {res.downloadFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(res.downloadFile || '', res.title)}
                          style={{ flex: 1 }}
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && activeVideo.youtubeLink && (
        <div className={styles.modalBackdrop} onClick={() => setActiveVideo(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{activeVideo.title}</div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                aria-label="Close video player"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              <PWVideoPlayer
                video={{
                  id: activeVideo.id,
                  title: activeVideo.title,
                  youtubeLink: activeVideo.youtubeLink,
                  pdfUrl: activeVideo.pdfUrl || null,
                  lectureNumber: 1,
                  likesCount: 0,
                  sharesCount: 0,
                  favoritesCount: 0,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchoolClient(props: SchoolClientProps) {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.6 }}>Loading School Learning...</div>}>
      <SchoolClientInner {...props} />
    </Suspense>
  );
}
