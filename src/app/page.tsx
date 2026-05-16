import Link from "next/link";
import styles from "./page.module.css";
import announcementStyles from "@/components/home/AnnouncementsSection.module.css";
import { prisma } from "@/lib/prisma";
import { Announcement } from "@prisma/client";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Revalidate every 60 seconds or make it dynamic
export const dynamic = 'force-dynamic';

import LiveAnalytics from "@/components/home/LiveAnalytics";

import { FileText, BookOpen, Video, Heart, Megaphone, MessageSquare, Mail, Sparkles } from "lucide-react";

import AnnouncementBadge from "@/components/home/AnnouncementBadge";

export default async function Home() {
  let announcements: Announcement[] = [];
  let userClass: string | null = null;

  try {
    // Fetch announcements
    announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });

    // Fetch user class for smart redirects
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId as string },
          select: { class: true }
        });
        userClass = user?.class || null;
      }
    }
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
  }

  const bannerAnnouncements = announcements.filter((a: Announcement) => a.type === 'BANNER');

  return (
    <div className={styles.container}>
      {/* Top Banner (Text Only) */}
      {bannerAnnouncements.length > 0 && (
        <div className={styles.topBanner}>
          {bannerAnnouncements[0].message}
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={`${styles.title} animate-fade-in`}>
            Free NBSE Study Material<br />
            <span className="text-gradient">for Classes 8 to 12</span>
          </h1>
          <p className={`${styles.subtitle} animate-fade-in`}>
            Access premium question papers, comprehensive notes, and curated video lectures to boost your academic performance.
          </p>
          <div className={`${styles.actions} animate-fade-in`}>
            <Link href={userClass ? `/papers?class=${userClass}` : "/papers"} className={`${styles.heroBtn} ${styles.btnPapers}`}>
              <FileText size={20} /> Explore Papers
            </Link>
            <Link href={userClass ? `/notes?class=${userClass}` : "/notes"} className={`${styles.heroBtn} ${styles.btnNotes}`}>
              <BookOpen size={20} /> View Notes
            </Link>
            <Link href={userClass ? `/videos?class=${userClass}` : "/videos"} className={`${styles.heroBtn} ${styles.btnVideos}`}>
              <Video size={20} /> Watch Videos
            </Link>
            <Link href="/ask" className={`${styles.heroBtn} ${styles.btnAsk}`}>
              <Sparkles size={20} /> Doubt Solver
            </Link>
            <Link href="/announcements" className={`${styles.heroBtn} ${styles.btnAnnouncements}`} style={{ position: 'relative' }}>
              <Megaphone size={20} /> Announcements
              <AnnouncementBadge />
            </Link>
            <Link href="/feedback" className={`${styles.heroBtn} ${styles.btnFeedback}`}>
              <MessageSquare size={20} /> Feedback
            </Link>
            <Link href="/contact" className={`${styles.heroBtn} ${styles.btnContact}`}>
              <Mail size={20} /> Contact
            </Link>
            {userClass && (
              <Link href="/favorites" className={`${styles.heroBtn} ${styles.btnFavorites}`}>
                <Heart size={20} fill="currentColor" /> Favorites
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Live Analytics */}
      <div style={{ padding: '0 2rem' }}>
        <LiveAnalytics />
      </div>

      {/* Class-wise Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Select Your Class</h2>
        <div className={styles.grid}>
          <Link href="/class/8">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>Class 8</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/9">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎒</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>Class 9</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/10">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>Class 10</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/11">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>Class 11</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/12">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>Class 12</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/CUET">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>CUET</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/JEE">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>JEE</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
          <Link href="/class/NEET">
            <div className={`glass-panel ${styles.card}`}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩺</div>
              <h3 className={`${styles.cardTitle} text-gradient`}>NEET</h3>
              <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Content */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Latest Content</h2>
        <div className={styles.grid}>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              Recent Papers
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Browse the newest additions to our question paper library.</p>
            <Link href="/papers" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              New Notes
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Get the latest study notes for Science and Maths.</p>
            <Link href="/notes" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <path d="m22 8-6 4 6 4V8z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
              </svg>
              Latest Videos
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Watch new video lectures uploaded by our instructors.</p>
            <Link href="/videos" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <Sparkles size={24} color="#a855f7" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              AI Doubt Solver
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Get instant, step-by-step solutions for your NBSE, JEE, and NEET doubts.</p>
            <Link href="/ask" className="text-gradient">Try AI Tutor →</Link>
          </div>
        </div>
      </section>

      {/* Support & Connect Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Support &amp; Connect</h2>
        <div className={`${styles.grid} ${styles.supportGrid}`}>

          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Give Feedback
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Share your thoughts and help us improve your learning experience.</p>
            <Link href="/feedback" className="text-gradient">Share feedback →</Link>
          </div>

          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Contact Us
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Have a question or need help? We&apos;re here for you.</p>
            <Link href="/contact" className="text-gradient">Get in touch →</Link>
          </div>

          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Watch free video lectures and subscribe for updates.</p>
            <a href="https://www.youtube.com/@BounceBackAcademy" target="_blank" rel="noopener noreferrer" className="text-gradient">Follow us →</a>
          </div>

          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                <defs>
                  <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F58529" />
                    <stop offset="50%" stopColor="#DD2A7B" />
                    <stop offset="100%" stopColor="#515BD4" />
                  </linearGradient>
                </defs>
                <path fill="url(#igGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Follow us for tips, updates, and study motivation on Instagram.</p>
            <a href="https://www.instagram.com/bouncebackacdemy?igsh=MWN0NmFic2hlbDhzdw==" target="_blank" rel="noopener noreferrer" className="text-gradient">Follow us →</a>
          </div>

        </div>
      </section>
    </div>
  );
}
