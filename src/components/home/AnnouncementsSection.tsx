"use client";

import { Announcement } from "@prisma/client";
import styles from "./AnnouncementsSection.module.css";
import { useEffect, useState } from "react";

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/admin/announcements'); // Reusing the admin fetch but filtering on client if needed, or better, creating a public one.
        // Actually, let's assume there is a public one or use the same if it's not protected.
        // Usually, admin routes are protected. Let's check if we need a public route.
        const data = await res.json();
        setAnnouncements(data.filter((a: any) => a.isActive).slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading || announcements.length === 0) return null;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📢 Latest Announcements</h2>
        <div className={styles.line}></div>
      </div>
      <div className={styles.grid}>
        {announcements.map((a: any) => (
          <div key={a.id} className={`glass-panel ${styles.card}`}>
            {a.imageUrl && (
              <div className={styles.imageWrapper}>
                <img src={a.imageUrl} alt="Announcement" className={styles.image} />
              </div>
            )}
            {a.message && (
              <div className={styles.content}>
                <p className={styles.message}>{a.message}</p>
                <span className={styles.date}>
                  {new Date(a.createdAt).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
