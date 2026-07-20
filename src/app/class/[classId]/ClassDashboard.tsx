"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
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
  Flame,
  Trophy,
  Download,
  BookOpen as BookIcon,
  LogOut,
  ChevronLeft,
  Home,
  LayoutGrid,
  Bell,
  Star,
  Heart,
  PlaySquare,

  CheckCheck,
  Zap,
  Users,
  Clock,
  TrendingUp,
  Lock,
  ChevronDown,
} from "lucide-react";

import { getDriveImageUrl } from "@/lib/driveImage";
import ClassSwitcherModal from "@/components/layout/ClassSwitcherModal";

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

interface Announcement {
  id: string;
  message: string | null;
  imageUrl: string | null;
  type: string; // "BANNER" | "SECTION"
  isActive: boolean;
  priority: number;
  createdAt: Date;
}

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  type: string; // "NOTE" | "PYQ" | "COURSE" | "LECTURE"
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null; // pipe-separated e.g. "Live Classes|Mentor Support"
  resourceId: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface Props {
  className: string;
  displayTitle: string;
  subjects: Subject[];
  announcements: Announcement[];
  premiumItems: PremiumItem[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUBJECTS: Subject[] = [
  {
    id: "mock-phy",
    name: "Physics",
    chapters: [
      { id: "mock-phy-c1", name: "Electrostatics & Capacitance", number: 1 },
      { id: "mock-phy-c2", name: "Current Electricity", number: 2 },
      { id: "mock-phy-c3", name: "Magnetic Effects of Current", number: 3 },
    ],
    notes: [
      { id: "mock-phy-n1", title: "Electrostatics – Class Notes", viewUrl: "https://drive.google.com/file/d/123/view", downloadFile: "#", chapterId: "mock-phy-c1" },
      { id: "mock-phy-n2", title: "Current Electricity – Quick Notes", viewUrl: "https://drive.google.com/file/d/124/view", downloadFile: "#", chapterId: "mock-phy-c2" },
    ],
    papers: [
      { id: "mock-phy-p1", title: "DPP 01 – Coulomb's Law", viewUrl: "#", downloadFile: "#", chapterId: "mock-phy-c1" },
      { id: "mock-phy-p2", title: "DPP 02 – Electric Potential", viewUrl: "#", downloadFile: "#", chapterId: "mock-phy-c1" },
    ],
    videos: [
      { id: "mock-phy-v1", title: "Coulomb's Law & Electric Forces", youtubeLink: "https://www.youtube.com/watch?v=jNQXAC9IVRw", pdfUrl: "#", chapterId: "mock-phy-c1", lectureNumber: 1 },
      { id: "mock-phy-v2", title: "Electric Potential & Capacitors", youtubeLink: "https://www.youtube.com/watch?v=jNQXAC9IVRw", pdfUrl: "#", chapterId: "mock-phy-c1", lectureNumber: 2 },
      { id: "mock-phy-v3", title: "Ohm's Law & Kirchhoff's Principles", youtubeLink: "https://www.youtube.com/watch?v=jNQXAC9IVRw", pdfUrl: "#", chapterId: "mock-phy-c2", lectureNumber: 1 },
    ],
    quizzes: [
      {
        id: "mock-phy-q1",
        title: "Electrostatics – Practice Quiz",
        chapterId: "mock-phy-c1",
        questions: [
          { id: "mq1", questionText: "What is the electric field inside a conducting hollow sphere?", imageUrl: null, type: "MCQ", options: "Zero|Infinite|Same as surface|Depends on radius", answer: "Zero", explanation: "Charges reside on the outer surface, so net field inside is zero.", timeLimit: 30 },
          { id: "mq2", questionText: "How does capacitance change when a dielectric slab is inserted?", imageUrl: null, type: "MCQ", options: "Decreases|Increases by factor K|Remains same|Becomes zero", answer: "Increases by factor K", explanation: "C = K × C₀ where K is the dielectric constant.", timeLimit: 30 },
        ],
      },
    ],
  },
  {
    id: "mock-chem",
    name: "Chemistry",
    chapters: [
      { id: "mock-chem-c1", name: "Chemical Kinetics & Rates", number: 1 },
      { id: "mock-chem-c2", name: "Coordination Compounds", number: 2 },
    ],
    notes: [
      { id: "mock-chem-n1", title: "Chemical Kinetics – Lecture Notes", viewUrl: "https://drive.google.com/file/d/125/view", downloadFile: "#", chapterId: "mock-chem-c1" },
    ],
    papers: [
      { id: "mock-chem-p1", title: "DPP 01 – First Order Equations", viewUrl: "#", downloadFile: "#", chapterId: "mock-chem-c1" },
    ],
    videos: [
      { id: "mock-chem-v1", title: "Order & Molecularity of Reactions", youtubeLink: "https://www.youtube.com/watch?v=jNQXAC9IVRw", pdfUrl: "#", chapterId: "mock-chem-c1", lectureNumber: 1 },
    ],
    quizzes: [
      {
        id: "mock-chem-q1",
        title: "Kinetics – Practice Quiz",
        chapterId: "mock-chem-c1",
        questions: [
          { id: "mc1", questionText: "Unit of rate constant for a first order reaction?", imageUrl: null, type: "MCQ", options: "mol L⁻¹ s⁻¹|L mol⁻¹ s⁻¹|s⁻¹|L² mol⁻² s⁻¹", answer: "s⁻¹", explanation: "For first order: rate = k[A], so k has unit 1/time = s⁻¹.", timeLimit: 30 },
        ],
      },
    ],
  },
  {
    id: "mock-math",
    name: "Mathematics",
    chapters: [
      { id: "mock-math-c1", name: "Limits, Continuity & Differentiability", number: 1 },
      { id: "mock-math-c2", name: "Matrices & Determinants", number: 2 },
    ],
    notes: [
      { id: "mock-math-n1", title: "Limits – Summary Notes", viewUrl: "https://drive.google.com/file/d/126/view", downloadFile: "#", chapterId: "mock-math-c1" },
    ],
    papers: [
      { id: "mock-math-p1", title: "DPP 01 – L'Hôpital Problems", viewUrl: "#", downloadFile: "#", chapterId: "mock-math-c1" },
    ],
    videos: [
      { id: "mock-math-v1", title: "Limits & Special Cases", youtubeLink: "https://www.youtube.com/watch?v=jNQXAC9IVRw", pdfUrl: "#", chapterId: "mock-math-c1", lectureNumber: 1 },
    ],
    quizzes: [
      {
        id: "mock-math-q1",
        title: "Limits – Practice Quiz",
        chapterId: "mock-math-c1",
        questions: [
          { id: "mm1", questionText: "Evaluate: lim(x→0) sin(x)/x", imageUrl: null, type: "MCQ", options: "0|1|Undefined|Infinity", answer: "1", explanation: "This fundamental limit equals 1 by the squeeze theorem.", timeLimit: 30 },
        ],
      },
    ],
  },
];

// Premium courses are now fetched live from the database via props.
// This constant is intentionally removed.

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
    <img
      src={src}
      alt={alt}
      className={styles.videoThumbImg}
      onError={() => setIsError(true)}
    />
  );
};

