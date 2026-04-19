"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    // Generate or get session ID for real-time tracking
    let sessionId = localStorage.getItem('bba_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('bba_session_id', sessionId);
    }

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        // Silently fail heartbeats
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 120000); // Heartbeat every 2 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
