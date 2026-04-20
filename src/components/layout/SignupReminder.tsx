"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTimes, FaUserPlus } from 'react-icons/fa';

export default function SignupReminder() {
  const [visible, setVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // assume logged in until proven otherwise

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('signup_reminder_dismissed')) return;

    // Check auth status
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsLoggedIn(true);
            return;
          }
        }
        setIsLoggedIn(false);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // Show the banner after 5 seconds of browsing (non-intrusive)
  useEffect(() => {
    if (isLoggedIn) return;
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('signup_reminder_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      width: 'calc(100% - 2rem)',
      maxWidth: '520px',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(139,92,246,0.95))',
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        boxShadow: '0 8px 32px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        color: 'white',
        position: 'relative',
      }}>
        {/* Icon */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0,
        }}>
          <FaUserPlus />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>
            📚 Create your free account!
          </p>
          <p style={{ fontSize: '0.78rem', opacity: 0.85, lineHeight: 1.3 }}>
            Save favorites, track progress & get access to all study materials.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/register"
          onClick={handleDismiss}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            background: 'white',
            color: '#6366f1',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'transform 0.2s',
          }}
        >
          Join Now
        </Link>

        {/* Close */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: '-8px', right: '-8px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', color: 'white',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem',
          }}
        >
          <FaTimes />
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
