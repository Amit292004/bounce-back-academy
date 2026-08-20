"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/class/[classId]/page.module.css";
import {
  FileText,
  BookOpen,
  Video as VideoIcon,
  CheckCircle2,
  Play,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Heart,
  Trophy,
  X,
  Download,
  BookOpen as BookIcon,
  Bell,
  Lock,
  Sparkles,
} from "lucide-react";
import { FaArrowLeft, FaShoppingCart, FaShieldAlt, FaCreditCard, FaMobileAlt, FaTimes } from "react-icons/fa";
import { getDriveImageUrl } from "@/lib/driveImage";
import { getDownloadLink, handleDownload } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
}

interface VideoType {
  id: string;
  title: string;
  youtubeLink: string;
  pdfUrl: string | null;
  chapterId: string | null;
  lectureNumber: number;
}

interface Quiz {
  id: string;
  title: string;
  chapterId: string | null;
  questions: any[];
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

// ─── Video Thumbnail Helper ───────────────────────────────────────────────────

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

export default function PremiumCourseHubPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: classroom | description | notices
  const [activeTab, setActiveTab] = useState<"classroom" | "description" | "notices">("classroom");

  // Navigation Drill-down
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [classroomSubTab, setClassroomSubTab] = useState<"lectures" | "notes" | "dpps" | "quizzes">("lectures");

