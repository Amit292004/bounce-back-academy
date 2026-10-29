"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import PWVideoPlayer from "@/components/video/PWVideoPlayer";
import {
  FileText,
  BookOpen,
  Video as VideoIcon,
  CheckCircle2,
  Play,
  Award,
  ChevronRight,
  BookOpenCheck,
  X,
  AlertCircle,
  Sparkles,
  Trophy,
  Download,
  ChevronLeft,
  Star,
  Heart,
  PlaySquare,
  CheckCheck,
  Layers,
  GraduationCap,
  Bell,
} from "lucide-react";

import { handleDownload } from "@/lib/utils";
import ClassSwitcherModal from "@/components/layout/ClassSwitcherModal";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { FaCreditCard, FaMobileAlt, FaShieldAlt, FaChevronRight } from "react-icons/fa";
import {
  LearningWorkspaceHeader,
  WorkspaceTab,
  SubjectCard,
  PremiumResourceCard,
  PremiumItemData,
  NoticeCard,
  AnnouncementItem,
} from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chapter {
  id: string;
  name: string;
  number: number;
}

interface Note {
  id: string;
  title: string;
  viewUrl: string;
  downloadFile: string;
  chapterId: string | null;
}

interface QuestionPaper {
  id: string;
  title: string;
  viewUrl: string;
  downloadFile: string;
  chapterId: string | null;
  year?: { year: string } | null;
}

interface VideoType {
  id: string;
  title: string;
  youtubeLink: string;
  pdfUrl: string | null;
  chapterId: string | null;
  lectureNumber: number;
}

interface QuizQuestion {
  id: string;
  questionText: string | null;
  imageUrl: string | null;
  type: string;
  options: string | null;
  answer: string;
  explanation: string | null;
  timeLimit: number;
}

interface Quiz {
  id: string;
  title: string;
  chapterId: string | null;
  questions: QuizQuestion[];
}

interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
  notes: Note[];
  papers: QuestionPaper[];
  videos: VideoType[];
  quizzes: Quiz[];
}

interface Props {
  className: string;
  displayTitle: string;
  subjects: Subject[];
  announcements: AnnouncementItem[];
  premiumItems: PremiumItemData[];
}

// ─── VideoThumbnail Component ─────────────────────────────────────────────────

