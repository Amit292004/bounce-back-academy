import { prisma } from "@/lib/prisma";
import { Announcement } from "@prisma/client";
import styles from "./page.module.css";
import announcementStyles from "@/components/home/AnnouncementsSection.module.css";
import Link from "next/link";
import MarkSeen from "@/components/announcements/MarkSeen";

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  let announcements: Announcement[] = [];
  try {
    announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
  }

  return (
    <div className={styles.container}>
      <MarkSeen />
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>← Back to Home</Link>
        <h1 className={styles.title}>📢 All Announcements</h1>
        <p className={styles.subtitle}>Stay updated with the latest news and features from Bounce Back Academy.</p>
      </header>

      <div className={announcementStyles.grid} style={{ marginTop: '3rem' }}>
        {announcements.map((a: any) => (
          <div key={a.id} className={`glass-panel ${announcementStyles.card}`}>
            {a.imageUrl && (
              <div className={announcementStyles.imageWrapper}>
                <img src={a.imageUrl} alt="Announcement" className={announcementStyles.image} />
              </div>
            )}
            {(a.message || !a.imageUrl) && (
              <div className={announcementStyles.content}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className={styles.typeBadge} style={{ background: a.type === 'BANNER' ? 'var(--primary)' : 'var(--surface-highlight)' }}>
                        {a.type === 'BANNER' ? 'Alert' : 'Feature'}
                    </span>
                    <span className={announcementStyles.date}>
                        {new Date(a.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}
                    </span>
                </div>
                <p className={announcementStyles.message}>{a.message || "New Update Available"}</p>
              </div>
            )}
          </div>
        ))}
        {announcements.length === 0 && (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '4rem', opacity: 0.5 }}>
            No announcements found.
          </div>
        )}
      </div>
    </div>
  );
}
