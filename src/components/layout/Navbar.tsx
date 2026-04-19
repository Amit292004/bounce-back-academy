"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import ThemeToggle from '@/components/ThemeToggle';

interface AuthState {
  authenticated: boolean;
  email?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [scrolled, setScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const data = await res.json();
          setAuth(data);
        }
      } catch {
        // not logged in
      }
    };
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/admin/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.siteLogo) setSiteLogo(data.siteLogo);
        }
      } catch { }
    };
    checkAuth();
    fetchBranding();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/student/logout', { method: 'POST' });
    setAuth({ authenticated: false });
    router.refresh();
    setMenuOpen(false);
  };

  const navLinks = [
    { label: 'Papers', href: '/papers' },
    { label: 'Notes', href: '/notes' },
    { label: 'Videos', href: '/videos' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header
      style={{
        position: 'sticky', top: '0', zIndex: 100,
        background: scrolled ? 'var(--surface)' : 'transparent',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid var(--surface-border)' : 'none',
        transition: 'var(--transition)',
        color: 'var(--foreground)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
          <img
            src={siteLogo || "/logo.png"}
            alt="Bounce Back Academy Logo"
            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>
            Bounce Back <span className="text-gradient">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: isActive(link.href) ? 600 : 500,
                color: isActive(link.href) ? 'var(--primary)' : 'var(--foreground)',
                background: isActive(link.href) ? 'rgba(99,102,241,0.1)' : 'transparent',
                fontSize: '0.9rem',
                transition: 'var(--transition)',
                opacity: isActive(link.href) ? 1 : 0.85,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-auth">
          {auth.authenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.8, fontSize: '0.85rem' }}>
                <FaUserCircle style={{ color: 'var(--primary)' }} />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(auth as any).name || (auth as any).email}</span>
              </div>
              <Link href="/profile" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Profile</Link>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Sign Up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem', display: 'none' }}
          className="mobile-menu-btn"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid var(--surface-border)', background: 'var(--background)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 500, background: isActive(link.href) ? 'rgba(99,102,241,0.1)' : 'transparent', color: isActive(link.href) ? 'var(--primary)' : 'var(--foreground)' }}>
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {auth.authenticated ? (
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                <Link href="/profile" className="btn-secondary" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="btn-secondary" style={{ flex: 1 }}>Logout</button>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="btn-primary" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-auth { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
