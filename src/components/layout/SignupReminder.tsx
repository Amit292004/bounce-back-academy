"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SignupReminder() {
  const [visible, setVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default true = hidden until confirmed logged-out
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    // Always check auth — do NOT skip based on sessionStorage
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated === true) {
            setIsLoggedIn(true); // logged in → never show banner
            return;
          }
        }
        setIsLoggedIn(false);
      } catch {
        setIsLoggedIn(true); // network error → assume logged in, don't annoy users
      }
    };

    const fetchBranding = async () => {
      const cached = sessionStorage.getItem('bb_branding_logo');
      if (cached) {
        setSiteLogo(cached);
        return;
      }
      try {
        const res = await fetch('/api/admin/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.siteLogo) {
            setSiteLogo(data.siteLogo);
            sessionStorage.setItem('bb_branding_logo', data.siteLogo);
          }
        }
      } catch { }
    };

    checkAuth();
    fetchBranding();
  }, []);

  useEffect(() => {
    if (isLoggedIn) return; // logged in → do nothing
    if (sessionStorage.getItem('signup_reminder_dismissed')) return; // already dismissed
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('signup_reminder_dismissed', 'true');
  };

  // Double guard: never render if logged in or not yet visible
  if (!visible || isLoggedIn) return null;

  return (
    <>
      <style>{`
        @keyframes sr-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(28px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes sr-borderSpin {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sr-iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }

        .sr-outer {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: calc(100% - 2rem);
          max-width: 520px;
          animation: sr-slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .sr-border {
          padding: 1.5px;
          border-radius: 18px;
          background: linear-gradient(135deg, #6366f1, #ec4899, #8b5cf6, #6366f1);
          background-size: 300% 300%;
          animation: sr-borderSpin 4s ease infinite;
          box-shadow:
            0 0 24px rgba(99,102,241,0.3),
            0 0 48px rgba(139,92,246,0.15),
            0 12px 40px rgba(0,0,0,0.2);
        }

        .sr-card {
          border-radius: 17px;
          background: var(--surface);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          padding: 0.9rem 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          position: relative;
          overflow: hidden;
        }

        .sr-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(99,102,241,0.06) 0%,
            rgba(139,92,246,0.03) 50%,
            rgba(236,72,153,0.05) 100%
          );
          pointer-events: none;
          border-radius: inherit;
        }

        .sr-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          animation: sr-iconPulse 2.5s ease-in-out infinite;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }
        .sr-icon-img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .sr-body {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .sr-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--foreground);
          margin: 0 0 0.18rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .sr-badge {
          font-size: 0.58rem;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sr-sub {
          font-size: 0.75rem;
          color: var(--foreground);
          opacity: 0.55;
          margin: 0;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sr-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1.1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
          border: none;
          cursor: pointer;
        }
        .sr-cta:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 24px rgba(99,102,241,0.55);
        }
        .sr-cta:active {
          transform: scale(0.97);
        }

        .sr-close {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--surface);
          border: 1.5px solid var(--surface-border);
          color: var(--foreground);
          opacity: 0.9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 800;
          transition: all 0.2s ease;
          z-index: 100;
          line-height: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .sr-close:hover {
          opacity: 1;
          transform: rotate(90deg) scale(1.15);
          background: var(--error);
          color: white;
          border-color: var(--error);
        }

        @media (max-width: 400px) {
          .sr-sub { display: none; }
          .sr-card { gap: 0.65rem; padding: 0.75rem 0.85rem; }
          .sr-cta { padding: 0.45rem 0.85rem; font-size: 0.75rem; }
        }
      `}</style>

      <div
        className="sr-outer"
        style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'calc(100% - 2rem)', maxWidth: '520px' }}
      >
        {/* Close button OUTSIDE clipping containers */}
        <button onClick={handleDismiss} className="sr-close" aria-label="Dismiss">✕</button>

        <div className="sr-border">
          <div className="sr-card">
            <div className="sr-icon">
              <img 
                src={siteLogo || "/logo.png"} 
                alt="Bounce Back Academy Logo" 
                className="sr-icon-img"
              />
            </div>
            <div className="sr-body">
              <p className="sr-title">
                Create your free account!
                <span className="sr-badge">Free</span>
              </p>
              <p className="sr-sub">
                Save favorites, track progress &amp; unlock all study materials.
              </p>
            </div>
            <Link href="/register" onClick={handleDismiss} className="sr-cta">
              Get Started →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
