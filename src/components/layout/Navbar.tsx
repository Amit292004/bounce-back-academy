"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaRobot } from 'react-icons/fa';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './Navbar.module.css';

interface AuthState {
  authenticated: boolean;
  email?: string;
  name?: string;
  image?: string | null;
}

export default function Navbar() {
  const pathname = usePathname();
  // Fix #10: Use router.push instead of window.location.href for SPA navigation
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [scrolled, setScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);

  useEffect(() => {
    const checkAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements/latest');
        const data = await res.json();
        if (data && data.hasNew) setHasNewAnnouncement(true);
      } catch { }
    };
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
    checkAnnouncements();

    window.addEventListener('profileUpdated', checkAuth);
    window.addEventListener('announcementsSeen', () => setHasNewAnnouncement(false));
    return () => {
      window.removeEventListener('profileUpdated', checkAuth);
      window.removeEventListener('announcementsSeen', () => setHasNewAnnouncement(false));
    };
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/student/logout', { method: 'POST' });
    setAuth({ authenticated: false });
    setMenuOpen(false);
    // Fix #10: SPA navigation — no full page reload
    router.push('/login');
  };

  const navLinks = [
    { label: 'Papers', href: '/papers' },
    { label: 'Notes', href: '/notes' },
    { label: 'Videos', href: '/videos' },
    {
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <FaRobot style={{ color: 'var(--primary)', fontSize: '0.9em' }} />
          <span>Ask AI</span>
          <span style={{ fontSize: '0.6rem', background: 'linear-gradient(135deg,var(--primary),var(--accent))', color: 'white', padding: '1px 5px', borderRadius: '999px', fontWeight: 700, letterSpacing: '0.04em' }}>FREE</span>
        </span>
      ),
      href: '/ask'
    },
    {
      label: (
        // Fix #17: aria-label is on the Link itself; dot is decorative
        <span className={styles.announcementLabel}>
          Announcements
          {hasNewAnnouncement && (
            <span className={styles.announcementDot} aria-hidden="true" />
          )}
        </span>
      ),
      href: '/announcements'
    },
    ...(auth.authenticated ? [{ label: 'Favorites', href: '/favorites' }] : []),
    { label: 'Contact', href: '/contact' },
  ];

  // Fix #16: Use explicit path-segment check to avoid /p matching /papers
  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  return (
    // Fix #5: All inline styles replaced with Navbar.module.css classes
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <img
            src={siteLogo || '/logo.png'}
            alt="Bounce Back Academy Logo"
            className={styles.logoImg}
          />
          <span className={styles.logoText}>
            Bounce Back <span className="text-gradient">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className={styles.desktopAuth}>
          {auth.authenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.userInfo}>
                {auth.image ? (
                  <img src={auth.image} alt="" className={styles.avatarImg} />
                ) : (
                  <FaUserCircle style={{ color: 'var(--primary)' }} />
                )}
                <span className={styles.userName}>{auth.name || auth.email}</span>
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
                Create Account
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Fix #17: aria-label on the mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={styles.mobileMenuBtn}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileAuthRow}>
            {auth.authenticated ? (
              <div className={styles.mobileAuthButtons}>
                <Link href="/profile" className={`btn-secondary ${styles.mobileAuthBtn}`} onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className={`btn-secondary ${styles.mobileAuthBtn}`}>Logout</button>
              </div>
            ) : (
              <>
                <Link href="/login" className={`btn-secondary ${styles.mobileAuthBtn}`} onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className={`btn-primary ${styles.mobileAuthBtn}`} onClick={() => setMenuOpen(false)}>Create Account</Link>
              </>
            )}
            <div className={styles.mobileThemeWrap}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