const VideoThumbnail = ({ src, alt }: { src: string | null; alt: string }) => {
  const [isError, setIsError] = useState(false);
  if (isError || !src) {
    return (
      <div className={styles.videoThumbFallback}>
        <Play size={20} fill="white" color="white" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={styles.videoThumbImg}
      onError={() => setIsError(true)}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClassDashboard({
  className,
  displayTitle,
  subjects: propSubjects,
  announcements: propAnnouncements,
  premiumItems: propPremiumItems,
}: Props) {
  const subjects = useMemo(() => propSubjects || [], [propSubjects]);
  const announcements = useMemo(() => propAnnouncements || [], [propAnnouncements]);

  // Main navigation tabs
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "premium" || tabParam === "study" || tabParam === "notices" || tabParam === "home") {
      setActiveTab(tabParam as WorkspaceTab);
    }
  }, [searchParams]);

  // Study drill-down
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [classroomTab, setClassroomTab] = useState<"videos" | "notes" | "practice" | "quiz">("videos");

  // Premium filtering & states
  const [premiumFilter, setPremiumFilter] = useState<"all" | "NOTE" | "PYQ" | "COURSE">("all");
  const [livePremiumItems, setLivePremiumItems] = useState<PremiumItemData[]>([]);
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<any | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [payTab, setPayTab] = useState<'card' | 'upi'>('card');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loaderMessage, setLoaderMessage] = useState('Securing Gateway Connection...');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Modals
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; viewUrl: string; downloadUrl: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Progress
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Favorites
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Recent Video
  const [recentVideo, setRecentVideo] = useState<{ video: VideoType; subjectId: string; subjectName: string; } | null>(null);

  const fetchLivePremium = async () => {
    try {
      const res = await fetch('/api/premium');
      if (res.ok) {
        const data = await res.json();
        setLivePremiumItems(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLivePremium();
  }, []);

  // Deduplicate and structure premium items
  const { curriculumItems, skillRecommendations } = useMemo(() => {
    const source = livePremiumItems.length > 0 ? livePremiumItems : (propPremiumItems as PremiumItemData[]);
    
    // Deduplicate by normalized title to prevent identical courses showing up repeatedly
    const seenTitles = new Set<string>();
    const uniqueItems: PremiumItemData[] = [];

    for (const item of source) {
      const normTitle = (item.title || "").trim().toLowerCase();
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        uniqueItems.push(item);
      }
    }

    const norm = (name: string) => name.toLowerCase().replace('class', '').trim();
    const currentNorm = norm(className);

    // Primary: specifically targeted to this class
    const curr = uniqueItems.filter((item) => {
      if (!item.className) return false;
      return norm(item.className) === currentNorm;
    });

    // Secondary / Skill recommendations: global / skill courses without a specific class constraint
    const skills = uniqueItems.filter((item) => {
      if (!item.className) return true;
      const lower = item.className.toLowerCase();
      return lower.includes('skill') || lower.includes('practical') || lower.includes('ai');
    });

    return { curriculumItems: curr, skillRecommendations: skills };
  }, [livePremiumItems, propPremiumItems, className]);

  // Combined filtered items based on active category
  const filteredCurriculumItems = useMemo(() => {
    if (premiumFilter === "all") return curriculumItems;
    if (premiumFilter === "COURSE") {
      return curriculumItems.filter(i => i.type === "COURSE" || i.type === "LECTURE");
    }
    return curriculumItems.filter(i => i.type === premiumFilter);
  }, [curriculumItems, premiumFilter]);

  const filteredSkillItems = useMemo(() => {
    if (premiumFilter === "all") return skillRecommendations;
    if (premiumFilter === "COURSE") {
      return skillRecommendations.filter(i => i.type === "COURSE" || i.type === "LECTURE");
    }
    return skillRecommendations.filter(i => i.type === premiumFilter);
  }, [skillRecommendations, premiumFilter]);

  // Overall display premium items for badges and counts
  const displayPremiumItems = useMemo(() => {
    return [...curriculumItems, ...skillRecommendations];
  }, [curriculumItems, skillRecommendations]);

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Cashfree) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleOpenPremiumItem = async (item: any) => {
    if (item.unlocked) {
      window.location.href = `/premium/${item.id}`;
      return;
    } else {
      setIsPurchasing(true);
      try {
        const res = await fetch('/api/premium/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ premiumItemId: item.id })
        });

        if (!res.ok) {
          const data = await res.json();
          if (res.status === 401) {
            alert('Please sign in to purchase premium courses.');
            window.location.href = '/login';
            return;
          }
          alert(data.error || 'Failed to initiate purchase.');
          return;
        }

        const orderData = await res.json();

        if (orderData.alreadyUnlocked) {
          fetchLivePremium();
          handleOpenPremiumItem({ ...item, unlocked: true });
          return;
        }

        if (orderData.mode === 'cashfree') {
          const loaded = await loadCashfreeScript();
          if (!loaded) { alert('Failed to load Cashfree payment SDK.'); return; }

          const cashfree = new (window as any).Cashfree({
            mode: orderData.environment || 'production'
          });

          cashfree.checkout({
            paymentSessionId: orderData.paymentSessionId,
            redirectTarget: '_self'
          });
        } else {
          setCheckoutItem(item);
          setCheckoutStep('details');
          setCardNumber(''); setCardExpiry(''); setCardCvv(''); setUpiId('');
        }
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;

    setCheckoutStep('processing');
    setLoaderMessage('Securing Gateway Connection...');
    setTimeout(() => { setLoaderMessage('Verifying simulated funds...'); }, 1000);
    setTimeout(() => { setLoaderMessage('Authorizing purchase transaction...'); }, 2200);
    setTimeout(async () => {
      const res = await fetch('/api/premium/purchase/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumItemId: checkoutItem.id, simulatedConfirm: true })
      });
      if (res.ok) {
        setCheckoutStep('success');
        setLivePremiumItems(prev => prev.map(item => item.id === checkoutItem.id ? { ...item, unlocked: true } : item));
        try {
          const freshRes = await fetch('/api/premium');
          if (freshRes.ok) setLivePremiumItems(await freshRes.json());
        } catch {}
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to complete payment.');
        setCheckoutStep('details');
      }
    }, 3700);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`recentVideo_${className}`);
      if (stored) {
        setRecentVideo(JSON.parse(stored));
      }
    } catch (e) {}
  }, [className]);

  const handleVideoClick = (video: VideoType) => {
    setSelectedVideo(video);
    if (selectedSubjectId) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      if (subject) {
        const data = { video, subjectId: subject.id, subjectName: subject.name };
        setRecentVideo(data);
        try {
          localStorage.setItem(`recentVideo_${className}`, JSON.stringify(data));
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const res = await fetch('/api/interactions/favorites');
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>();
          data.videos?.forEach((v: any) => ids.add(v.id));
          data.notes?.forEach((n: any) => ids.add(n.id));
          data.papers?.forEach((p: any) => ids.add(p.id));
          data.quizzes?.forEach((q: any) => ids.add(q.id));
          setFavoritedIds(ids);
        }
      } catch {}
    };
    fetchFavs();
  }, []);

  const toggleFavorite = async (id: string, type: 'VIDEO' | 'NOTE' | 'PAPER' | 'QUIZ', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const updated = new Set(favoritedIds);
    const isFav = updated.has(id);
    if (isFav) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setFavoritedIds(updated);

    try {
      const res = await fetch('/api/interactions/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id, targetType: type })
      });
      if (res.status === 401) {
        alert('Please login to add to favorites');
        const reverted = new Set(favoritedIds);
        setFavoritedIds(reverted);
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const reverted = new Set(favoritedIds);
        setFavoritedIds(reverted);
      } else {
        window.dispatchEvent(new Event('bb_favorites_changed'));
        sessionStorage.removeItem('bb_favorites');
      }
    } catch {
      const reverted = new Set(favoritedIds);
      setFavoritedIds(reverted);
    }
  };

  // Quiz state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState<Array<{ question: string; selected: string; correct: string; isCorrect: boolean }>>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`completed_${className}`);
      if (saved) setCompletedItems(JSON.parse(saved));
    } catch {}

    if (className) {
      document.cookie = `selected_class=${encodeURIComponent(className)}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem('selectedClass', className);
    }
  }, [className]);

  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = { ...completedItems, [id]: !completedItems[id] };
    setCompletedItems(updated);
    try { localStorage.setItem(`completed_${className}`, JSON.stringify(updated)); } catch {}
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&#?]{11})/);
    return match ? match[1] : null;
  };

  const getEmbedLink = (url: string) => {
    if (url.includes("drive.google.com/file/d/")) {
      return url.replace(/\/view(\?usp=sharing)?$/, "/preview");
    }
    return url;
  };

  const activeSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId) || null, [selectedSubjectId, subjects]);
  
  const activeChapter = useMemo(() => {
    if (selectedChapterId === "general") {
      return { id: "general", name: "Curriculum Resources", number: 0 };
    }
    return activeSubject?.chapters.find(c => c.id === selectedChapterId) || null;
  }, [selectedChapterId, activeSubject]);

  const getUnassignedCounts = (subject: Subject) => {
    const chapterIds = new Set(subject.chapters.map(c => c.id));
    const vids = subject.videos.filter(v => !v.chapterId || !chapterIds.has(v.chapterId)).length;
    const nts = subject.notes.filter(n => !n.chapterId || !chapterIds.has(n.chapterId)).length;
    const dps = subject.papers.filter(p => !p.chapterId || !chapterIds.has(p.chapterId)).length;
    const qzs = subject.quizzes.filter(q => !q.chapterId || !chapterIds.has(q.chapterId)).length;
    return { vids, nts, dps, qzs, total: vids + nts + dps + qzs };
  };

  const chapterContent = useMemo(() => {
    if (!activeSubject || !selectedChapterId) return { videos: [], notes: [], dpps: [], quizzes: [] };
    if (selectedChapterId === "general") {
      const chapterIds = new Set(activeSubject.chapters.map(c => c.id));
      return {
        videos: activeSubject.videos.filter(v => !v.chapterId || !chapterIds.has(v.chapterId)),
        notes: activeSubject.notes.filter(n => !n.chapterId || !chapterIds.has(n.chapterId)),
        dpps: activeSubject.papers.filter(p => !p.chapterId || !chapterIds.has(p.chapterId)),
        quizzes: activeSubject.quizzes.filter(q => !q.chapterId || !chapterIds.has(q.chapterId)),
      };
    }
    return {
      videos: activeSubject.videos.filter(v => v.chapterId === selectedChapterId),
      notes: activeSubject.notes.filter(n => n.chapterId === selectedChapterId),
      dpps: activeSubject.papers.filter(p => p.chapterId === selectedChapterId),
      quizzes: activeSubject.quizzes.filter(q => q.chapterId === selectedChapterId),
    };
  }, [activeSubject, selectedChapterId]);

  const stats = useMemo(() => {
    let videos = 0, notes = 0, papers = 0, quizzes = 0, completed = 0;
    subjects.forEach(s => {
      videos += s.videos.length;
      notes += s.notes.length;
      papers += s.papers.length;
      quizzes += s.quizzes.length;
    });
    Object.values(completedItems).forEach(v => { if (v) completed++; });
    const total = videos + notes + papers;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { videos, notes, papers, quizzes, completed, total, progress };
  }, [subjects, completedItems]);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizHistory([]);
  };

  const answerQuiz = (opt: string) => {
    if (selectedOption || !activeQuiz) return;
    setSelectedOption(opt);
    const q = activeQuiz.questions[questionIndex];
    const correct = opt === q.answer;
    if (correct) setQuizScore(p => p + 1);
    setQuizHistory(p => [...p, { question: q.questionText || `Q${questionIndex + 1}`, selected: opt, correct: q.answer, isCorrect: correct }]);
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    setSelectedOption(null);
    if (questionIndex + 1 < activeQuiz.questions.length) {
      setQuestionIndex(p => p + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const goToTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
  };

  // Handler for clicking on a stat card to jump straight to that resource type in Study
  const handleStatClick = (type: "videos" | "notes" | "practice" | "quiz") => {
    setActiveTab("study");
    setClassroomTab(type);
    if (subjects.length === 1) {
      setSelectedSubjectId(subjects[0].id);
      if (subjects[0].chapters.length === 0) {
        setSelectedChapterId("general");
      }
    }
  };

  const handleOpenSubject = (sub: Subject) => {
    setActiveTab("study");
    setSelectedSubjectId(sub.id);
    if (sub.chapters.length === 0) {
      setSelectedChapterId("general");
      setClassroomTab("videos");
    } else {
      setSelectedChapterId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.appShell}>

      {/* ── UNIFIED SAAS WORKSPACE HEADER: Eliminates the duplicate banners ── */}
      <LearningWorkspaceHeader
        className={className}
        displayTitle={displayTitle}
        activeTab={activeTab}
        onTabChange={goToTab}
        onOpenClassSwitcher={() => setIsSwitcherOpen(true)}
        counts={{
          study: subjects.reduce((acc, s) => acc + s.chapters.length, 0) || subjects.length,
          premium: displayPremiumItems.length,
          notices: announcements.length,
        }}
      />

      {/* ── MAIN CONTENT AREA ── */}
      <main className={styles.appMain}>

        {/* ══════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════ */}
        {activeTab === "home" && (
          <div className={`${styles.tabContent} ${styles.overviewTabContent}`}>

            {/* Quick Stats Grid — Navigable to Study Resources */}
            <section aria-label="Curriculum resources summary">
              <div className={styles.statsRow}>
                <div
                  className={`${styles.statCard} ${styles.statCardNavigable}`}
                  onClick={() => handleStatClick("videos")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatClick("videos")}
                  aria-label={`${stats.videos} Video Lectures. Click to open video lessons.`}
                >
                  <div className={styles.statIcon} style={{ color: '#06b6d4' }}>
                    <VideoIcon size={26} />
                  </div>
                  <div className={styles.statInfo}>
                    <strong>{stats.videos}</strong>
                    <span>Videos</span>
                  </div>
                </div>

                <div
                  className={`${styles.statCard} ${styles.statCardNavigable}`}
                  onClick={() => handleStatClick("notes")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatClick("notes")}
                  aria-label={`${stats.notes} Chapter Notes. Click to open study notes.`}
                >
                  <div className={styles.statIcon} style={{ color: '#6366f1' }}>
                    <FileText size={26} />
                  </div>
                  <div className={styles.statInfo}>
                    <strong>{stats.notes}</strong>
                    <span>Notes</span>
                  </div>
                </div>

                <div
                  className={`${styles.statCard} ${styles.statCardNavigable}`}
                  onClick={() => handleStatClick("practice")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatClick("practice")}
                  aria-label={`${stats.papers} Board & Practice Papers. Click to open practice papers.`}
                >
                  <div className={styles.statIcon} style={{ color: '#f59e0b' }}>
                    <BookOpen size={26} />
                  </div>
                  <div className={styles.statInfo}>
                    <strong>{stats.papers}</strong>
                    <span>Practice Papers</span>
                  </div>
                </div>

                <div
                  className={`${styles.statCard} ${styles.statCardNavigable}`}
                  onClick={() => handleStatClick("quiz")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatClick("quiz")}
                  aria-label={`${stats.quizzes} Practice Quizzes. Click to test knowledge.`}
                >
                  <div className={styles.statIcon} style={{ color: '#ec4899' }}>
                    <Trophy size={26} />
                  </div>
                  <div className={styles.statInfo}>
                    <strong>{stats.quizzes}</strong>
                    <span>Quizzes</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Continue Learning — Only shown if actual progress exists */}
            {recentVideo && (
              <section className={styles.section} aria-label="Resume previous study session">
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Continue Learning</h3>
                </div>
                <div
                  className={styles.continueCard}
                  onClick={() => {
                    setActiveTab("study");
                    setSelectedSubjectId(recentVideo.subjectId);
                    setSelectedChapterId(recentVideo.video.chapterId || "general");
                    setClassroomTab("videos");
                    setSelectedVideo(recentVideo.video);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedVideo(recentVideo.video)}
                >
                  <div className={styles.continueThumb}>
                    <VideoThumbnail
                      src={
                        getYoutubeId(recentVideo.video.youtubeLink)
                          ? `https://img.youtube.com/vi/${getYoutubeId(recentVideo.video.youtubeLink)}/mqdefault.jpg`
                          : null
                      }
                      alt={recentVideo.video.title}
                    />
                    <div className={styles.videoPlayOverlay} style={{ opacity: 1, background: "rgba(0, 0, 0, 0.25)" }}>
                      <Play size={20} fill="white" color="white" />
                    </div>
                  </div>
                  <div className={styles.continueInfo}>
                    <span className={styles.continueMeta}>
                      {recentVideo.subjectName} · Lecture {recentVideo.video.lectureNumber || 1}
                    </span>
                    <p className={styles.continueTitle}>{recentVideo.video.title}</p>
                  </div>
                  <ChevronRight size={22} className={styles.continueArrow} />
                </div>
              </section>
            )}

            {/* Your Subjects — Clean Discovery Grid */}
            <section className={styles.section} aria-label="Available subjects in class">
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Your Subjects</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0.2rem 0 0' }}>
                    {subjects.length === 1
                      ? `1 active subject in ${displayTitle}`
                      : `${subjects.length} active subjects available`}
                  </p>
                </div>
                {subjects.length > 3 && (
                  <button className={styles.seeAllBtn} onClick={() => goToTab("study")}>
                    See All Subjects
                  </button>
                )}
              </div>

              {subjects.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={32} />}
                  title="No Subjects Published Yet"
                  description={`Content and notes for ${displayTitle} are currently being prepared. Check back shortly or browse other classes.`}
                  action={
                    <Button variant="outline" size="sm" onClick={() => setIsSwitcherOpen(true)}>
                      Switch Class
                    </Button>
                  }
                />
              ) : (
                <div className={styles.subjectGrid}>
                  {subjects.map(sub => (
                    <SubjectCard
                      key={sub.id}
                      id={sub.id}
                      name={sub.name}
                      chaptersCount={sub.chapters.length}
                      notesCount={sub.notes.length}
                      videosCount={sub.videos.length}
                      papersCount={sub.papers.length}
                      quizzesCount={sub.quizzes.length}
                      onClick={() => handleOpenSubject(sub)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Featured Premium Resource / Recommended Study Package */}
            {curriculumItems.length > 0 && (
              <section className={styles.section} aria-label="Featured premium course">
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recommended for {displayTitle}</h3>
                  <button className={styles.seeAllBtn} onClick={() => goToTab("premium")}>
                    View All in Store
                  </button>
                </div>
                <div className={styles.premiumGrid}>
                  {curriculumItems.slice(0, 3).map(item => (
                    <PremiumResourceCard
                      key={item.id}
                      item={item}
                      onOpen={handleOpenPremiumItem}
                      onInstantBuy={handleOpenPremiumItem}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* ══════════════════════════════
            STUDY TAB
        ══════════════════════════════ */}
        {activeTab === "study" && (
          <div className={styles.tabContent}>

            {/* LEVEL 1: Subject list */}
            {!selectedSubjectId && (
              <>
                <div className={styles.pageHeading}>
                  <h2>Curriculum & Subjects</h2>
                  <p>
                    {subjects.length > 0
                      ? `Select a subject to explore chapter notes, board papers, and video lectures.`
                      : `No study materials uploaded for ${displayTitle} yet.`}
                  </p>
                </div>

                {subjects.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen size={36} />}
                    title="No Curriculum Uploaded Yet"
                    description={`No syllabus resources or subjects have been configured for ${displayTitle} yet. You can check back soon or switch to another class.`}
                    compact={true}
                    action={
                      <Button variant="primary" onClick={() => setIsSwitcherOpen(true)}>
                        <GraduationCap size={16} /> Switch Class
                      </Button>
                    }
                  />
                ) : (
                  <div className={styles.subjectGrid}>
                    {subjects.map(sub => (
                      <SubjectCard
                        key={sub.id}
                        id={sub.id}
                        name={sub.name}
                        chaptersCount={sub.chapters.length}
                        notesCount={sub.notes.length}
                        videosCount={sub.videos.length}
                        papersCount={sub.papers.length}
                        quizzesCount={sub.quizzes.length}
                        onClick={() => handleOpenSubject(sub)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* LEVEL 2: Chapter list (or direct content if 0 chapters) */}
            {selectedSubjectId && !selectedChapterId && activeSubject && (
              <>
                <div className={styles.breadcrumb}>
                  <button className={styles.breadcrumbBack} onClick={() => setSelectedSubjectId(null)}>
                    <ChevronLeft size={16} /> All Subjects
                  </button>
                  <span>{activeSubject.name}</span>
                </div>

                <div className={styles.pageHeading}>
                  <h2>{activeSubject.name}</h2>
                  <p>
                    {activeSubject.chapters.length > 0
                      ? "Select a chapter below to access specific lectures and notes"
                      : "Core curriculum notes, practice sheets, and video lectures"}
                  </p>
                </div>

                {/* If the subject has chapters, display chapters + general resources */}
                {activeSubject.chapters.length > 0 ? (
                  <div className={styles.chapterList}>
                    {/* General / Unassigned Resources virtual chapter */}
                    {(() => {
                      const counts = getUnassignedCounts(activeSubject);
                      if (counts.total === 0) return null;
                      return (
                        <div
                          className={styles.chapterRow}
                          onClick={() => {
                            setSelectedChapterId("general");
                            setClassroomTab("videos");
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedChapterId("general")}
                        >
                          <div className={styles.chapterNum} style={{ background: "rgba(156,163,175,0.1)", color: "#9ca3af" }}>
                            #
                          </div>
                          <div className={styles.chapterInfo}>
                            <h4>General / Curriculum Resources</h4>
                            <div className={styles.chapterMeta}>
                              {counts.vids > 0 && <span><VideoIcon size={12} /> {counts.vids}</span>}
                              {counts.nts > 0 && <span><FileText size={12} /> {counts.nts}</span>}
                              {counts.dps > 0 && <span><BookOpen size={12} /> {counts.dps}</span>}
                              {counts.qzs > 0 && <span><Trophy size={12} /> {counts.qzs}</span>}
                            </div>
                          </div>
                          <ChevronRight size={18} className={styles.rowArrow} />
                        </div>
                      );
                    })()}

                    {activeSubject.chapters.map(chap => {
                      const vids = activeSubject.videos.filter(v => v.chapterId === chap.id).length;
                      const nts  = activeSubject.notes.filter(n => n.chapterId === chap.id).length;
                      const dps  = activeSubject.papers.filter(p => p.chapterId === chap.id).length;
                      return (
                        <div
                          key={chap.id}
                          className={styles.chapterRow}
                          onClick={() => {
                            setSelectedChapterId(chap.id);
                            setClassroomTab("videos");
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedChapterId(chap.id)}
                        >
                          <div className={styles.chapterNum} style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                            {chap.number}
                          </div>
                          <div className={styles.chapterInfo}>
                            <h4>{chap.name}</h4>
                            <div className={styles.chapterMeta}>
                              {vids > 0 && <span><VideoIcon size={12} /> {vids}</span>}
                              {nts > 0 && <span><FileText size={12} /> {nts}</span>}
                              {dps > 0 && <span><BookOpen size={12} /> {dps}</span>}
                            </div>
                          </div>
                          <ChevronRight size={18} className={styles.rowArrow} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Subject with 0 chapters (e.g. Class 8 Math): seamlessly display content without awkward empty panel */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className={styles.subTabs}>
                      {[
                        { id: "videos",   label: "Videos",   icon: <VideoIcon size={15} />, count: activeSubject.videos.length },
                        { id: "notes",    label: "Notes",    icon: <FileText size={15} />, count: activeSubject.notes.length },
                        { id: "practice", label: "Practice", icon: <BookOpen size={15} />, count: activeSubject.papers.length },
                        { id: "quiz",     label: "Quiz",     icon: <Trophy size={15} />, count: activeSubject.quizzes.length },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          className={`${styles.subTab} ${classroomTab === tab.id ? styles.subTabActive : ""}`}
                          onClick={() => setClassroomTab(tab.id as any)}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                          {tab.count > 0 && <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({tab.count})</span>}
                        </button>
                      ))}
                    </div>

                    {/* VIDEOS */}
                    {classroomTab === "videos" && (
                      <div className={styles.contentList}>
                        {activeSubject.videos.length === 0 ? (
                          <EmptyState
                            icon={<VideoIcon size={28} />}
                            title="No Video Lessons Yet"
                            description={`Lectures for ${activeSubject.name} will appear here once published.`}
                            compact={true}
                          />
                        ) : activeSubject.videos.map(video => {
                          const ytId = getYoutubeId(video.youtubeLink);
                          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                          const done = !!completedItems[video.id];
                          return (
                            <div
                              key={video.id}
                              className={`${styles.videoCard} ${done ? styles.videoCardDone : ""}`}
                              onClick={() => handleVideoClick(video)}
                            >
                              <div className={styles.videoThumb}>
                                <VideoThumbnail src={thumb} alt={video.title} />
                                <div className={styles.videoPlayOverlay}><Play size={16} fill="white" color="white" /></div>
                              </div>
                              <div className={styles.videoInfo}>
                                <span className={styles.videoLabel}>Lecture {video.lectureNumber || 1}</span>
                                <h4 className={styles.videoTitle}>{video.title}</h4>
                              </div>
                              <button
                                className={`${styles.favBtn} ${favoritedIds.has(video.id) ? styles.favBtnActive : ""}`}
                                onClick={(e) => toggleFavorite(video.id, 'VIDEO', e)}
                                title={favoritedIds.has(video.id) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Heart size={20} fill={favoritedIds.has(video.id) ? "#ef4444" : "none"} color={favoritedIds.has(video.id) ? "#ef4444" : "currentColor"} />
                              </button>
                              <button
                                className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                onClick={(e) => toggleComplete(video.id, e)}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* NOTES */}
                    {classroomTab === "notes" && (
                      <div className={styles.contentList}>
                        {activeSubject.notes.length === 0 ? (
                          <EmptyState
                            icon={<FileText size={28} />}
                            title="No Notes Published Yet"
                            description={`Chapter notes and revision guides for ${activeSubject.name} will be uploaded soon.`}
                            compact={true}
                          />
                        ) : activeSubject.notes.map(note => {
                          const done = !!completedItems[note.id];
                          return (
                            <div
                              key={note.id}
                              className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                              onClick={() => setSelectedDoc({ title: note.title, viewUrl: note.viewUrl, downloadUrl: note.downloadFile })}
                            >
                              <div className={styles.docIcon} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                                <FileText size={18} />
                              </div>
                              <div className={styles.docInfo}>
                                <h4>{note.title}</h4>
                                <span>Study Notes · PDF</span>
                              </div>
                              <button
                                className={`${styles.favBtn} ${favoritedIds.has(note.id) ? styles.favBtnActive : ""}`}
                                onClick={(e) => toggleFavorite(note.id, 'NOTE', e)}
                                title={favoritedIds.has(note.id) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Heart size={20} fill={favoritedIds.has(note.id) ? "#ef4444" : "none"} color={favoritedIds.has(note.id) ? "#ef4444" : "currentColor"} />
                              </button>
                              <button
                                className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                onClick={(e) => toggleComplete(note.id, e)}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* PRACTICE */}
                    {classroomTab === "practice" && (
                      <div className={styles.contentList}>
                        {activeSubject.papers.length === 0 ? (
                          <EmptyState
                            icon={<BookOpen size={28} />}
                            title="No Practice Papers Yet"
                            description={`Question papers and DPP worksheets for ${activeSubject.name} will appear here.`}
                            compact={true}
                          />
                        ) : activeSubject.papers.map(dpp => {
                          const done = !!completedItems[dpp.id];
                          return (
                            <div
                              key={dpp.id}
                              className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                              onClick={() => setSelectedDoc({ title: dpp.title, viewUrl: dpp.viewUrl, downloadUrl: dpp.downloadFile })}
                            >
                              <div className={styles.docIcon} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                                <BookOpen size={18} />
                              </div>
                              <div className={styles.docInfo}>
                                <h4>{dpp.title}</h4>
                                <span>Practice Sheet · DPP</span>
                              </div>
                              <button
                                className={`${styles.favBtn} ${favoritedIds.has(dpp.id) ? styles.favBtnActive : ""}`}
                                onClick={(e) => toggleFavorite(dpp.id, 'PAPER', e)}
                                title={favoritedIds.has(dpp.id) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Heart size={20} fill={favoritedIds.has(dpp.id) ? "#ef4444" : "none"} color={favoritedIds.has(dpp.id) ? "#ef4444" : "currentColor"} />
                              </button>
                              <button
                                className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                onClick={(e) => toggleComplete(dpp.id, e)}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* QUIZ */}
                    {classroomTab === "quiz" && (
                      <div className={styles.contentList}>
                        {activeSubject.quizzes.length === 0 ? (
                          <EmptyState
                            icon={<Trophy size={28} />}
                            title="No Quizzes Available"
                            description={`Topic quizzes for ${activeSubject.name} are coming soon.`}
                            compact={true}
                          />
                        ) : activeSubject.quizzes.map(quiz => (
                          <div key={quiz.id} className={styles.quizRow}>
                            <div className={styles.quizIcon}>
                              <Trophy size={18} />
                            </div>
                            <div className={styles.quizInfo}>
                              <h4>{quiz.title}</h4>
                              <span>{quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                className={`${styles.favBtn} ${favoritedIds.has(quiz.id) ? styles.favBtnActive : ""}`}
                                onClick={(e) => toggleFavorite(quiz.id, 'QUIZ', e)}
                                title={favoritedIds.has(quiz.id) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Heart size={16} fill={favoritedIds.has(quiz.id) ? "#ef4444" : "none"} color={favoritedIds.has(quiz.id) ? "#ef4444" : "currentColor"} />
                              </button>
                              <button className={styles.startQuizBtn} onClick={() => startQuiz(quiz)}>
                                Start Quiz
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* LEVEL 3: Chapter content (when chapter selected) */}
            {selectedSubjectId && selectedChapterId && activeSubject && activeChapter && (
              <>
                <div className={styles.breadcrumb}>
                  <button 
                    className={styles.breadcrumbBack} 
                    onClick={() => {
                      if (activeSubject.chapters.length === 0) {
                        setSelectedSubjectId(null);
                        setSelectedChapterId(null);
                      } else {
                        setSelectedChapterId(null);
                      }
                    }}
                  >
                    <ChevronLeft size={16} /> {activeSubject.name}
                  </button>
                </div>

                <div className={styles.chapterBanner}>
                  {activeChapter.id !== "general" && <span className={styles.chapterBannerNum}>Chapter {activeChapter.number}</span>}
                  <h3 className={styles.chapterBannerTitle}>{activeChapter.name}</h3>
                </div>

                {/* Sub-tabs */}
                <div className={styles.subTabs}>
                  {[
                    { id: "videos",   label: "Videos",   icon: <VideoIcon size={15} /> },
                    { id: "notes",    label: "Notes",    icon: <FileText size={15} /> },
                    { id: "practice", label: "Practice", icon: <BookOpen size={15} /> },
                    { id: "quiz",     label: "Quiz",     icon: <Trophy size={15} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`${styles.subTab} ${classroomTab === tab.id ? styles.subTabActive : ""}`}
                      onClick={() => setClassroomTab(tab.id as any)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* VIDEOS */}
                {classroomTab === "videos" && (
                  <div className={styles.contentList}>
                    {chapterContent.videos.length === 0 ? (
                      <EmptyState
                        icon={<VideoIcon size={28} />}
                        title="No Videos in this Chapter"
                        description="Video lectures for this specific chapter will appear here."
                        compact={true}
                      />
                    ) : chapterContent.videos.map(video => {
                      const ytId = getYoutubeId(video.youtubeLink);
                      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                      const done = !!completedItems[video.id];
                      return (
                        <div
                          key={video.id}
                          className={`${styles.videoCard} ${done ? styles.videoCardDone : ""}`}
                          onClick={() => handleVideoClick(video)}
                        >
                          <div className={styles.videoThumb}>
                            <VideoThumbnail src={thumb} alt={video.title} />
                            <div className={styles.videoPlayOverlay}><Play size={16} fill="white" color="white" /></div>
                          </div>
                          <div className={styles.videoInfo}>
                            <span className={styles.videoLabel}>Lecture {video.lectureNumber}</span>
                            <h4 className={styles.videoTitle}>{video.title}</h4>
                          </div>
                          <button
                            className={`${styles.favBtn} ${favoritedIds.has(video.id) ? styles.favBtnActive : ""}`}
                            onClick={(e) => toggleFavorite(video.id, 'VIDEO', e)}
                            title={favoritedIds.has(video.id) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={20} fill={favoritedIds.has(video.id) ? "#ef4444" : "none"} color={favoritedIds.has(video.id) ? "#ef4444" : "currentColor"} />
                          </button>
                          <button
                            className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                            onClick={(e) => toggleComplete(video.id, e)}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* NOTES */}
                {classroomTab === "notes" && (
                  <div className={styles.contentList}>
                    {chapterContent.notes.length === 0 ? (
                      <EmptyState
                        icon={<FileText size={28} />}
                        title="No Notes in this Chapter"
                        description="Written notes and PDF study material will appear here."
                        compact={true}
                      />
                    ) : chapterContent.notes.map(note => {
                      const done = !!completedItems[note.id];
                      return (
                        <div
                          key={note.id}
                          className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                          onClick={() => setSelectedDoc({ title: note.title, viewUrl: note.viewUrl, downloadUrl: note.downloadFile })}
                        >
                          <div className={styles.docIcon} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                            <FileText size={18} />
                          </div>
                          <div className={styles.docInfo}>
                            <h4>{note.title}</h4>
                            <span>Study Note · PDF</span>
                          </div>
                          <button
                            className={`${styles.favBtn} ${favoritedIds.has(note.id) ? styles.favBtnActive : ""}`}
                            onClick={(e) => toggleFavorite(note.id, 'NOTE', e)}
                            title={favoritedIds.has(note.id) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={20} fill={favoritedIds.has(note.id) ? "#ef4444" : "none"} color={favoritedIds.has(note.id) ? "#ef4444" : "currentColor"} />
                          </button>
                          <button
                            className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                            onClick={(e) => toggleComplete(note.id, e)}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PRACTICE */}
                {classroomTab === "practice" && (
                  <div className={styles.contentList}>
                    {chapterContent.dpps.length === 0 ? (
                      <EmptyState
                        icon={<BookOpen size={28} />}
                        title="No Practice Sheets Yet"
                        description="DPP questions and assignment sheets will appear here."
                        compact={true}
                      />
                    ) : chapterContent.dpps.map(dpp => {
                      const done = !!completedItems[dpp.id];
                      return (
                        <div
                          key={dpp.id}
                          className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                          onClick={() => setSelectedDoc({ title: dpp.title, viewUrl: dpp.viewUrl, downloadUrl: dpp.downloadFile })}
                        >
                          <div className={styles.docIcon} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                            <BookOpen size={18} />
                          </div>
                          <div className={styles.docInfo}>
                            <h4>{dpp.title}</h4>
                            <span>Practice Sheet · DPP</span>
                          </div>
                          <button
                            className={`${styles.favBtn} ${favoritedIds.has(dpp.id) ? styles.favBtnActive : ""}`}
                            onClick={(e) => toggleFavorite(dpp.id, 'PAPER', e)}
                            title={favoritedIds.has(dpp.id) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={20} fill={favoritedIds.has(dpp.id) ? "#ef4444" : "none"} color={favoritedIds.has(dpp.id) ? "#ef4444" : "currentColor"} />
                          </button>
                          <button
                            className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                            onClick={(e) => toggleComplete(dpp.id, e)}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* QUIZ */}
                {classroomTab === "quiz" && (
                  <div className={styles.contentList}>
                    {chapterContent.quizzes.length === 0 ? (
                      <EmptyState
                        icon={<Trophy size={28} />}
                        title="No Quizzes Yet"
                        description="Interactive chapter tests will be added here."
                        compact={true}
                      />
                    ) : chapterContent.quizzes.map(quiz => (
                      <div key={quiz.id} className={styles.quizRow}>
                        <div className={styles.quizIcon}>
                          <Trophy size={18} />
                        </div>
                        <div className={styles.quizInfo}>
                          <h4>{quiz.title}</h4>
                          <span>{quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className={`${styles.favBtn} ${favoritedIds.has(quiz.id) ? styles.favBtnActive : ""}`}
                            onClick={(e) => toggleFavorite(quiz.id, 'QUIZ', e)}
                            title={favoritedIds.has(quiz.id) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={16} fill={favoritedIds.has(quiz.id) ? "#ef4444" : "none"} color={favoritedIds.has(quiz.id) ? "#ef4444" : "currentColor"} />
                          </button>
                          <button className={styles.startQuizBtn} onClick={() => startQuiz(quiz)}>
                            Start Quiz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* ══════════════════════════════
            PREMIUM TAB
        ══════════════════════════════ */}
        {activeTab === "premium" && (
          <div className={styles.tabContent}>
            <div className={styles.pageHeading}>
              <h2>Premium Study Material</h2>
              <p>Verified board notes, solved question papers, and full video courses</p>
            </div>

            {/* Category Filter Pills */}
            <div className={styles.premiumFilterBar} role="tablist" aria-label="Premium resource categories">
              <button
                type="button"
                className={`${styles.premiumFilterPill} ${premiumFilter === 'all' ? styles.premiumFilterPillActive : ''}`}
                onClick={() => setPremiumFilter('all')}
                role="tab"
                aria-selected={premiumFilter === 'all'}
              >
                All Resources
              </button>
              <button
                type="button"
                className={`${styles.premiumFilterPill} ${premiumFilter === 'NOTE' ? styles.premiumFilterPillActive : ''}`}
                onClick={() => setPremiumFilter('NOTE')}
                role="tab"
                aria-selected={premiumFilter === 'NOTE'}
              >
                <FileText size={14} />
                Detailed Notes
              </button>
              <button
                type="button"
                className={`${styles.premiumFilterPill} ${premiumFilter === 'PYQ' ? styles.premiumFilterPillActive : ''}`}
                onClick={() => setPremiumFilter('PYQ')}
                role="tab"
                aria-selected={premiumFilter === 'PYQ'}
              >
                <Award size={14} />
                Solved Board PYQs
              </button>
              <button
                type="button"
                className={`${styles.premiumFilterPill} ${premiumFilter === 'COURSE' ? styles.premiumFilterPillActive : ''}`}
                onClick={() => setPremiumFilter('COURSE')}
                role="tab"
                aria-selected={premiumFilter === 'COURSE'}
              >
                <Sparkles size={14} />
                Video Courses
              </button>
            </div>

            {/* Primary Section: Curriculum Premium Packages for this class */}
            {filteredCurriculumItems.length > 0 ? (
              <div className={styles.premiumGrid}>
                {filteredCurriculumItems.map(item => (
                  <PremiumResourceCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpenPremiumItem}
                    onInstantBuy={handleOpenPremiumItem}
                  />
                ))}
              </div>
            ) : curriculumItems.length === 0 ? (
              <EmptyState
                icon={<Star size={30} />}
                title={`No Premium Packages for ${displayTitle} Yet`}
                description={`Premium packages for ${displayTitle} are currently being prepared. In the meantime, explore the available free curriculum materials or practical skill courses below.`}
                compact={true}
                action={
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button variant="primary" size="sm" onClick={() => goToTab("study")}>
                      <BookOpen size={15} /> Explore Free Study Material
                    </Button>
                    {skillRecommendations.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById('skill-recommendations');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Sparkles size={15} /> View Skill Courses
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              <EmptyState
                icon={<Star size={30} />}
                title="No Matching Resources"
                description={`No resources found matching the selected category. Try selecting 'All Resources'.`}
                compact={true}
                action={
                  <Button variant="outline" size="sm" onClick={() => setPremiumFilter('all')}>
                    View All Resources
                  </Button>
                }
              />
            )}

            {/* Secondary Section: Cross-Category Skill Recommendations (Cleanly Labeled) */}
            {filteredSkillItems.length > 0 && (
              <div className={styles.crossCategoryWrapper} id="skill-recommendations">
                <div className={styles.crossCategoryHeader}>
                  <h3 className={styles.crossCategoryTitle}>
                    <Sparkles size={18} color="#f59e0b" /> Recommended Skill & AI Courses
                  </h3>
                  <p className={styles.crossCategorySub}>
                    Complement your school curriculum with practical mastery in artificial intelligence, programming, and productivity tools.
                  </p>
                </div>

                <div className={styles.premiumGrid}>
                  {filteredSkillItems.map(item => (
                    <PremiumResourceCard
                      key={item.id}
                      item={item}
                      onOpen={handleOpenPremiumItem}
                      onInstantBuy={handleOpenPremiumItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
            NOTICES TAB
        ══════════════════════════════ */}
        {activeTab === "notices" && (
          <div className={styles.tabContent}>
            <div className={styles.pageHeading}>
              <h2>Notices & Announcements</h2>
              <p>Official curriculum updates, exam schedules, and teacher notes for {displayTitle}</p>
            </div>

            {announcements.length === 0 ? (
              <EmptyState
                icon={<Bell size={30} />}
                title="No Active Notices"
                description={`There are currently no new announcements or routine updates for ${displayTitle}. New updates will appear here automatically.`}
                compact={true}
              />
            ) : (
              <div className={styles.noticeFeed}>
                {announcements.map(notice => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ══════════════════════════════
          MODAL: VIDEO PLAYER
      ══════════════════════════════ */}
      {selectedVideo && (() => {
        const currentSubject = subjects.find(s => 
          s.videos.some(v => v.id === selectedVideo.id) || 
          (selectedVideo.chapterId && s.chapters.some(c => c.id === selectedVideo.chapterId))
        );
        const playlistVideos = currentSubject && selectedVideo.chapterId
          ? currentSubject.videos.filter(v => v.chapterId === selectedVideo.chapterId)
          : [];
        const favorited = favoritedIds.has(selectedVideo.id);
        const completed = !!completedItems[selectedVideo.id];
        
        return (
          <div className={styles.modalBackdrop} onClick={() => setSelectedVideo(null)}>
            <div className={styles.videoGlow} />
            <div className={`${styles.videoModal} ${styles.premiumVideoModal}`} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <span className={styles.modalEyebrow}>
                    {currentSubject ? currentSubject.name : "Now Playing"} 
                    {selectedVideo.lectureNumber ? ` · Lecture ${selectedVideo.lectureNumber}` : ""}
                  </span>
                  <h3 className={styles.modalTitle}>{selectedVideo.title}</h3>
                </div>
                <button className={styles.modalClose} onClick={() => setSelectedVideo(null)} aria-label="Close video player">
                  <X size={18} />
                </button>
              </div>

              <div className={styles.premiumPlayerGrid}>
                <div className={styles.playerContainer}>
                  <div className={styles.videoEmbed}>
                    {getYoutubeId(selectedVideo.youtubeLink) ? (
                      <PWVideoPlayer
                        youtubeUrl={selectedVideo.youtubeLink}
                        title={selectedVideo.title}
                        subtitle={`${currentSubject ? currentSubject.name : "Class Lecture"}${selectedVideo.lectureNumber ? ` · Lecture ${selectedVideo.lectureNumber}` : ""}`}
                        pdfNotesUrl={selectedVideo.pdfUrl}
                        autoPlay={true}
                        onBack={() => setSelectedVideo(null)}
                      />
                    ) : (
                      <div className={styles.videoEmbedError}>
                        <AlertCircle size={32} opacity={0.5} />
                        <p>Video link is invalid or missing.</p>
                        <a href={selectedVideo.youtubeLink} target="_blank" rel="noreferrer" className={styles.enrollBtn}>
                          Open in YouTube
                        </a>
                      </div>
                    )}
                  </div>

                  <div className={styles.playerActionsRow}>
                    <button 
                      className={`${styles.actionBtn} ${favorited ? styles.actionBtnFavActive : ""}`}
                      onClick={(e) => toggleFavorite(selectedVideo.id, 'VIDEO', e)}
                      type="button"
                    >
                      <Heart size={16} fill={favorited ? "#ef4444" : "none"} color={favorited ? "#ef4444" : "currentColor"} />
                      <span>{favorited ? "Favorited" : "Favorite"}</span>
                    </button>

                    <button 
                      className={`${styles.actionBtn} ${completed ? styles.actionBtnDoneActive : ""}`}
                      onClick={(e) => toggleComplete(selectedVideo.id, e)}
                      type="button"
                    >
                      <CheckCircle2 size={16} color={completed ? "#10b981" : "currentColor"} />
                      <span>{completed ? "Completed" : "Mark Completed"}</span>
                    </button>

                    {selectedVideo.pdfUrl && selectedVideo.pdfUrl !== "#" && (
                      <button 
                        className={styles.actionBtn}
                        onClick={() => setSelectedDoc({
                          title: `${selectedVideo.title} - Notes`,
                          viewUrl: selectedVideo.pdfUrl || "",
                          downloadUrl: selectedVideo.pdfUrl || ""
                        })}
                        type="button"
                      >
                        <FileText size={16} />
                        <span>Lecture Notes</span>
                      </button>
                    )}
                  </div>
                </div>

                {playlistVideos.length > 1 && (
                  <div className={styles.playerPlaylist}>
                    <div className={styles.playlistHeader}>
                      <PlaySquare size={16} style={{ opacity: 0.7 }} />
                      <h4>Chapter Lectures ({playlistVideos.length})</h4>
                    </div>
                    <div className={styles.playlistList}>
                      {playlistVideos.map((v, i) => {
                        const ytId = getYoutubeId(v.youtubeLink);
                        const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                        const isCurrent = v.id === selectedVideo.id;
                        const isDone = !!completedItems[v.id];
                        
                        return (
                          <div 
                            key={v.id} 
                            className={`${styles.playlistItem} ${isCurrent ? styles.playlistItemActive : ""} ${isDone ? styles.playlistItemDone : ""}`}
                            onClick={() => setSelectedVideo(v)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={styles.playlistThumbContainer}>
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={v.title} className={styles.playlistThumb} />
                              ) : (
                                <div className={styles.playlistThumbFallback}><Play size={12} fill="currentColor" /></div>
                              )}
                              {isCurrent && (
                                <div className={styles.playingIndicator}>
                                  <div className={styles.pulseDot} />
                                </div>
                              )}
                            </div>
                            <div className={styles.playlistItemInfo}>
                              <span className={styles.playlistLectureNum}>Lecture {v.lectureNumber || (i + 1)}</span>
                              <h5 className={styles.playlistItemTitle}>{v.title}</h5>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════
          MODAL: DOCUMENT VIEWER
      ══════════════════════════════ */}
      {selectedDoc && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedDoc(null)}>
          <div className={styles.docModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>Document Viewer</span>
                <h3 className={styles.modalTitle}>{selectedDoc.title}</h3>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedDoc.downloadUrl || selectedDoc.viewUrl, `${selectedDoc.title}.pdf`)}
                  className={styles.downloadBtn}
                  style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Download size={15} /> PDF
                </button>
                <button className={styles.modalClose} onClick={() => setSelectedDoc(null)} aria-label="Close document">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className={styles.docEmbed}>
              <iframe src={getEmbedLink(selectedDoc.viewUrl)} title={selectedDoc.title} allow="autoplay" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL: PACKAGE RESOURCES (UNLOCKED)
      ══════════════════════════════ */}
      {selectedPackageDetail && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedPackageDetail(null)}>
          <div className={styles.quizModal} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow} style={{ color: '#10b981' }}>UNLOCKED PACKAGE</span>
                <h3 className={styles.modalTitle}>{selectedPackageDetail.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedPackageDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.quizBody} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0 }}>{selectedPackageDetail.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', margin: 0 }}>
                  Package Contents ({selectedPackageDetail.contents?.length || 0})
                </h4>

                {(!selectedPackageDetail.contents || selectedPackageDetail.contents.length === 0) ? (
                  <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Resource files will be listed here soon.</p>
                ) : (
                  selectedPackageDetail.contents.map((content: any) => (
                    <div
                      key={content.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'var(--surface-highlight)',
                        border: '1px solid var(--surface-border)',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        {content.contentType === 'VIDEO' ? <VideoIcon size={18} color="#ef4444" /> : <FileText size={18} color="#6366f1" />}
                        <div style={{ minWidth: 0 }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.title}</h5>
                          {content.description && <p style={{ fontSize: '0.78rem', opacity: 0.6, margin: 0 }}>{content.description}</p>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        {content.viewUrl && (
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}
                            onClick={() => {
                              setSelectedPackageDetail(null);
                              setSelectedDoc({ title: content.title, viewUrl: content.viewUrl, downloadUrl: content.downloadUrl || '#' });
                            }}
                          >
                            View PDF
                          </button>
                        )}
                        {content.youtubeLink && (
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, background: '#ef4444' }}
                            onClick={() => {
                              setSelectedPackageDetail(null);
                              setSelectedVideo({ id: content.id, title: content.title, youtubeLink: content.youtubeLink, pdfUrl: null, chapterId: null, lectureNumber: 1 });
                            }}
                          >
                            Watch
                          </button>
                        )}
                        {content.downloadUrl && (
                          <a
                            href={content.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              border: '1px solid var(--surface-border)',
                              color: 'var(--foreground)',
                              opacity: 0.8
                            }}
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL: INLINE CHECKOUT
      ══════════════════════════════ */}
      {checkoutItem && (
        <div className={styles.modalBackdrop} onClick={() => setCheckoutItem(null)}>
          <div className={styles.quizModal} onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow} style={{ color: "#f59e0b" }}>SECURE CHECKOUT</span>
                <h3 className={styles.modalTitle}>{checkoutItem.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setCheckoutItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.quizBody} style={{ padding: '1.25rem' }}>
              {checkoutStep === 'details' && (
                <form onSubmit={handleAuthorizePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--surface-highlight)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{checkoutItem.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>Type:</span>
                      <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{checkoutItem.type}</span>
                    </div>
                    {checkoutItem.originalPrice && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span>Original Listing:</span>
                        <span style={{ textDecoration: 'line-through' }}>₹{checkoutItem.originalPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <hr style={{ margin: '0.5rem 0', borderColor: 'var(--surface-border)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>Total Payable:</span>
                      <span>₹{checkoutItem.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className={styles.payTabs} style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className={`${styles.payTab} ${payTab === 'card' ? styles.payTabActive : ''}`} onClick={() => setPayTab('card')} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', cursor: 'pointer' }}>
                      <FaCreditCard size={11} style={{ marginRight: '0.3rem' }} /> Credit/Debit Card
                    </button>
                    <button type="button" className={`${styles.payTab} ${payTab === 'upi' ? styles.payTabActive : ''}`} onClick={() => setPayTab('upi')} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', cursor: 'pointer' }}>
                      <FaMobileAlt size={11} style={{ marginRight: '0.3rem' }} /> Simulated UPI
                    </button>
                  </div>

                  {payTab === 'card' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>CARD NUMBER (Simulated)</label>
                        <input type="text" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))} placeholder="4111 2222 3333 4444" className={styles.formInput} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>EXPIRY</label>
                          <input type="text" maxLength={5} value={cardExpiry} onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/^(\d{2})(?=\d)/g, '$1/'))} placeholder="MM/YY" className={styles.formInput} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>CVV</label>
                          <input type="password" maxLength={3} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} placeholder="***" className={styles.formInput} required />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>UPI ID (Simulated)</label>
                      <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="student@okaxis" className={styles.formInput} required />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPurchasing}
                    className="btn-primary"
                    style={{ padding: '0.85rem', width: '100%', fontWeight: 800, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <FaShieldAlt /> Authorize Simulated Payment <FaChevronRight size={10} />
                  </button>
                </form>
              )}

              {checkoutStep === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                  <div className={styles.spinner} />
                  <span style={{ fontWeight: 600 }}>{loaderMessage}</span>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Please do not close this window.</span>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0', textAlign: 'center' }}>
                  <Award size={48} color="#10b981" />
                  <h4>Access Unlocked!</h4>
                  <p>Your purchase is complete! Access to <strong>{checkoutItem.title}</strong> is now unlocked.</p>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.8rem 1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      const itemToOpen = checkoutItem;
                      setCheckoutItem(null);
                      handleOpenPremiumItem({ ...itemToOpen, unlocked: true });
                    }}
                  >
                    <BookOpen size={16} /> Open Package Resources <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL: QUIZ PLAYER
      ══════════════════════════════ */}
      {activeQuiz && (
        <div className={styles.modalBackdrop}>
          <div className={styles.quizModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow} style={{ color: "#ec4899" }}>Practice Quiz</span>
                <h3 className={styles.modalTitle}>{activeQuiz.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setActiveQuiz(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.quizBody}>
              {!quizFinished ? (
                <>
                  <div className={styles.quizMeta}>
                    <span>Q {questionIndex + 1} / {activeQuiz.questions.length}</span>
                  </div>
                  <div className={styles.quizProgressBar}>
                    <div className={styles.quizProgressFill} style={{ width: `${(questionIndex / activeQuiz.questions.length) * 100}%` }} />
                  </div>

                  <p className={styles.quizQuestion}>{activeQuiz.questions[questionIndex].questionText}</p>

                  <div className={styles.quizOptions}>
                    {activeQuiz.questions[questionIndex].options?.split("|").map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedOption === opt;
                      const isCorrect = opt === activeQuiz.questions[questionIndex].answer;
                      let cls = styles.quizOption;
                      if (selectedOption) {
                        if (isSelected) cls += isCorrect ? ` ${styles.quizOptCorrect}` : ` ${styles.quizOptWrong}`;
                        else if (isCorrect) cls += ` ${styles.quizOptShow}`;
                        else cls += ` ${styles.quizOptDim}`;
                      }
                      return (
                        <button key={idx} className={cls} disabled={!!selectedOption} onClick={() => answerQuiz(opt)}>
                          <span className={styles.quizLetter}>{letter}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption && (
                    <>
                      <div className={`${styles.quizFeedback} ${selectedOption === activeQuiz.questions[questionIndex].answer ? styles.quizFeedbackOk : styles.quizFeedbackWrong}`}>
                        {selectedOption === activeQuiz.questions[questionIndex].answer ? "✓ Correct!" : `✗ Wrong — ${activeQuiz.questions[questionIndex].answer}`}
                      </div>
                      {activeQuiz.questions[questionIndex].explanation && (
                        <div className={styles.quizExplain}>
                          <strong>Explanation:</strong>
                          <p>{activeQuiz.questions[questionIndex].explanation}</p>
                        </div>
                      )}
                      <button className={styles.nextBtn} onClick={nextQuestion}>
                        {questionIndex + 1 === activeQuiz.questions.length ? "Finish" : "Next →"}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.quizResult}>
                  <Award size={48} color="#f59e0b" />
                  <h3>Quiz Complete!</h3>
                  <div className={styles.quizScore}>{quizScore} / {activeQuiz.questions.length}</div>
                  <div className={styles.quizReview}>
                    {quizHistory.map((r, i) => (
                      <div key={i} className={`${styles.quizReviewItem} ${r.isCorrect ? styles.reviewOk : styles.reviewWrong}`}>
                        <span>{r.isCorrect ? "✓" : "✗"}</span>
                        <div>
                          <p>{r.question}</p>
                          <span>Your answer: {r.selected}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.quizActions}>
                    <button className={styles.retryBtn} onClick={() => startQuiz(activeQuiz)}>Retry</button>
                    <button className={styles.enrollBtn} onClick={() => setActiveQuiz(null)}>Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Switcher Modal */}
      <ClassSwitcherModal 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
        currentClass={className}
      />

    </div>
  );
}
