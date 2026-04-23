import Link from "next/link";
import styles from "./page.module.css";
import { prisma } from "@/lib/prisma";
import { Announcement } from "@prisma/client";

// Revalidate every 60 seconds or make it dynamic
export const dynamic = 'force-dynamic';

import LiveAnalytics from "@/components/home/LiveAnalytics";

export default async function Home() {
  let announcements: Announcement[] = [];
  try {
    announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
      take: 3,
    });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
  }

  return (
    <div className={styles.container}>
      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
          {announcements[0].message}
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={`${styles.title} animate-fade-in`}>
          Free NBSE Study Material<br />
          <span className="text-gradient">for Classes 8 to 12</span>
        </h1>
        <p className={`${styles.subtitle} animate-fade-in`}>
          Access premium question papers, comprehensive notes, and curated video lectures to boost your academic performance.
        </p>
        <div className={`${styles.actions} animate-fade-in`}>
          <Link href="/papers" className="btn-primary">
            Explore Papers
          </Link>
          <Link href="/notes" className="btn-secondary">
            View Notes
          </Link>
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
          {[
            { cls: '8', icon: '🏫' },
            { cls: '9', icon: '🎒' },
            { cls: '10', icon: '📖' },
            { cls: '11', icon: '🎓' },
            { cls: '12', icon: '📜' },
            { cls: 'CUET', icon: '🎯' },
            { cls: 'JEE', icon: '🚀' },
            { cls: 'NEET', icon: '🩺' }
          ].map(({ cls, icon }) => (
            <Link key={cls} href={`/papers?class=${cls}`}>
              <div className={`glass-panel ${styles.card}`}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                <h3 className={`${styles.cardTitle} text-gradient`}>{['CUET', 'JEE', 'NEET'].includes(cls) ? cls : `Class ${cls}`}</h3>
                <p style={{ opacity: 0.8 }}>Study materials & past papers</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Previews placeholder */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Latest Content</h2>
        <div className={styles.grid}>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>📝 Recent Papers</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Browse the newest additions to our question paper library.</p>
            <Link href="/papers" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>📚 New Notes</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Get the latest study notes for Science and Maths.</p>
            <Link href="/notes" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>🎥 Latest Videos</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Watch new video lectures uploaded by our instructors.</p>
            <Link href="/videos" className="text-gradient">View all →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
