"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
          transition: bottom 0.3s ease;
        }

        @media (max-width: 768px) {
          .sr-outer {
            bottom: calc(4.5rem + env(safe-area-inset-bottom));
          }
        }

        .sr-border {
          padding: 1.5px;
          border-radius: 18px;
          background: var(--primary);
          box-shadow: var(--shadow-glow-lg);
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
            color-mix(in srgb, var(--primary) 8%, transparent) 0%,
            transparent 100%
          );
          pointer-events: none;
          border-radius: inherit;
        }

        .sr-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--primary) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          animation: sr-iconPulse 2.5s ease-in-out infinite;
          box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 15%, transparent);
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
          color: var(--primary-foreground);
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          background: var(--primary);
          box-shadow: var(--shadow-glow);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
          border: none;
          cursor: pointer;
        }
        .sr-cta:hover {
          transform: translateY(-2px) scale(1.04);
          background: var(--primary-hover);
          box-shadow: var(--shadow-glow-lg);
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

      <div className="sr-outer">
        {/* Close button OUTSIDE clipping containers */}
        <button onClick={handleDismiss} className="sr-close" aria-label="Dismiss">✕</button>

        <div className="sr-border">
          <div className="sr-card">
            <div className="sr-icon">
              <Image 
                src={siteLogo || "/logo.png"} 
                alt="Bounce Back Academy Logo" 
                width={24}
                height={24}
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
