"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    logger.error("[app error boundary]", error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h2>
      <p style={{ opacity: 0.7, maxWidth: '400px' }}>
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '0.8rem',
          maxWidth: '600px',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
        }}>
          {error.message}
        </pre>
      )}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
