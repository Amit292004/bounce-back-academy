'use client';

import React, { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getDownloadLink, handleDownload } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaArrowLeft, FaFilePdf } from 'react-icons/fa';

// react-pdf requires browser APIs (Canvas, Worker) — must skip SSR
const PdfViewerNative = dynamic(() => import('./PdfViewerNative'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

function ViewerSkeleton() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.1) 0%, transparent 70%)',
    }}>
      <div style={{
        width: '100%', maxWidth: 720,
        height: 'min(calc(720px * 1.414), 65vh)',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.12), 0 20px 60px rgba(0,0,0,0.6)',
        position: 'relative', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ x: ['-60%', '160%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.2 }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.07), transparent)',
          }}
        />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              border: '3px solid rgba(139,92,246,0.2)',
              borderTopColor: '#8b5cf6',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', margin: 0 }}>Loading…</p>
        </div>
      </div>
    </div>
  );
}

interface ViewPageProps {
  searchParams: Promise<{ url?: string; title?: string }>;
}

export default function ViewPage({ searchParams }: ViewPageProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cachedMe = sessionStorage.getItem('bb_student_me');
        if (cachedMe) {
          const data = JSON.parse(cachedMe);
          setIsAuthenticated(data.authenticated);
          setAuthReady(true);
        }
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('bb_student_me', JSON.stringify(data));
          if (!cachedMe) {
            setIsAuthenticated(data.authenticated);
            setAuthReady(true);
          }
        } else if (!cachedMe) {
          setIsAuthenticated(false);
          setAuthReady(true);
        }
      } catch {
        if (!sessionStorage.getItem('bb_student_me')) {
          setIsAuthenticated(false);
          setAuthReady(true);
        }
      }
    })();
  }, []);

  const { url, title } = use(searchParams);

  /* ── No URL ── */
  if (!url) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', textAlign: 'center', gap: '1.25rem',
        background: 'var(--background)',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--accent) 30%, transparent))',
            border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FaFilePdf style={{ fontSize: '1.8rem', color: 'var(--accent)' }} />
        </motion.div>
        <motion.h1
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em' }}
        >No file specified</motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)', maxWidth: 300, lineHeight: 1.6, fontSize: '0.9rem' }}
        >Select a document from the notes or papers section.</motion.p>
        <motion.div
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <Link href="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaArrowLeft size={12} /> Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const isGoogleDrive = url.includes('drive.google.com');

  let driveViewerUrl = '';
  if (isGoogleDrive) {
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) {
      driveViewerUrl = `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
    } else {
      driveViewerUrl = url.replace(/\/view.*$|\/edit.*$|\/share.*$/, '/preview');
    }
  }

  const handleDl = async () => {
    setDownloading(true);
    await handleDownload(getDownloadLink(url), `${title || 'document'}.pdf`);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100%',
      position: 'fixed', top: 0, left: 0,
      zIndex: 1000,
      background: 'var(--background)',
    }}>

      {/* ── Animated gradient stripe ── */}
      <div style={{
        height: 3, flexShrink: 0,
        background: 'linear-gradient(90deg, var(--primary), var(--primary-hover), var(--primary), var(--primary-hover), var(--primary))',
        backgroundSize: '300% 100%',
        animation: 'stripeFlow 4s linear infinite',
      }} />

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          height: 60, flexShrink: 0,
          background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)',
          gap: '1rem', zIndex: 50,
        }}
      >
        {/* Left: back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
          {/* Back button — matches the mockup square style */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width: 38, height: 38, flexShrink: 0,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease, border-color 0.15s ease',
              boxShadow: '0 0 12px color-mix(in srgb, var(--primary) 10%, transparent)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--primary) 25%, transparent)';
              (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--primary) 40%, transparent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--primary) 15%, transparent)';
              (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--primary) 25%, transparent)';
            }}
          >
            <FaArrowLeft size={14} />
          </motion.button>

          {/* Title */}
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              {title || 'Study Material'}
            </h1>
            <p style={{
              margin: 0, marginTop: 2,
              fontSize: '0.68rem',
              color: 'color-mix(in srgb, var(--foreground) 60%, transparent)',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              PDF Document
            </p>
          </div>
        </div>

        {/* Right: download — the glowing button from the mockup */}
        {!authReady ? (
           <div style={{ width: 100, height: 32, borderRadius: 10, background: 'var(--surface-highlight)' }} className="skeleton" />
        ) : !isAuthenticated ? (
          <Link
            href="/login"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              letterSpacing: '-0.01em',
            }}
          >
            <FaDownload size={12} /> Login to Download
          </Link>
        ) : (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleDl}
            disabled={downloading}
            aria-label="Download PDF"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 10,
              border: 'none',
              background: downloading
                ? 'var(--primary-hover)'
                : 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: downloading ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: downloading ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
              letterSpacing: '-0.01em',
            }}
          >
            <AnimatePresence mode="wait">
              {downloading ? (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              ) : (
                <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FaDownload size={12} />
                </motion.div>
              )}
            </AnimatePresence>
            {downloading ? 'Starting...' : 'Download'}
          </motion.button>
        )}
      </motion.header>

      {/* ── Viewer body ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isGoogleDrive ? (
          // Google Drive: iframe with a styled wrapper
          <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0d0d12' }}>
            {/* Subtle glow behind the iframe */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 0,
            }} />
            <iframe
              src={driveViewerUrl}
              style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }}
              title={title || 'PDF Viewer'}
              allow="autoplay"
            />
          </div>
        ) : (
          <PdfViewerNative url={url} />
        )}
      </div>

      <style>{`
        @media (max-width: 520px) {
          .hide-mobile { display: none !important; }
        }
        @keyframes stripeFlow {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  );
}
