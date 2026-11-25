"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdPage() {
  const router = useRouter();

  useEffect(() => {
    // After WhatsApp has scraped the OG tags, redirect the actual user to homepage
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'var(--background)',
      color: 'var(--foreground)',
      fontFamily: 'var(--font-inter, Inter, sans-serif)',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid var(--surface-border)',
        borderTopColor: 'var(--foreground)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '0.95rem', color: 'var(--secondary)' }}>Redirecting you to Bounce Back Academy…</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
