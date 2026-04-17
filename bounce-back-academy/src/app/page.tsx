import Link from "next/link";
import styles from "./page.module.css";
import prisma from "@/lib/prisma";

// Revalidate every 60 seconds or make it dynamic
export const dynamic = 'force-dynamic';

export default async function Home() {
  const announcements = await prisma.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

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

      {/* Class-wise Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Select Your Class</h2>
        <div className={styles.grid}>
          {[8, 9, 10, 11, 12].map((cls) => (
            <Link key={cls} href={`/papers?class=${cls}`}>
              <div className={`glass-panel ${styles.card}`}>
                <h3 className={`${styles.cardTitle} text-gradient`}>Class {cls}</h3>
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
            <h3 className={styles.cardTitle}>Recent Papers</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Browse the newest additions to our question paper library.</p>
            <Link href="/papers" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>New Notes</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Get the latest study notes for Science and Maths.</p>
            <Link href="/notes" className="text-gradient">View all →</Link>
          </div>
          <div className={`glass-panel ${styles.card}`}>
            <h3 className={styles.cardTitle}>Latest Videos</h3>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>Watch new video lectures uploaded by our instructors.</p>
            <Link href="/videos" className="text-gradient">View all →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
