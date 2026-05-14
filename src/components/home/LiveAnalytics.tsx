"use client";

import React, { useState, useEffect } from 'react';
import { FaUsers, FaFileAlt, FaBookOpen, FaVideo, FaCircle } from 'react-icons/fa';

// Fix #6 + #7: StatBox is hoisted to module scope (not re-created each render),
// and `icon` is typed as React.ReactNode instead of `any`.
interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  isLoading: boolean;
}

function StatBox({ icon, label, value, color, isLoading }: StatBoxProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
      padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--surface)',
      border: '1px solid var(--surface-border)', minWidth: '160px', flex: 1,
      transition: 'var(--transition)',
    }}>
      <div style={{ color: color, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{isLoading ? '...' : value.toLocaleString()}</div>
      <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

export default function LiveAnalytics() {
  const [stats, setStats] = useState({
    users: 0,
    papers: 0,
    notes: 0,
    videos: 0,
    activeNow: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently ignore — will retry on next interval
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ padding: '2rem 0', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaCircle className="pulse" style={{ color: '#10b981', fontSize: '0.6rem' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>Live Platform Analytics</span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <StatBox icon={<FaUsers />} label="Students" value={stats.users} color="var(--primary)" isLoading={loading} />
        <StatBox icon={<FaFileAlt />} label="Papers" value={stats.papers} color="var(--secondary)" isLoading={loading} />
        <StatBox icon={<FaBookOpen />} label="Notes" value={stats.notes} color="var(--accent)" isLoading={loading} />
        <StatBox icon={<FaVideo />} label="Videos" value={stats.videos} color="#ef4444" isLoading={loading} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)', minWidth: '160px', flex: 1,
        }}>
          <div style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.25rem' }}><FaCircle className="pulse" /></div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{loading ? '...' : stats.activeNow}</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Now</div>
        </div>
      </div>
    </section>
  );
}
