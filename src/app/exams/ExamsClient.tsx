'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  BookOpen,
  Sparkles,
  Trophy,
  FileText,
  Video as VideoIcon,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Target,
  GraduationCap,
  Calculator,
  Atom,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { getViewLink, handleDownload } from '@/lib/utils';

export interface ExamResource {
  id: string;
  title: string;
  type: 'NOTE' | 'PAPER' | 'VIDEO' | 'QUIZ';
  className: string;
  subjectName: string;
  year?: string | null;
  viewUrl?: string;
  downloadFile?: string;
  youtubeLink?: string;
}

interface ExamConfig {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  conductingBody: string;
  badgeVariant: 'danger' | 'warning' | 'primary' | 'cyan';
  dbCourseName: string;
  dbAliases: string[];
  subjects: string[];
  patternSummary: string;
  markingScheme: string;
  desc: string;
}

const EXAMS_DATA: ExamConfig[] = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    shortName: 'JEE Main',
    fullName: 'Joint Entrance Examination (Main)',
    conductingBody: 'National Testing Agency (NTA)',
    badgeVariant: 'danger',
    dbCourseName: 'JEE',
    dbAliases: ['JEE', 'JEE Main', 'JEE-Main'],
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    patternSummary: '90 Questions (30 each in P, C, M) | 3 Hours Duration | CBT Mode',
    markingScheme: '+4 for correct, -1 for incorrect answers',
    desc: 'National engineering entrance gateway for admission to NITs, IIITs, and other centrally funded technical institutions, and qualifying exam for JEE Advanced.',
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    shortName: 'JEE Adv.',
    fullName: 'Joint Entrance Examination (Advanced)',
    conductingBody: 'IIT Consortium',
    badgeVariant: 'danger',
    dbCourseName: 'JEE',
    dbAliases: ['JEE', 'JEE Advanced', 'JEE-Adv'],
    subjects: ['Physics', 'Chemistry', 'Mathematics (Higher Order)'],
    patternSummary: 'Two compulsory papers (Paper 1 & Paper 2) | Multi-correct & Numerical',
    markingScheme: 'Full, partial, and negative marking based on section type',
    desc: 'The benchmark examination for securing undergraduate engineering seats at the 23 Indian Institutes of Technology (IITs). High emphasis on multivariable calculus and analytical mechanics.',
  },
  {
    id: 'neet-ug',
    name: 'NEET UG',
    shortName: 'NEET UG',
    fullName: 'National Eligibility cum Entrance Test (Undergraduate)',
    conductingBody: 'National Testing Agency (NTA)',
    badgeVariant: 'danger',
    dbCourseName: 'NEET',
    dbAliases: ['NEET', 'NEET UG', 'NEET-UG'],
    subjects: ['Physics', 'Chemistry', 'Biology (Botany & Zoology)'],
    patternSummary: '200 Questions (180 to be attempted) | 720 Total Marks | Pen & Paper',
    markingScheme: '+4 for correct, -1 for incorrect answers',
    desc: 'Single unified national entrance test for MBBS, BDS, BAMS, BHMS, and AYUSH undergraduate medical admissions across all government and private institutions in India.',
  },
  {
    id: 'cuet',
    name: 'CUET UG',
    shortName: 'CUET',
    fullName: 'Common University Entrance Test (UG)',
    conductingBody: 'National Testing Agency (NTA)',
    badgeVariant: 'warning',
    dbCourseName: 'CUET',
    dbAliases: ['CUET', 'CUET UG', 'CUET-UG'],
    subjects: ['Language Test', 'Domain Subjects (Commerce / Arts / Science)', 'General Test'],
    patternSummary: 'Computer-Based Test (CBT) | Objective Type MCQs | Multiple Slots',
    markingScheme: '+5 for correct, -1 for incorrect answers',
    desc: 'Standardized entrance examination for admission into undergraduate programs across all Central Universities (including DU, BHU, JNU) and participating state and private universities.',
  },
];

