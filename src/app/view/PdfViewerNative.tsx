'use client';

import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { MdOutlineZoomOutMap } from 'react-icons/md';

// Worker must be in the same module as Document/Page (react-pdf v10 requirement)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerNativeProps {
  url: string;
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

/* ── Spinner ── */
function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 36, height: 36,
        borderRadius: '50%',
        border: '3px solid color-mix(in srgb, var(--primary) 20%, transparent)',
        borderTopColor: 'var(--primary)',
      }}
    />
  );
}

/* ── A4 Skeleton page ── */
function PageSkeleton({ width }: { width: number }) {
  const height = Math.round(width * 1.414);
  return (
    <div style={{
      width, height,
      borderRadius: 10,
      background: 'var(--skeleton-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <motion.div
        animate={{ x: ['-60%', '160%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.2 }}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '40%', height: '100%',
          background: 'linear-gradient(90deg, transparent, var(--skeleton-shine), transparent)',
        }}
      />
    </div>
  );
}

/* ── HUD pill button ── */
function HudBtn({
  onClick, disabled = false, title, children,
}: {
  onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        color: disabled ? 'color-mix(in srgb, var(--foreground) 18%, transparent)' : 'color-mix(in srgb, var(--foreground) 80%, transparent)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: 40, height: 40,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
        transition: 'color 0.12s ease, background 0.12s ease',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--surface-highlight)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      {children}
    </motion.button>
  );
}

export default function PdfViewerNative({ url }: PdfViewerNativeProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [docLoading, setDocLoading] = useState(true);
  const [inputPage, setInputPage] = useState('1');
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(720);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setPageWidth(Math.max(280, Math.min(w - 64, 840)));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setDocLoading(false);
  }, []);

  const goToPrev = useCallback(() => {
    setPageNumber(p => { const n = Math.max(1, p - 1); setInputPage(String(n)); return n; });
  }, []);
  const goToNext = useCallback(() => {
    setPageNumber(p => { const n = Math.min(numPages, p + 1); setInputPage(String(n)); return n; });
  }, [numPages]);
  const zoomIn = useCallback(() => setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2))), []);
  const resetZoom = useCallback(() => setScale(1.0), []);

  const commitPage = () => {
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) setPageNumber(p);
    else setInputPage(String(pageNumber));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToNext, goToPrev, zoomIn, zoomOut, resetZoom]);

  const readPct = numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        paddingBottom: '7rem',
        // Radial glow that follows the center of the viewport
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
      }}
    >
      {/* ── Top progress sliver ── */}
      {!docLoading && numPages > 0 && (
        <div style={{ position: 'sticky', top: 0, width: '100%', height: 2, background: 'rgba(255,255,255,0.04)', zIndex: 20, flexShrink: 0 }}>
          <motion.div
            animate={{ width: `${readPct}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)', borderRadius: '0 2px 2px 0' }}
          />
        </div>
      )}

      {/* ── Document ── */}
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={() => setDocLoading(false)}
          loading={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: 400, justifyContent: 'center' }}>
              <Spinner />
              <p style={{ color: 'color-mix(in srgb, var(--foreground) 30%, transparent)', fontSize: '0.8rem', margin: 0 }}>Loading document…</p>
            </div>
          }
          error={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center', padding: '3rem 2rem', maxWidth: 320,
                background: 'color-mix(in srgb, var(--error) 7%, transparent)',
                border: '1px solid color-mix(in srgb, var(--error) 18%, transparent)',
                borderRadius: 16,
                margin: '3rem auto',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ color: 'var(--error)', fontWeight: 700, marginBottom: 8 }}>Could not load PDF</p>
              <p style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                This file may be restricted. Try downloading it directly.
              </p>
            </motion.div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -6 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                // The "glowing page" effect from the mockup
                boxShadow: `
                  0 0 0 1px rgba(139,92,246,0.15),
                  0 20px 60px rgba(0,0,0,0.7),
                  0 0 80px rgba(99,102,241,0.08)
                `,
              }}
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth * scale}
                loading={<PageSkeleton width={pageWidth * scale} />}
                renderTextLayer
                renderAnnotationLayer
              />
            </motion.div>
          </AnimatePresence>
        </Document>
      </div>

      {/* ── Bottom HUD ── */}
      {!docLoading && numPages > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            borderRadius: 16,
            padding: '6px 10px',
            boxShadow: 'var(--shadow-md), 0 0 30px color-mix(in srgb, var(--primary) 10%, transparent)',
          }}
        >
          {/* Page nav */}
          <HudBtn onClick={goToPrev} disabled={pageNumber <= 1} title="Previous page (←)">
            <FaChevronLeft size={13} />
          </HudBtn>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 8px',
            borderRight: '1px solid var(--surface-border)',
            borderLeft: '1px solid var(--surface-border)',
            margin: '0 2px',
          }}>
            <input
              type="number"
              value={inputPage}
              onChange={e => setInputPage(e.target.value)}
              onBlur={commitPage}
              onKeyDown={e => e.key === 'Enter' && commitPage()}
              aria-label="Page number"
              style={{
                width: `${Math.max(2, String(numPages).length + 1)}ch`,
                textAlign: 'center',
                background: 'var(--surface-highlight)',
                border: '1px solid var(--surface-border)',
                borderRadius: 8,
                color: 'var(--foreground)',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '5px 6px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlurCapture={e => { e.target.style.borderColor = 'var(--surface-border)'; }}
            />
            <span style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)', fontSize: '0.8rem', fontWeight: 600, paddingRight: 4 }}>
              / {numPages}
            </span>
          </div>

          <HudBtn onClick={goToNext} disabled={pageNumber >= numPages} title="Next page (→)">
            <FaChevronRight size={13} />
          </HudBtn>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

          {/* Zoom */}
          <HudBtn onClick={zoomOut} disabled={scale <= MIN_SCALE} title="Zoom out (-)">
            <FaSearchMinus size={13} />
          </HudBtn>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={resetZoom}
            title="Reset zoom (0)"
            style={{
              background: scale !== 1.0 ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: scale !== 1.0 ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              color: scale !== 1.0 ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: 50,
              textAlign: 'center',
              transition: 'all 0.15s ease',
              letterSpacing: '0.3px',
            }}
          >
            {Math.round(scale * 100)}%
          </motion.button>

          <HudBtn onClick={zoomIn} disabled={scale >= MAX_SCALE} title="Zoom in (+)">
            <FaSearchPlus size={13} />
          </HudBtn>
        </motion.div>
      )}

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