// ─── Subject Color Map ────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  Physics:     { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", icon: "⚛️" },
  Chemistry:   { bg: "rgba(16,185,129,0.1)",  color: "#10b981", icon: "🧪" },
  Mathematics: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", icon: "📐" },
  Biology:     { bg: "rgba(236,72,153,0.1)",  color: "#ec4899", icon: "🧬" },
  English:     { bg: "rgba(6,182,212,0.1)",   color: "#06b6d4", icon: "📝" },
};

function getSubjectStyle(name: string) {
  return SUBJECT_COLORS[name] || { bg: "rgba(99,102,241,0.1)", color: "#6366f1", icon: "📚" };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClassDashboard({ className, displayTitle, subjects: propSubjects, announcements: propAnnouncements, premiumItems: propPremiumItems }: Props) {
  const subjects = useMemo(() => {
    return (propSubjects && propSubjects.length > 0) ? propSubjects : MOCK_SUBJECTS;
  }, [propSubjects]);

  const announcements = useMemo(() => {
    return propAnnouncements || [];
  }, [propAnnouncements]);

  const premiumItems = useMemo(() => {
    return propPremiumItems || [];
  }, [propPremiumItems]);

  // Main navigation tabs
  const [activeTab, setActiveTab] = useState<"home" | "study" | "premium" | "notices">("home");
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Study drill-down
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [classroomTab, setClassroomTab] = useState<"videos" | "notes" | "practice" | "quiz">("videos");

  // Modals
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; viewUrl: string; downloadUrl: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Premium
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Record<string, boolean>>({});

  // Progress
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Favorites
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Recent Video
  const [recentVideo, setRecentVideo] = useState<{ video: VideoType; subjectId: string; subjectName: string; } | null>(null);

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

  // Quiz
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

    // Save selected class to cookie for automatic homepage redirect
    if (className) {
      document.cookie = `selected_class=${encodeURIComponent(className)}; path=/; max-age=31536000; SameSite=Lax`;
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
      return { id: "general", name: "General Resources", number: 0 };
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



  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "BBA50") {
      setPromoStatus({ success: true, text: "✓ Code BBA50 applied! 50% extra discount unlocked." });
    } else {
      setPromoStatus({ success: false, text: "Invalid code. Try BBA50." });
    }
  };

  const handleEnroll = (courseId: string) => {
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      setEnrolledCourses(prev => ({ ...prev, [courseId]: true }));
    }, 1500);
  };

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

  // ─── Nav tabs config ──────────────────────────────────────────────────────
  const NAV_TABS = [
    { id: "home",    label: "Overview", icon: <LayoutGrid size={20} /> },
    { id: "study",   label: "Study",    icon: <BookOpen size={20} /> },
    { id: "premium", label: "Premium",  icon: <Star size={20} /> },
    { id: "notices", label: "Notices",  icon: <Bell size={20} /> },
  ];

  const goToTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.appShell}>

      {/* Class switcher banner — highly visible on mobile at the very top */}
      <div className={styles.classSelectorBanner}>
        <div className={styles.classSelectorInfo}>
          <span className={styles.classSelectorLabel}>Active Course / Level</span>
          <h3 className={styles.classSelectorName}>{displayTitle}</h3>
        </div>
        <button 
          className={styles.classSelectorBtn}
          onClick={() => setIsSwitcherOpen(true)}
        >
          Change Class
        </button>
      </div>

      {/* ── COMPACT CLASS HEADER: back link + class name + tabs in one row ── */}
      <div className={styles.classHeader}>
        <div className={styles.classHeaderInner}>
          <div className={styles.classHeaderLeft}>
            <Link href="/" className={styles.classBackBtn} title="Back to home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <button 
              className={styles.classSwitcherBtn} 
              onClick={() => setIsSwitcherOpen(true)}
              title="Switch Course"
            >
              <span>{displayTitle}</span>
              <ChevronDown size={14} className={styles.switcherChevron} />
            </button>
          </div>
          <nav className={styles.classHeaderTabs}>
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.classTabBtn} ${activeTab === tab.id ? styles.classTabBtnActive : ""}`}
                onClick={() => goToTab(tab.id as any)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.appMain}>

        {/* ══════════════════════════════
            HOME TAB
        ══════════════════════════════ */}
        {activeTab === "home" && (
          <div className={styles.tabContent}>

            {/* Quick Stats */}
            <div className={styles.statsRow}>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <VideoIcon size={18} />
                </div>
                <div className={styles.statInfo}>
                  <strong>{stats.videos}</strong>
                  <span>Videos</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FileText size={18} />
                </div>
                <div className={styles.statInfo}>
                  <strong>{stats.notes}</strong>
                  <span>Notes</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <BookOpen size={18} />
                </div>
                <div className={styles.statInfo}>
                  <strong>{stats.papers}</strong>
                  <span>Practice</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Trophy size={18} />
                </div>
                <div className={styles.statInfo}>
                  <strong>{stats.quizzes}</strong>
                  <span>Quizzes</span>
                </div>
              </div>
            </div>

            {/* Continue Learning */}
            {(() => {
              const video = recentVideo?.video || subjects[0]?.videos[0];
              const subjectName = recentVideo?.subjectName || subjects[0]?.name;
              const subjectId = recentVideo?.subjectId || subjects[0]?.id;
              
              if (!video) return null;
              
              const ytId = getYoutubeId(video.youtubeLink);
              const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
              return (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Continue Learning</h3>
                  <div
                    className={styles.continueCard}
                    onClick={() => {
                      setActiveTab("study");
                      setSelectedSubjectId(subjectId);
                      setSelectedChapterId(video.chapterId || null);
                      setClassroomTab("videos");
                    }}
                  >
                    <div className={styles.continueThumb}>
                      <VideoThumbnail src={thumb} alt={video.title} />
                      <div className={styles.videoPlayOverlay} style={{ opacity: 1, background: "rgba(0, 0, 0, 0.2)" }}>
                        <Play size={14} fill="white" color="white" />
                      </div>
                    </div>
                    <div className={styles.continueInfo}>
                      <span className={styles.continueMeta}>{subjectName} · Lecture {video.lectureNumber || 1}</span>
                      <p className={styles.continueTitle}>{video.title}</p>
                    </div>
                    <ChevronRight size={18} className={styles.continueArrow} />
                  </div>
                </section>
              );
            })()}

            {/* Subjects Quick Access */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Your Subjects</h3>
                <button className={styles.seeAllBtn} onClick={() => goToTab("study")}>
                  See All
                </button>
              </div>
              <div className={styles.subjectChips}>
                {subjects.map(sub => {
                  const style = getSubjectStyle(sub.name);
                  return (
                    <button
                      key={sub.id}
                      className={styles.subjectChip}
                      onClick={() => {
                        setActiveTab("study");
                        setSelectedSubjectId(sub.id);
                        if (sub.chapters.length === 0) {
                          setSelectedChapterId("general");
                          setClassroomTab("videos");
                        }
                      }}
                    >
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Featured Premium Course */}
            {premiumItems.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Upgrade Your Prep</h3>
                  <button className={styles.seeAllBtn} onClick={() => goToTab("premium")}>
                    See All
                  </button>
                </div>
                <div
                  className={styles.featuredCourseCard}
                  onClick={() => {
                    setSelectedCourse(premiumItems[0]);
                    setPromoStatus(null);
                    setPurchaseSuccess(false);
                  }}
                >
                  <div className={styles.featuredCourseBadge}>
                    {premiumItems[0].type}
                  </div>
                  {premiumItems[0].imageUrl && (
                    <div className={styles.featuredCourseImage}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getDriveImageUrl(premiumItems[0].imageUrl) || ""} alt={premiumItems[0].title} className={styles.featuredCourseImg} />
                    </div>
                  )}
                  <h4 className={styles.featuredCourseTitle}>{premiumItems[0].title}</h4>
                  <p className={styles.featuredCourseSub}>{premiumItems[0].description}</p>
                  <div className={styles.featuredCourseFooter}>
                    <div className={styles.featuredPrice}>
                      <strong>₹{premiumItems[0].price}</strong>
                      {premiumItems[0].originalPrice && <span>₹{premiumItems[0].originalPrice}</span>}
                    </div>
                    <div className={styles.featuredLink}>
                      <span>Explore Prep</span>
                      <ChevronRight size={14} className={styles.featuredArrow} />
                    </div>
                  </div>
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
                  <h2>Study</h2>
                  <p>Pick a subject to start learning</p>
                </div>
                <div className={styles.subjectList}>
                  {subjects.map(sub => {
                    const style = getSubjectStyle(sub.name);
                    const total = sub.videos.length + sub.notes.length + sub.papers.length;
                    return (
                      <div
                        key={sub.id}
                        className={styles.subjectRow}
                        onClick={() => {
                          setSelectedSubjectId(sub.id);
                          if (sub.chapters.length === 0) {
                            setSelectedChapterId("general");
                            setClassroomTab("videos");
                          }
                        }}
                      >
                        <div className={styles.cardTop}>
                          <div className={styles.iconBox}>
                            <BookOpen size={18} />
                          </div>
                        </div>
                        <h3 className={styles.cardTitle}>{sub.name}</h3>
                        <p className={styles.cardDesc}>
                          {sub.chapters.length} chapters · {total} resources
                        </p>
                        <div className={styles.cardFooter}>
                          <span className={styles.link}>Start learning</span>
                          <ChevronRight size={14} className={styles.rowArrow} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* LEVEL 2: Chapter list */}
            {selectedSubjectId && !selectedChapterId && activeSubject && (
              <>
                <div className={styles.breadcrumb}>
                  <button className={styles.breadcrumbBack} onClick={() => setSelectedSubjectId(null)}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  <span>{activeSubject.name}</span>
                </div>
                <div className={styles.pageHeading}>
                  <h2>{activeSubject.name}</h2>
                  <p>Select a chapter below</p>
                </div>
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
                      >
                        <div className={styles.chapterNum} style={{ background: "rgba(156,163,175,0.1)", color: "#9ca3af" }}>
                          #
                        </div>
                        <div className={styles.chapterInfo}>
                          <h4>General / Additional Resources</h4>
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
                    const style = getSubjectStyle(activeSubject.name);
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
                      >
                        <div className={styles.chapterNum} style={{ background: style.bg, color: style.color }}>
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
              </>
            )}

            {/* LEVEL 3: Chapter content */}
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
                      <div className={styles.emptyState}>
                        <VideoIcon size={36} opacity={0.3} />
                        <p>No videos yet</p>
                      </div>
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
                            title={done ? "Mark incomplete" : "Mark complete"}
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
                      <div className={styles.emptyState}>
                        <FileText size={36} opacity={0.3} />
                        <p>No notes yet</p>
                      </div>
                    ) : chapterContent.notes.map(note => {
                      const done = !!completedItems[note.id];
                      return (
                        <div
                          key={note.id}
                          className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                          onClick={() => setSelectedDoc({ title: note.title, viewUrl: note.viewUrl, downloadUrl: note.downloadFile })}
                        >
                          <div className={styles.docIcon} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
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
                    {chapterContent.dpps.length === 0 ? (
                      <div className={styles.emptyState}>
                        <BookOpen size={36} opacity={0.3} />
                        <p>No practice sheets yet</p>
                      </div>
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
                      <div className={styles.emptyState}>
                        <Trophy size={36} opacity={0.3} />
                        <p>No quizzes yet for this chapter</p>
                      </div>
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
                            style={{ padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Heart size={16} fill={favoritedIds.has(quiz.id) ? "#ef4444" : "none"} color={favoritedIds.has(quiz.id) ? "#ef4444" : "currentColor"} />
                          </button>
                          <button className={styles.startQuizBtn} onClick={() => startQuiz(quiz)}>
                            Start
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
              <h2>Premium Courses</h2>
              <p>Unlock premium study materials, solved papers, and video lectures</p>
            </div>

            {/* Value props */}
            <div className={styles.valueProps}>
              {[
                { icon: <FileText size={18} />, label: "Detailed Notes", color: "#10b981" },
                { icon: <Award size={18} />, label: "Solved Board PYQs", color: "#f59e0b" },
                { icon: <Sparkles size={18} />, label: "High-Yield Lectures", color: "#6366f1" },
              ].map((v, i) => (
                <div key={i} className={styles.valueProp} style={{ background: `${v.color}14`, color: v.color }}>
                  {v.icon}
                  <span>{v.label}</span>
                </div>
              ))}
            </div>

            {/* Course cards — fetched live from DB */}
            {premiumItems.length === 0 ? (
              <div className={styles.emptyState}>
                <Star size={36} opacity={0.3} />
                <p>No premium courses available yet</p>
              </div>
            ) : (
              <div className={styles.courseList}>
                {premiumItems.map(item => {
                  const enrolled = enrolledCourses[item.id];
                  const features = item.features ? item.features.split("|").filter(Boolean) : [];
                  const TYPE_BADGE_COLORS: Record<string, string> = {
                    COURSE: "#6366f1",
                    NOTE: "#10b981",
                    PYQ: "#f59e0b",
                    LECTURE: "#ec4899",
                  };
                  const badgeColor = TYPE_BADGE_COLORS[item.type] || "#6366f1";
                  return (
                    <div key={item.id} className={`${styles.courseCard} ${enrolled ? styles.courseCardEnrolled : ""}`}>
                      {item.imageUrl && (
                        <img
                          src={getDriveImageUrl(item.imageUrl) || ""}
                          alt={item.title}
                          style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "0.75rem" }}
                        />
                      )}
                      <div className={styles.courseBadge}>
                        {item.type}
                      </div>
                      <h4 className={styles.courseTitle}>{item.title}</h4>
                      <p className={styles.courseSub}>{item.description}</p>

                      {features.length > 0 && (
                        <div className={styles.courseFeatures}>
                          {features.map((f, i) => (
                            <div key={i} className={styles.courseFeature}>
                              <CheckCheck size={14} color="#10b981" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.courseFooter}>
                        <div className={styles.coursePrice}>
                          <strong>₹{item.price}</strong>
                          {item.originalPrice && <span>₹{item.originalPrice}</span>}
                        </div>
                        <button
                          className={enrolled ? styles.enrolledBtn : styles.enrollBtn}
                          onClick={() => {
                            if (enrolled) return;
                            setSelectedCourse(item);
                            setPromoStatus(null);
                            setPurchaseSuccess(false);
                          }}
                        >
                          {enrolled ? "✓ Enrolled" : "Enroll Now"}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <h2>Notices</h2>
              <p>Updates from your teachers</p>
            </div>
            <div className={styles.noticeList}>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bell size={36} opacity={0.3} />
                  <p>No notices posted yet</p>
                </div>
              ) : announcements.map(notice => {
                const isBanner = notice.type === "BANNER";
                const tagStyle = isBanner
                  ? { background: "rgba(245,158,11,0.1)", color: "#f59e0b" }
                  : { background: "rgba(99,102,241,0.1)", color: "#6366f1" };
                const tagLabel = isBanner ? "Important" : "Notice";
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(notice.createdAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  const hrs = Math.floor(mins / 60);
                  const days = Math.floor(hrs / 24);
                  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                  if (hrs > 0) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
                  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
                })();
                return (
                  <div key={notice.id} className={styles.noticeCard}>
                    <div className={styles.noticeTag} style={tagStyle}>
                      {tagLabel}
                    </div>
                    {notice.imageUrl && (
                      <img
                        src={getDriveImageUrl(notice.imageUrl) || ""}
                        alt="notice"
                        style={{ width: "100%", borderRadius: "8px", marginBottom: "0.75rem", objectFit: "cover", maxHeight: "180px" }}
                      />
                    )}
                    {notice.message && <p>{notice.message}</p>}
                    <span className={styles.noticeTime}>{timeAgo}</span>
                  </div>
                );
              })}
            </div>
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
                <button className={styles.modalClose} onClick={() => setSelectedVideo(null)}><X size={18} /></button>
              </div>

              <div className={styles.premiumPlayerGrid}>
                <div className={styles.playerContainer}>
                  <div className={styles.videoEmbed}>
                    {getYoutubeId(selectedVideo.youtubeLink) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.youtubeLink)}?autoplay=1&rel=0&modestbranding=1`}
                        allow="autoplay; fullscreen; picture-in-picture"
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
                    >
                      <Heart size={16} fill={favorited ? "#ef4444" : "none"} color={favorited ? "#ef4444" : "currentColor"} />
                      <span>{favorited ? "Favorited" : "Favorite"}</span>
                    </button>

                    <button 
                      className={`${styles.actionBtn} ${completed ? styles.actionBtnDoneActive : ""}`}
                      onClick={(e) => toggleComplete(selectedVideo.id, e)}
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
                <span className={styles.modalEyebrow}>Document</span>
                <h3 className={styles.modalTitle}>{selectedDoc.title}</h3>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a href={selectedDoc.downloadUrl} download className={styles.downloadBtn}>
                  <Download size={15} /> PDF
                </a>
                <button className={styles.modalClose} onClick={() => setSelectedDoc(null)}>
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
          MODAL: PREMIUM CHECKOUT
      ══════════════════════════════ */}
      {selectedCourse && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedCourse(null)}>
          <div className={styles.checkoutModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow} style={{ color: "#f59e0b" }}>Enroll Now</span>
                <h3 className={styles.modalTitle}>{selectedCourse.title}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedCourse(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.checkoutBody}>
              {!purchaseSuccess ? (
                <>
                  <div className={styles.checkoutSummary}>
                    <div className={styles.checkoutRow}>
                      <span>Original Price</span>
                      <span className={styles.strikePrice}>₹{selectedCourse.originalPrice ?? selectedCourse.price}</span>
                    </div>
                    {selectedCourse.originalPrice && (
                      <div className={styles.checkoutRow}>
                        <span>Discount</span>
                        <span className={styles.discountText}>-₹{Math.round(selectedCourse.originalPrice - selectedCourse.price)}</span>
                      </div>
                    )}
                    {promoStatus?.success && (
                      <div className={styles.checkoutRow}>
                        <span>Promo (BBA50)</span>
                        <span className={styles.discountText}>-₹{Math.round(selectedCourse.price / 2)}</span>
                      </div>
                    )}
                    <div className={`${styles.checkoutRow} ${styles.checkoutTotal}`}>
                      <span>Total</span>
                      <strong>₹{promoStatus?.success ? Math.round(selectedCourse.price / 2) : selectedCourse.price}</strong>
                    </div>
                  </div>

                  <div className={styles.promoRow}>
                    <input
                      className={styles.promoInput}
                      type="text"
                      placeholder="Promo code (try BBA50)"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                    />
                    <button className={styles.promoBtn} onClick={handleApplyPromo}>Apply</button>
                  </div>

                  {promoStatus && (
                    <p className={`${styles.promoMsg} ${promoStatus.success ? styles.promoSuccess : styles.promoError}`}>
                      {promoStatus.text}
                    </p>
                  )}

                  <button
                    className={styles.payBtn}
                    disabled={isPurchasing}
                    onClick={() => handleEnroll(selectedCourse.id)}
                  >
                    {isPurchasing ? "Processing..." : `Pay ₹${promoStatus?.success ? Math.round(selectedCourse.price / 2) : selectedCourse.price} via UPI`}
                  </button>
                </>
              ) : (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>✓</div>
                  <h4>You're enrolled!</h4>
                  <p>Access to <strong>{selectedCourse.title}</strong> is now unlocked.</p>
                  <button className={styles.enrollBtn} onClick={() => { setSelectedCourse(null); setActiveTab("premium"); }}>
                    Go to Course
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
                <span className={styles.modalEyebrow} style={{ color: "#ec4899" }}>Quiz</span>
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

      <ClassSwitcherModal 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
        currentClass={className}
      />

    </div>
  );
}