export interface ExamPremiumItem {
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

interface ExamsClientProps {
  allNotes: ExamResource[];
  allPapers: ExamResource[];
  allVideos: ExamResource[];
  premiumItems?: ExamPremiumItem[];
}

function ExamsClientInner({
  allNotes,
  allPapers,
  allVideos,
  premiumItems = [],
}: ExamsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlExamParam = searchParams.get('exam') || searchParams.get('tab');
  const initialExam = useMemo(() => {
    if (!urlExamParam) return EXAMS_DATA[0];
    const found = EXAMS_DATA.find(
      (e) =>
        e.id === urlExamParam.toLowerCase() ||
        e.shortName.toLowerCase() === urlExamParam.toLowerCase() ||
        e.dbCourseName.toLowerCase() === urlExamParam.toLowerCase()
    );
    return found || EXAMS_DATA[0];
  }, [urlExamParam]);

  const [selectedExam, setSelectedExam] = useState<ExamConfig>(initialExam);
  const [activeTab, setActiveTab] = useState<'all' | 'papers' | 'notes' | 'videos'>('all');

  const matchingPremiumCount = useMemo(() => {
    if (!premiumItems || premiumItems.length === 0) return 0;
    return premiumItems.filter((p) => {
      if (!p.className) return false;
      const lower = p.className.toLowerCase();
      return selectedExam.dbAliases.some((alias) => lower.includes(alias.toLowerCase()));
    }).length;
  }, [premiumItems, selectedExam]);

  const handleSelectExam = (exam: ExamConfig) => {
    setSelectedExam(exam);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('exam', exam.id);
    router.replace(`/exams?${sp.toString()}`, { scroll: false });
  };

  // Match resources from DB
  const examResources = useMemo(() => {
    const isMatch = (clsName: string) => {
      const lower = clsName.toLowerCase();
      return selectedExam.dbAliases.some((alias) => lower.includes(alias.toLowerCase()));
    };

    const notes = allNotes.filter((n) => isMatch(n.className));
    const papers = allPapers.filter((p) => isMatch(p.className));
    const videos = allVideos.filter((v) => isMatch(v.className));

    return {
      notes,
      papers,
      videos,
      all: [...notes, ...papers, ...videos],
    };
  }, [allNotes, allPapers, allVideos, selectedExam]);

  const displayList = useMemo(() => {
    if (activeTab === 'notes') return examResources.notes;
    if (activeTab === 'papers') return examResources.papers;
    if (activeTab === 'videos') return examResources.videos;
    return examResources.all;
  }, [activeTab, examResources]);

  const resourceTabs = [
    { id: 'all', label: 'All Exam Resources', count: examResources.all.length },
    { id: 'papers', label: 'Past Papers & Mocks', count: examResources.papers.length },
    { id: 'notes', label: 'Formula & Notes', count: examResources.notes.length },
    { id: 'videos', label: 'Video Lectures', count: examResources.videos.length },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Target size={15} />
          <span>National Entrance Hub</span>
        </div>
        <h1 className={styles.title}>Competitive Exam Preparation</h1>
        <p className={styles.subtitle}>
          Dedicated preparation tracks for JEE Main, JEE Advanced, NEET UG, and CUET.
          Access syllabus guides, official mock tests, AI-assisted problem derivations, and verified practice papers.
        </p>
      </div>

      {/* 4 Dedicated Exam Cards */}
      <div className={styles.examGrid}>
        {EXAMS_DATA.map((exam) => {
          const isActive = selectedExam.id === exam.id;
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => handleSelectExam(exam)}
              className={`${styles.examCard} ${isActive ? styles.examCardActive : ''}`}
              aria-pressed={isActive}
            >
              <div className={styles.examCardTop}>
                <span className={styles.examBadge}>{exam.conductingBody}</span>
                <Target size={18} color={isActive ? '#ef4444' : 'rgba(255,255,255,0.4)'} />
              </div>
              <div className={styles.examName}>{exam.name}</div>
              <div className={styles.examSubtitle}>{exam.fullName}</div>
              <div className={styles.examTags}>
                {exam.subjects.map((s) => (
                  <Badge key={s} variant="outline" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Exam Showcase Banner */}
      <div className={styles.showcaseBanner}>
        <div className={styles.showcaseTop}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Badge variant={selectedExam.badgeVariant} size="sm">
                Target Exam: {selectedExam.shortName}
              </Badge>
              <Badge variant="outline" size="sm">
                {selectedExam.conductingBody}
              </Badge>
            </div>
            <h2 className={styles.showcaseTitle}>{selectedExam.fullName}</h2>
            <p className={styles.showcaseDesc}>{selectedExam.desc}</p>
          </div>

          <div className={styles.showcaseActions}>
            <Button
              href={`/ask?exam=${encodeURIComponent(selectedExam.shortName)}`}
              variant="primary"
              size="sm"
            >
              <Sparkles size={14} />
              <span>Ask {selectedExam.shortName} Doubt</span>
            </Button>
            <Button
              href={`/quiz?class=${encodeURIComponent(selectedExam.dbCourseName)}`}
              variant="secondary"
              size="sm"
            >
              <Trophy size={14} />
              <span>Take Mock Quiz</span>
            </Button>
            <Button
              href={`/class/${encodeURIComponent(selectedExam.dbCourseName)}`}
              variant="outline"
              size="sm"
            >
              <span>Open {selectedExam.dbCourseName} Hub</span>
              <ArrowRight size={14} />
            </Button>
            {matchingPremiumCount > 0 && (
              <Button
                href={`/class/${encodeURIComponent(selectedExam.dbCourseName)}?tab=premium`}
                variant="outline"
                size="sm"
              >
                <Sparkles size={14} color="#f59e0b" />
                <span>Study Packages ({matchingPremiumCount})</span>
              </Button>
            )}
          </div>
        </div>

        <div className={styles.examDetailsGrid}>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Subjects Tested</span>
            <span className={styles.detailValue}>{selectedExam.subjects.join(' • ')}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Exam Pattern</span>
            <span className={styles.detailValue}>{selectedExam.patternSummary}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Marking Scheme</span>
            <span className={styles.detailValue}>{selectedExam.markingScheme}</span>
          </div>
        </div>
      </div>

      {/* Quick Preparation Tools for Selected Exam */}
      <div className={styles.toolsRow}>
        <Link
          href={`/ask?exam=${encodeURIComponent(selectedExam.shortName)}`}
          className={styles.toolCard}
        >
          <div
            className={styles.toolIcon}
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
          >
            <Sparkles size={20} />
          </div>
          <div className={styles.toolContent}>
            <div className={styles.toolTitle}>
              <span>AI Problem Derivations</span>
              <ArrowRight size={14} />
            </div>
            <div className={styles.toolDesc}>
              Get step-by-step mathematical solutions and conceptual physical intuition in English or Hinglish.
            </div>
          </div>
        </Link>

        <Link
          href={`/quiz?class=${encodeURIComponent(selectedExam.dbCourseName)}`}
          className={styles.toolCard}
        >
          <div
            className={styles.toolIcon}
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
          >
            <Trophy size={20} />
          </div>
          <div className={styles.toolContent}>
            <div className={styles.toolTitle}>
              <span>Interactive Mock Quizzes</span>
              <ArrowRight size={14} />
            </div>
            <div className={styles.toolDesc}>
              Simulate timed tests with instant MCQ evaluation, question review, and syllabus alignment.
            </div>
          </div>
        </Link>

        <Link
          href={`/class/${encodeURIComponent(selectedExam.dbCourseName)}`}
          className={styles.toolCard}
        >
          <div
            className={styles.toolIcon}
            style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
          >
            <BookOpen size={20} />
          </div>
          <div className={styles.toolContent}>
            <div className={styles.toolTitle}>
              <span>{selectedExam.shortName} Subject Vault</span>
              <ArrowRight size={14} />
            </div>
            <div className={styles.toolDesc}>
              Deep dive into individual subject chapters and curated lecture modules for {selectedExam.shortName}.
            </div>
          </div>
        </Link>
      </div>

      {/* Database Content Section */}
      <div className={styles.resourceSection}>
        <div className={styles.resourceSectionHead}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Available Study Materials &amp; Papers
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              Materials currently published for {selectedExam.name}
            </p>
          </div>

          <Tabs
            items={resourceTabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            variant="pill"
          />
        </div>

        {displayList.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} />}
            title={`No verified archives currently published for ${selectedExam.name}`}
            description={`Our faculty is currently uploading and verifying authentic ${selectedExam.name} papers and formula sheets. You can immediately use our AI Tutor for step-by-step problem derivations or attempt adaptive mock quizzes below.`}
            action={
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  href={`/ask?exam=${encodeURIComponent(selectedExam.shortName)}`}
                  variant="primary"
                  size="sm"
                >
                  <Sparkles size={14} />
                  <span>Launch AI Doubt Solver</span>
                </Button>
                <Button
                  href={`/quiz?class=${encodeURIComponent(selectedExam.dbCourseName)}`}
                  variant="secondary"
                  size="sm"
                >
                  <Trophy size={14} />
                  <span>Practice Mock Quiz</span>
                </Button>
                <Button
                  href={`/class/${encodeURIComponent(selectedExam.dbCourseName)}`}
                  variant="outline"
                  size="sm"
                >
                  Explore {selectedExam.shortName} Hub
                </Button>
              </div>
            }
          />
        ) : (
          <div className={styles.resourceGrid}>
            {displayList.map((res) => (
              <div key={`${res.type}-${res.id}`} className={styles.resourceCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <Badge variant="danger" size="sm">
                    {res.type === 'PAPER' ? 'Mock Paper' : res.type === 'NOTE' ? 'Study Note' : 'Video Lesson'}
                  </Badge>
                  {res.year && (
                    <Badge variant="purple" size="sm">
                      {res.year}
                    </Badge>
                  )}
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  {res.title}
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                  <Badge variant="outline" size="sm">
                    {res.subjectName}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {res.className}
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                  {res.viewUrl && (
                    <Button href={getViewLink(res.viewUrl)} variant="secondary" size="sm" style={{ flex: 1 }}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamsClient(props: ExamsClientProps) {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.6 }}>Loading Competitive Exams...</div>}>
      <ExamsClientInner {...props} />
    </Suspense>
  );
}
