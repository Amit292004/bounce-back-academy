"use client";

import { useEffect, useState } from "react";

export default function AnnouncementBadge() {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/announcements/latest');
        const data = await res.json();
        if (data.latestCreatedAt) {
          const lastSeen = localStorage.getItem('lastSeenAnnouncement');
          if (!lastSeen || new Date(data.latestCreatedAt) > new Date(lastSeen)) {
            setHasNew(true);
          }
        }
      } catch {}
    };
    check();
  }, []);

  if (!hasNew) return null;

  return (
    <span style={{ 
      position: 'absolute', 
      top: '-4px', 
      right: '-4px', 
      width: '12px', 
      height: '12px', 
      background: '#ef4444', 
      borderRadius: '50%', 
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
      border: '2px solid var(--background)' 
    }}></span>
  );
}
