'use client';

import React, { use } from 'react';
import { getDownloadLink, handleDownload } from '@/lib/utils';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

interface ViewPageProps {
  searchParams: Promise<{
    url?: string;
    title?: string;
  }>;
}

export default function ViewPage({ searchParams }: ViewPageProps) {
  const { url, title } = use(searchParams);

  if (!url) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>No file specified</h1>
        <p>Please select a file from the notes or papers section.</p>
        <Link href="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaArrowLeft /> Back to Home
        </Link>
      </div>
    );
  }

  // Handle Google Drive links specifically for the viewer
  let viewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  
  if (url.includes("drive.google.com")) {
    // Convert view/edit/share links to preview links for iframe compatibility
    viewerUrl = url.replace(/\/view.*$|\/edit.*$|\/share.*$/, "/preview");
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh', // Use dynamic viewport height for mobile
      width: '100%',
      position: 'fixed', // Lock to screen to prevent double scrolling
      top: 0,
      left: 0,
      zIndex: 1000,
      backgroundColor: 'var(--background)'
    }}>
      {/* Permission Reminder for Drive Files */}
      {url.includes("drive.google.com") && (
        <div style={{ 
          backgroundColor: 'var(--primary)', 
          color: 'white', 
          padding: '4px 10px', 
          fontSize: '0.75rem', 
          textAlign: 'center',
          fontWeight: 500
        }}>
          💡 Tip: If you see an "Access Denied" error, please make sure the file is shared as "Anyone with the link" in Google Drive.
        </div>
      )}

      {/* Viewer Header - Theme Matched */}
      <div style={{ 
        padding: '0.6rem 0.75rem', 
        backgroundColor: 'var(--surface)', 
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1001
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '70%' }}>
          <Link href="/notes" style={{ color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
            <FaArrowLeft /> <span className="hide-mobile">Back</span>
          </Link>
          <h1 style={{ 
            fontSize: '0.95rem', 
            margin: 0, 
            color: 'var(--foreground)', 
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {title || "Study Material"}
          </h1>
        </div>
        
        <button 
          onClick={() => handleDownload(getDownloadLink(url), `${title || 'document'}.pdf`)}
          className="btn-primary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <FaDownload /> <span className="hide-mobile">Download</span>
        </button>
      </div>

      {/* PDF Iframe Container */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#525659', // Classic PDF background color
        position: 'relative',
        overflow: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        <iframe
          src={viewerUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={title || "PDF Viewer"}
        />
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
