'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    
    if (folderMatch && folderMatch[1]) {
      // It's a Google Drive folder link
      viewerUrl = `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
    } else {
      // It's a regular file link. Convert view/edit/share links to preview links for iframe compatibility.
      viewerUrl = url.replace(/\/view.*$|\/edit.*$|\/share.*$/, "/preview");
    }
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
      {/* Platform Banner */}
      <div style={{ 
        backgroundColor: 'var(--primary)', 
        color: 'white', 
        padding: '6px 10px', 
        fontSize: '0.8rem', 
        textAlign: 'center',
        fontWeight: 500,
        letterSpacing: '0.3px'
      }}>
        🚀 Bounce Back Academy: Empowering your educational journey with premium study materials!
      </div>

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
          {/* Bug Fix #9: Back button was hardcoded to /notes even when viewing a paper.
              Using router.back() sends the user to wherever they came from. */}
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
          >
            <FaArrowLeft /> <span className="hide-mobile">Back</span>
          </button>
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

      {/* Bug Fix #4: <style jsx> is a Styled-JSX feature that only works in the
          Pages Router. In App Router it is silently ignored — use a plain <style> tag. */}
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