  // Interaction State
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Modals
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; viewUrl: string; downloadUrl: string } | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [payTab, setPayTab] = useState<"card" | "upi">("card");
  const [checkoutStep, setCheckoutStep] = useState<"details" | "processing" | "success">("details");
  const [loaderMessage, setLoaderMessage] = useState("Connecting to Gateway...");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchItemDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/premium/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);

        const compMap: Record<string, boolean> = {};
        (data.completedContentIds || []).forEach((id: string) => {
          compMap[id] = true;
        });
        setCompletedItems(compMap);
      } else {
        router.replace("/premium");
      }
    } catch (err) {
      logger.error("Error fetching course detail:", err);
      router.replace("/premium");
    } finally {
      setLoading(false);
    }
  }, [itemId, router]);

  useEffect(() => {
    if (itemId) {
      fetchItemDetail();
    }
  }, [itemId, fetchItemDetail]);

  // ─── Data Organization ──────────────────────────────────────────────────────
  const dbSubjects = useMemo(() => item?.subjects || [], [item]);
  const hasSubjects = dbSubjects.length > 0;

  const subjects: Subject[] = useMemo(() => {
    if (!item) return [];

    const allContents = item.contents || [];
    const allModules = item.modules || [];

    if (hasSubjects) {
      return dbSubjects.map((s: any) => {
        const sModules = allModules.filter((m: any) => m.subjectId === s.id);
        const chapters: Chapter[] = sModules.map((m: any, idx: number) => ({
          id: m.id,
          name: m.title,
          number: m.order !== undefined ? m.order + 1 : idx + 1,
        }));

        const sModuleIds = new Set(sModules.map((m: any) => m.id));
        const sContents = allContents.filter((c: any) => c.moduleId && sModuleIds.has(c.moduleId));

        const notes: Note[] = sContents
          .filter((c: any) => c.contentType === "NOTE")
          .map((c: any) => ({
            id: c.id,
            title: c.title,
            viewUrl: c.viewUrl || "",
            downloadFile: c.downloadUrl || "",
            chapterId: c.moduleId,
          }));

        const papers: QuestionPaper[] = sContents
          .filter((c: any) => c.contentType === "PAPER" || c.contentType === "DPP")
          .map((c: any) => ({
            id: c.id,
            title: c.title,
            viewUrl: c.viewUrl || "",
            downloadFile: c.downloadUrl || "",
            chapterId: c.moduleId,
          }));

        const quizzes: any[] = sContents
          .filter((c: any) => c.contentType === "TEST")
          .map((c: any) => ({
            id: c.id,
            title: c.title,
            testUrl: c.viewUrl || "",
            pdfUrl: c.downloadUrl || "",
            chapterId: c.moduleId,
          }));

        const videos: VideoType[] = sContents
          .filter((c: any) => c.contentType === "VIDEO")
          .map((c: any, idx: number) => ({
            id: c.id,
            title: c.title,
            youtubeLink: c.youtubeLink || "",
            pdfUrl: null,
            chapterId: c.moduleId,
            lectureNumber: c.sortOrder || idx + 1,
          }));

        return {
          id: s.id,
          name: s.name,
          chapters,
          notes,
          papers,
          videos,
          quizzes,
        };
      });
    }

    // Direct standalone course chapters (no separate subjects)
    const chapters: Chapter[] = allModules.map((m: any, idx: number) => ({
      id: m.id,
      name: m.title,
      number: m.order !== undefined ? m.order + 1 : idx + 1,
    }));

    const notes: Note[] = allContents
      .filter((c: any) => c.contentType === "NOTE")
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        viewUrl: c.viewUrl || "",
        downloadFile: c.downloadUrl || "",
        chapterId: c.moduleId || "general",
      }));

    const papers: QuestionPaper[] = allContents
      .filter((c: any) => c.contentType === "PAPER" || c.contentType === "DPP")
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        viewUrl: c.viewUrl || "",
        downloadFile: c.downloadUrl || "",
        chapterId: c.moduleId || "general",
      }));

    const quizzes: any[] = allContents
      .filter((c: any) => c.contentType === "TEST")
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        testUrl: c.viewUrl || "",
        pdfUrl: c.downloadUrl || "",
        chapterId: c.moduleId || "general",
      }));

    const videos: VideoType[] = allContents
      .filter((c: any) => c.contentType === "VIDEO")
      .map((c: any, idx: number) => ({
        id: c.id,
        title: c.title,
        youtubeLink: c.youtubeLink || "",
        pdfUrl: null,
        chapterId: c.moduleId || "general",
        lectureNumber: c.sortOrder || idx + 1,
      }));

    return [
      {
        id: "course-root",
        name: item.title,
        chapters,
        notes,
        papers,
        videos,
        quizzes,
      },
    ];
  }, [item, hasSubjects, dbSubjects]);

  const hasMultipleSubjects = subjects.length > 1;

  const activeSubject: Subject | null = useMemo(() => {
    if (hasMultipleSubjects) {
      if (selectedSubjectId) return subjects.find((s) => s.id === selectedSubjectId) || null;
      return null;
    }
    return subjects[0] || null;
  }, [hasMultipleSubjects, selectedSubjectId, subjects]);

  const activeChapter: Chapter | null = useMemo(() => {
    if (!activeSubject) return null;
    if (selectedChapterId === "general") {
      return { id: "general", name: "General / Extra Resources", number: 0 };
    }
    return activeSubject.chapters.find((c) => c.id === selectedChapterId) || null;
  }, [selectedChapterId, activeSubject]);

  const chapterContent = useMemo(() => {
    if (!activeSubject) return { videos: [], notes: [], dpps: [], quizzes: [] };
    const targetChapterId = selectedChapterId || (activeSubject.chapters.length === 0 ? "general" : null);
    if (!targetChapterId) return { videos: [], notes: [], dpps: [], quizzes: [] };

    if (targetChapterId === "general") {
      const chapterIds = new Set(activeSubject.chapters.map((c) => c.id));
      return {
        videos: activeSubject.videos.filter((v) => !v.chapterId || !chapterIds.has(v.chapterId)),
        notes: activeSubject.notes.filter((n) => !n.chapterId || !chapterIds.has(n.chapterId)),
        dpps: activeSubject.papers.filter((p) => !p.chapterId || !chapterIds.has(p.chapterId)),
        quizzes: activeSubject.quizzes.filter((q) => !q.chapterId || !chapterIds.has(q.chapterId)),
      };
    }
    return {
      videos: activeSubject.videos.filter((v) => v.chapterId === targetChapterId),
      notes: activeSubject.notes.filter((n) => n.chapterId === targetChapterId),
      dpps: activeSubject.papers.filter((p) => p.chapterId === targetChapterId),
      quizzes: activeSubject.quizzes.filter((q) => q.chapterId === targetChapterId),
    };
  }, [activeSubject, selectedChapterId]);

  const toggleComplete = async (contentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!item) return;

    const isDone = !!completedItems[contentId];
    const updated = { ...completedItems, [contentId]: !isDone };
    setCompletedItems(updated);

    try {
      await fetch(`/api/premium/${item.id}/complete`, {
        method: isDone ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
    } catch {
      setCompletedItems(completedItems);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(favoritedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setFavoritedIds(updated);
  };

  const getYoutubeId = (url: string | null | undefined) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&#?]{11})/);
    return match ? match[1] : null;
  };

  const getYoutubeEmbedUrl = (url: string | null | undefined) => {
    const id = getYoutubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    return url || "";
  };

  const getEmbedLink = (url: string) => {
    if (url.includes("drive.google.com/file/d/")) {
      return url.replace(/\/view(\?usp=sharing)?$/, "/preview");
    }
    return url;
  };

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleUnlockClick = async () => {
    setIsPurchasing(true);
    try {
      const res = await fetch("/api/premium/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumItemId: itemId }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          router.push(`/login?redirect=/premium/${itemId}`);
          return;
        }
        alert(data.error || "Failed to initiate purchase.");
        return;
      }
      const orderData = await res.json();
      if (orderData.alreadyUnlocked) {
        fetchItemDetail();
        return;
      }
      if (orderData.mode === "cashfree") {
        const loaded = await loadCashfreeScript();
        if (!loaded) {
          alert("Failed to load Cashfree SDK.");
          return;
        }
        const cashfree = new (window as any).Cashfree({ mode: orderData.environment || "production" });
        cashfree.checkout({ paymentSessionId: orderData.paymentSessionId, redirectTarget: "_self" });
      } else {
        setShowCheckout(true);
        setCheckoutStep("details");
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setUpiId("");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep("processing");
    setLoaderMessage("Connecting to Payment Gateway...");
    setTimeout(() => {
      setLoaderMessage("Verifying authorization...");
    }, 1200);
    setTimeout(() => {
      setLoaderMessage("Unlocking lifetime course access...");
    }, 2400);
    setTimeout(async () => {
      const res = await fetch("/api/premium/purchase/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumItemId: itemId, simulatedConfirm: true }),
      });
      if (res.ok) {
        setCheckoutStep("success");
        fetchItemDetail();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to complete payment.");
        setCheckoutStep("details");
      }
    }, 3600);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!item) return null;

  // ═════════════════════════════════════════════════════════════════════════════
  // 🔓 UNLOCKED CLASSROOM VIEW
  // ═════════════════════════════════════════════════════════════════════════════
  if (item.isUnlocked) {
    const PW_NAV_TABS = [
      { id: "classroom", label: "Classroom", icon: <BookOpen size={16} /> },
      { id: "description", label: "Description", icon: <LayoutGrid size={16} /> },
      { id: "notices", label: "Notices", icon: <Bell size={16} /> },
    ];

    return (
      <div className={styles.appShell}>
        {/* Compact Header Bar */}
        <div className={styles.classHeader}>
          <div className={styles.classHeaderInner}>
            <div className={styles.classHeaderLeft}>
              <Link href="/premium" className={styles.classBackBtn} title="Back to All Batches">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </Link>
              <div className={styles.classSwitcherBtn}>
                <span>{item.title}</span>
              </div>
            </div>

            <nav className={styles.classHeaderTabs}>
              {PW_NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.classTabBtn} ${activeTab === tab.id ? styles.classTabBtnActive : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "classroom") {
                      setSelectedSubjectId(null);
                      setSelectedChapterId(null);
                    }
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <main className={styles.appMain}>
          {/* ══════════════════════════════════════════════════════
              1. CLASSROOM TAB
          ══════════════════════════════════════════════════════ */}
          {activeTab === "classroom" && (
            <div className={styles.tabContent}>

              {/* LEVEL 1: Multi-Subject Grid (When MULTIPLE subjects are created) */}
              {hasMultipleSubjects && !selectedSubjectId && (
                <>
                  <div className={styles.pageHeading}>
                    <h2>All Subjects</h2>
                    <p>Select a subject to view its chapters and lessons</p>
                  </div>
                  <div className={styles.subjectList}>
                    {subjects.map((sub) => {
                      const totalResources = sub.videos.length + sub.notes.length + sub.papers.length;
                      return (
                        <div
                          key={sub.id}
                          className={styles.subjectRow}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setSelectedChapterId(null);
                          }}
                        >
                          <div className={styles.cardTop}>
                            <div className={styles.iconBox}>
                              <BookOpen size={18} />
                            </div>
                          </div>
                          <h3 className={styles.cardTitle}>{sub.name}</h3>
                          <p className={styles.cardDesc}>
                            {sub.chapters.length} chapters · {totalResources} materials
                          </p>
                          <div className={styles.cardFooter}>
                            <span className={styles.link}>Explore classes</span>
                            <ChevronRight size={14} className={styles.rowArrow} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* LEVEL 2: Chapters List under Active Subject / Course */}
              {activeSubject && !selectedChapterId && (
                <>
                  {hasMultipleSubjects && (
                    <div className={styles.breadcrumb}>
                      <button className={styles.breadcrumbBack} onClick={() => setSelectedSubjectId(null)}>
                        <ChevronLeft size={16} /> All Subjects
                      </button>
                      <span>{activeSubject.name}</span>
                    </div>
                  )}

                  <div className={styles.pageHeading}>
                    <h2>{activeSubject.name}</h2>
                    <p>
                      {activeSubject.chapters.length > 0
                        ? "Select a chapter to start learning"
                        : "No chapters added yet."}
                    </p>
                  </div>

                  {activeSubject.chapters.length > 0 ? (
                    <div className={styles.chapterList}>
                      {activeSubject.chapters.map((chap, idx) => {
                        const vids = activeSubject.videos.filter((v) => v.chapterId === chap.id).length;
                        const nts = activeSubject.notes.filter((n) => n.chapterId === chap.id).length;
                        const dps = activeSubject.papers.filter((p) => p.chapterId === chap.id).length;
                        const padNum = String(chap.number || idx + 1).padStart(2, "0");

                        return (
                          <div
                            key={chap.id}
                            className={styles.chapterRow}
                            onClick={() => {
                              setSelectedChapterId(chap.id);
                              setClassroomSubTab("lectures");
                            }}
                          >
                            <div className={styles.chapterNum} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", fontWeight: 800 }}>
                              {padNum}
                            </div>
                            <div className={styles.chapterInfo}>
                              <h4>{chap.name}</h4>
                              <div className={styles.chapterMeta}>
                                <span><VideoIcon size={12} /> {vids} Lectures</span>
                                <span><FileText size={12} /> {nts} Notes</span>
                                {dps > 0 && <span><BookOpen size={12} /> {dps} DPPs</span>}
                              </div>
                            </div>
                            <ChevronRight size={18} className={styles.rowArrow} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", borderRadius: "12px", opacity: 0.7 }}>
                      <p>No chapters created under {activeSubject.name} yet.</p>
                    </div>
                  )}
                </>
              )}

              {/* LEVEL 3: Inside Chapter (4 Sub-Tabs) */}
              {activeSubject && selectedChapterId && activeChapter && (
                <>
                  <div className={styles.breadcrumb}>
                    <button className={styles.breadcrumbBack} onClick={() => setSelectedChapterId(null)}>
                      <ChevronLeft size={16} /> {hasMultipleSubjects ? activeSubject.name : "All Chapters"}
                    </button>
                  </div>

                  <div className={styles.chapterBanner}>
                    {activeChapter.number > 0 && (
                      <span className={styles.chapterBannerNum}>Chapter {activeChapter.number}</span>
                    )}
                    <h3 className={styles.chapterBannerTitle}>{activeChapter.name}</h3>
                  </div>

                  {/* 4 PW Sub-Tabs */}
                  <div className={styles.subTabs}>
                    {[
                      { id: "lectures", label: "Lectures", icon: <VideoIcon size={15} /> },
                      { id: "notes", label: "Notes", icon: <FileText size={15} /> },
                      { id: "dpps", label: "DPPs", icon: <BookOpen size={15} /> },
                      { id: "quizzes", label: "Tests", icon: <Trophy size={15} /> },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={`${styles.subTab} ${classroomSubTab === tab.id ? styles.subTabActive : ""}`}
                        onClick={() => setClassroomSubTab(tab.id as any)}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* 1. LECTURES */}
                  {classroomSubTab === "lectures" && (
                    <div className={styles.contentList}>
                      {chapterContent.videos.length === 0 ? (
                        <div className={styles.emptyState}>
                          <VideoIcon size={36} opacity={0.3} />
                          <p>No video lectures in this chapter yet</p>
                        </div>
                      ) : (
                        chapterContent.videos.map((video, idx) => {
                          const ytId = getYoutubeId(video.youtubeLink);
                          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                          const done = !!completedItems[video.id];
                          const lecNumber = video.lectureNumber || idx + 1;

                          return (
                            <div
                              key={video.id}
                              className={`${styles.videoCard} ${done ? styles.videoCardDone : ""}`}
                              onClick={() => setSelectedVideo(video)}
                            >
                              <div className={styles.videoThumb}>
                                <VideoThumbnail src={thumb} alt={video.title} />
                                <div className={styles.videoPlayOverlay}>
                                  <Play size={16} fill="white" color="white" />
                                </div>
                              </div>
                              <div className={styles.videoInfo}>
                                <span className={styles.videoLabel}>LEC {lecNumber < 10 ? `0${lecNumber}` : lecNumber}</span>
                                <h4 className={styles.videoTitle}>{video.title}</h4>
                              </div>
                              <button
                                className={`${styles.favBtn} ${favoritedIds.has(video.id) ? styles.favBtnActive : ""}`}
                                onClick={(e) => toggleFavorite(video.id, e)}
                                title="Favorite"
                              >
                                <Heart
                                  size={20}
                                  fill={favoritedIds.has(video.id) ? "#ef4444" : "none"}
                                  color={favoritedIds.has(video.id) ? "#ef4444" : "currentColor"}
                                />
                              </button>
                              <button
                                className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                onClick={(e) => toggleComplete(video.id, e)}
                                title={done ? "Mark incomplete" : "Mark completed"}
                              >
                                <CheckCircle2 size={20} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 2. NOTES */}
                  {classroomSubTab === "notes" && (
                    <div className={styles.contentList}>
                      {chapterContent.notes.length === 0 ? (
                        <div className={styles.emptyState}>
                          <FileText size={36} opacity={0.3} />
                          <p>No notes in this chapter yet</p>
                        </div>
                      ) : (
                        chapterContent.notes.map((note) => {
                          const done = !!completedItems[note.id];
                          return (
                            <div
                              key={note.id}
                              className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                              onClick={() => {
                                if (note.viewUrl) setSelectedDoc({ title: note.title, viewUrl: note.viewUrl, downloadUrl: note.downloadFile });
                              }}
                            >
                              <div className={styles.docIcon} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                                <FileText size={20} />
                              </div>
                              <div className={styles.docInfo}>
                                <h4 className={styles.docTitle}>{note.title}</h4>
                              </div>
                              <div className={styles.docActions} onClick={(e) => e.stopPropagation()}>
                                {note.viewUrl && (
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() => setSelectedDoc({ title: note.title, viewUrl: note.viewUrl, downloadUrl: note.downloadFile })}
                                  >
                                    <BookIcon size={12} /> View Note
                                  </button>
                                )}
                                {note.downloadFile && (
                                  <button
                                    className={styles.actionBtnDownload}
                                    onClick={() => handleDownload(getDownloadLink(note.downloadFile), `${note.title}.pdf`)}
                                    title="Download PDF"
                                  >
                                    <Download size={13} />
                                  </button>
                                )}
                                <button
                                  className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                  onClick={(e) => toggleComplete(note.id, e)}
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 3. DPPS */}
                  {classroomSubTab === "dpps" && (
                    <div className={styles.contentList}>
                      {chapterContent.dpps.length === 0 ? (
                        <div className={styles.emptyState}>
                          <BookOpen size={36} opacity={0.3} />
                          <p>No DPPs in this chapter yet</p>
                        </div>
                      ) : (
                        chapterContent.dpps.map((paper) => {
                          const done = !!completedItems[paper.id];
                          return (
                            <div
                              key={paper.id}
                              className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                              onClick={() => {
                                if (paper.viewUrl) setSelectedDoc({ title: paper.title, viewUrl: paper.viewUrl, downloadUrl: paper.downloadFile });
                              }}
                            >
                              <div className={styles.docIcon} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                                <BookOpen size={20} />
                              </div>
                              <div className={styles.docInfo}>
                                <h4 className={styles.docTitle}>{paper.title}</h4>
                              </div>
                              <div className={styles.docActions} onClick={(e) => e.stopPropagation()}>
                                {paper.viewUrl && (
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() => setSelectedDoc({ title: paper.title, viewUrl: paper.viewUrl, downloadUrl: paper.downloadFile })}
                                  >
                                    <BookIcon size={12} /> View DPP
                                  </button>
                                )}
                                {paper.downloadFile && (
                                  <button
                                    className={styles.actionBtnDownload}
                                    onClick={() => handleDownload(getDownloadLink(paper.downloadFile), `${paper.title}.pdf`)}
                                    title="Download DPP"
                                  >
                                    <Download size={13} />
                                  </button>
                                )}
                                <button
                                  className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                  onClick={(e) => toggleComplete(paper.id, e)}
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 4. TESTS */}
                  {classroomSubTab === "quizzes" && (
                    <div className={styles.contentList}>
                      {chapterContent.quizzes.length === 0 ? (
                        <div className={styles.emptyState}>
                          <Trophy size={36} opacity={0.3} />
                          <p>No chapter tests scheduled yet</p>
                        </div>
                      ) : (
                        chapterContent.quizzes.map((test: any) => {
                          const done = !!completedItems[test.id];
                          return (
                            <div
                              key={test.id}
                              className={`${styles.docCard} ${done ? styles.docCardDone : ""}`}
                            >
                              <div className={styles.docIcon} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                                <Trophy size={20} />
                              </div>
                              <div className={styles.docInfo}>
                                <h4 className={styles.docTitle}>{test.title}</h4>
                              </div>
                              <div className={styles.docActions} onClick={(e) => e.stopPropagation()}>
                                {test.testUrl && (
                                  <a
                                    href={test.testUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.actionBtn}
                                    style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}
                                  >
                                    <Trophy size={12} /> Start Test
                                  </a>
                                )}
                                {test.pdfUrl && (
                                  <button
                                    className={styles.actionBtnDownload}
                                    onClick={() => handleDownload(getDownloadLink(test.pdfUrl), `${test.title}.pdf`)}
                                    title="Download Test Paper"
                                  >
                                    <Download size={13} />
                                  </button>
                                )}
                                <button
                                  className={`${styles.checkBtn} ${done ? styles.checkBtnDone : ""}`}
                                  onClick={(e) => toggleComplete(test.id, e)}
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              2. DESCRIPTION TAB
          ══════════════════════════════════════════════════════ */}
          {activeTab === "description" && (
            <div className={styles.tabContent}>
              <div className={styles.featuredCourseCard} style={{ cursor: "default" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span className={styles.featuredCourseBadge}>{item.type || "ONLINE BATCH"}</span>
                  {item.className && (
                    <span className={styles.featuredCourseBadge} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.2)" }}>
                      {item.className}
                    </span>
                  )}
                </div>

                {item.imageUrl && (
                  <div className={styles.featuredCourseImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getDriveImageUrl(item.imageUrl) || ""}
                      alt={item.title}
                      className={styles.featuredCourseImg}
                    />
                  </div>
                )}

                <h2 className={styles.featuredCourseTitle} style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>
                  {item.title}
                </h2>
                <p className={styles.featuredCourseSub} style={{ opacity: 0.8, lineHeight: 1.6, fontSize: "0.9rem" }}>
                  {item.description}
                </p>

                {item.features && (
                  <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--surface-border)", paddingTop: "1.25rem" }}>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Sparkles size={14} color="var(--primary)" /> What&apos;s Included:
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
                      {item.features.split("|").map((f: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <span>{f.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              3. NOTICES TAB
          ══════════════════════════════════════════════════════ */}
          {activeTab === "notices" && (
            <div className={styles.tabContent}>
              <div className={styles.pageHeading}>
                <h2>Notice Board ({item.notices?.length || 0})</h2>
                <p>Important batch announcements & live updates</p>
              </div>
              {!item.notices || item.notices.length === 0 ? (
                <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", borderRadius: "14px", border: "1px solid var(--surface-border)" }}>
                  <Bell size={36} opacity={0.3} style={{ margin: "0 auto 0.75rem" }} />
                  <h4 style={{ margin: "0 0 0.25rem" }}>No Announcements Yet</h4>
                  <p style={{ fontSize: "0.85rem", opacity: 0.6, margin: 0 }}>Important notices from faculty will appear here.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {item.notices.map((n: any) => {
                    const tag = n.tag || "ANNOUNCEMENT";
                    const isImportant = tag === "IMPORTANT";
                    const isExam = tag === "EXAM";
                    const isSchedule = tag === "SCHEDULE";
                    const badgeBg = isImportant ? "rgba(239, 68, 68, 0.12)" : isExam ? "rgba(16, 185, 129, 0.12)" : isSchedule ? "rgba(245, 158, 11, 0.12)" : "rgba(99, 102, 241, 0.12)";
                    const badgeColor = isImportant ? "#ef4444" : isExam ? "#10b981" : isSchedule ? "#f59e0b" : "var(--primary)";

                    return (
                      <div
                        key={n.id}
                        className="glass-panel"
                        style={{
                          padding: "1.25rem 1.5rem",
                          borderRadius: "14px",
                          border: "1px solid var(--surface-border)",
                          borderLeft: `4px solid ${badgeColor}`,
                          background: "var(--surface)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{
                            padding: "0.15rem 0.55rem",
                            borderRadius: "4px",
                            background: badgeBg,
                            color: badgeColor,
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            letterSpacing: "0.03em"
                          }}>
                            {tag}
                          </span>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{n.title}</h3>
                          <span style={{ fontSize: "0.75rem", opacity: 0.5, marginLeft: "auto" }}>
                            {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.8, margin: 0, whiteSpace: "pre-wrap" }}>
                          {n.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── MODALS ── */}
        {selectedVideo && (
          <div className={styles.modalOverlay} onClick={() => setSelectedVideo(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "840px" }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{selectedVideo.title}</h3>
                <button className={styles.modalClose} onClick={() => setSelectedVideo(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.videoEmbed}>
                  <iframe
                    src={getYoutubeEmbedUrl(selectedVideo.youtubeLink)}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={`${styles.modalCompleteBtn} ${completedItems[selectedVideo.id] ? styles.modalCompleteBtnDone : ""}`}
                  onClick={() => toggleComplete(selectedVideo.id)}
                >
                  <CheckCircle2 size={16} />
                  <span>{completedItems[selectedVideo.id] ? "Completed" : "Mark as Complete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedDoc && (
          <div className={styles.modalOverlay} onClick={() => setSelectedDoc(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{selectedDoc.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {selectedDoc.downloadUrl && (
                    <button
                      onClick={() => handleDownload(getDownloadLink(selectedDoc.downloadUrl), `${selectedDoc.title}.pdf`)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "6px",
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={13} /> Download
                    </button>
                  )}
                  <button className={styles.modalClose} onClick={() => setSelectedDoc(null)}>
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.modalBody} style={{ height: "70vh", minHeight: "450px" }}>
                <iframe src={getEmbedLink(selectedDoc.viewUrl)} title={selectedDoc.title} style={{ width: "100%", height: "100%", border: "none" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 🔒 LOCKED SALES PAGE (BEFORE PURCHASE)
  // ═════════════════════════════════════════════════════════════════════════════
  const featuresList = item.features ? item.features.split("|").map((f: string) => f.trim()).filter(Boolean) : [];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 1rem 5rem" }}>
      <Link href="/premium" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", marginBottom: "1.5rem" }}>
        <FaArrowLeft size={12} /> Back to Store
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", background: "var(--primary)", color: "white", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>{item.type}</span>
            {item.className && <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", background: "var(--surface-highlight)", border: "1px solid var(--surface-border)", fontSize: "0.7rem", fontWeight: 700 }}>{item.className}</span>}
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1.2, margin: "0 0 1rem" }}>{item.title}</h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, opacity: 0.75, marginBottom: "1.75rem" }}>{item.description}</p>

          {featuresList.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
              {featuresList.map((feat: string, idx: number) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.88rem", fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "14px", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 1rem" }}>📦 Curriculum Preview ({item.contents?.length || 0} items)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {(item.contents || []).map((c: any) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", background: "var(--surface-highlight)", borderRadius: "10px", border: "1px solid var(--surface-border)" }}>
                  {c.contentType === "VIDEO" ? <VideoIcon color="#ef4444" size={18} /> : <FileText color="#6366f1" size={18} />}
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "0.9rem" }}>{c.title}</strong>
                    <span style={{ display: "block", fontSize: "0.72rem", opacity: 0.55 }}>{c.contentType === "VIDEO" ? "Video Lecture" : "PDF Document"}</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", opacity: 0.5, fontWeight: 600 }}>
                    <Lock size={12} /> Locked
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: "sticky", top: "90px" }}>
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--surface-border)" }}>
            {item.imageUrl && (
              <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getDriveImageUrl(item.imageUrl) || ""} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.65rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>₹{item.price}</span>
              {item.originalPrice && <span style={{ fontSize: "1.1rem", opacity: 0.4, textDecoration: "line-through" }}>₹{item.originalPrice}</span>}
              {item.originalPrice && (
                <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.75rem", fontWeight: 800 }}>
                  {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <button
              onClick={handleUnlockClick}
              disabled={isPurchasing}
              className="btn-primary"
              style={{ width: "100%", padding: "0.95rem", fontSize: "1rem", fontWeight: 800, marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {isPurchasing ? "Processing Gateway..." : <><FaShoppingCart /> Unlock Access Now</>}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.75rem", opacity: 0.6, marginTop: "1rem" }}>
              <FaShieldAlt color="#10b981" />
              <span>Verified 256-bit Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className={styles.modalOverlay}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--surface-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>VIP Academy Checkout</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0.25rem 0 0" }}>{item.title}</h3>
              </div>
              {checkoutStep !== "processing" && (
                <button onClick={() => setShowCheckout(false)} style={{ background: "transparent", border: "1px solid var(--surface-border)", color: "var(--foreground)", borderRadius: "6px", padding: "0.4rem 0.55rem", cursor: "pointer" }}><FaTimes /></button>
              )}
            </div>

            {checkoutStep === "details" && (
              <form onSubmit={handleAuthorizePayment} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                <div style={{ background: "var(--surface-highlight)", borderRadius: "8px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Plan Access:</span>
                    <strong>{item.title}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Order Total:</span>
                    <strong style={{ color: "var(--primary)", fontSize: "1.1rem" }}>₹{item.price.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setPayTab("card")} style={{ flex: 1, padding: "0.6rem", borderRadius: "6px", border: `1px solid ${payTab === "card" ? "var(--primary)" : "var(--surface-border)"}`, background: payTab === "card" ? "rgba(99,102,241,0.1)" : "transparent", color: payTab === "card" ? "var(--primary)" : "var(--foreground)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <FaCreditCard size={12} /> Card Payment
                  </button>
                  <button type="button" onClick={() => setPayTab("upi")} style={{ flex: 1, padding: "0.6rem", borderRadius: "6px", border: `1px solid ${payTab === "upi" ? "var(--primary)" : "var(--surface-border)"}`, background: payTab === "upi" ? "rgba(99,102,241,0.1)" : "transparent", color: payTab === "upi" ? "var(--primary)" : "var(--foreground)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <FaMobileAlt size={12} /> UPI / QR
                  </button>
                </div>

                {payTab === "card" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "))} placeholder="4111 2222 3333 4444" style={{ padding: "0.75rem 1rem", borderRadius: "6px", border: "1.5px solid var(--surface-border)", background: "var(--surface-highlight)", color: "var(--foreground)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} required />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <input type="text" maxLength={5} value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").replace(/^(\d{2})(?=\d)/g, "$1/"))} placeholder="MM/YY" style={{ padding: "0.75rem 1rem", borderRadius: "6px", border: "1.5px solid var(--surface-border)", background: "var(--surface-highlight)", color: "var(--foreground)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} required />
                      <input type="password" maxLength={3} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} placeholder="CVV" style={{ padding: "0.75rem 1rem", borderRadius: "6px", border: "1.5px solid var(--surface-border)", background: "var(--surface-highlight)", color: "var(--foreground)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} required />
                    </div>
                  </div>
                ) : (
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="student@upi" style={{ padding: "0.75rem 1rem", borderRadius: "6px", border: "1.5px solid var(--surface-border)", background: "var(--surface-highlight)", color: "var(--foreground)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" }} required />
                )}

                <button type="submit" className="btn-primary" style={{ padding: "0.85rem", width: "100%", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <FaShieldAlt /> Authorize & Access Course
                </button>
              </form>
            )}

            {checkoutStep === "processing" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", padding: "2rem 0" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <strong>{loaderMessage}</strong>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Please do not refresh the page.</span>
              </div>
            )}

            {checkoutStep === "success" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", padding: "2rem 0" }}>
                <CheckCircle2 size={48} color="#10b981" />
                <h3>Welcome to the Course! 🎉</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Your access is now active and ready.</p>
                <button onClick={() => setShowCheckout(false)} className="btn-primary" style={{ width: "100%", padding: "0.85rem" }}>
                  Open Course Classroom <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
