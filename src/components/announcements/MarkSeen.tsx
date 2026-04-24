"use client";

import { useEffect } from "react";

export default function MarkSeen() {
  useEffect(() => {
    localStorage.setItem('lastSeenAnnouncement', new Date().toISOString());
    window.dispatchEvent(new Event('announcementsSeen'));
  }, []);

  return null;
}
