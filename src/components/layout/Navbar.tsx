"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaRobot, FaChevronDown } from 'react-icons/fa';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './Navbar.module.css';

interface AuthState {
  authenticated: boolean;
  email?: string;
  name?: string;
  image?: string | null;
}

interface NavItem {
  label: string;
  href: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
}

const resources: NavItem[] = [
  {
    label: 'Question Papers',
    href: '/papers',
    desc: 'Past papers from 2016 onwards',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Study Notes',
    href: '/notes',
    desc: 'Structured notes for every chapter',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    label: 'Video Lectures',
    href: '/videos',
    desc: 'Expert video lessons by subject',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    label: 'AI Doubt Solver',
    href: '/ask',
    desc: 'Instant step-by-step solutions',
    badge: 'Free',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
  },
];

const platform: NavItem[] = [
  {
    label: 'Quiz & Tests',
    href: '/quiz',
    desc: 'AI-generated MCQ practice tests',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    label: 'Premium Store',
    href: '/premium',
    desc: 'Unlock paid notes, papers & courses',
    badge: 'New',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
        <path d="M6 15h2M12 15h4"/>
      </svg>
    ),
  },
  {
    label: 'Discussion Forum',
    href: '/forum',
    desc: 'Ask doubts, discuss topics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Announcements',
    href: '/announcements',
    desc: 'Latest news and updates',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    label: 'Saved Favourites',
    href: '/favorites',
    desc: 'Your bookmarked papers & notes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Contact Us',
    href: '/contact',
    desc: 'Get in touch with the team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [scrolled, setScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);
  const [megaOpen, setMegaOpen] = useState<'resources' | 'platform' | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  // Main initialization effect (branding, announcements, event listeners)
  useEffect(() => {
    const checkAnnouncements = async () => {
      const cached = sessionStorage.getItem('bb_announcement_checked');
      if (cached) return;
      try {
        const res = await fetch('/api/announcements/latest');
        const data = await res.json();
        if (data?.latestCreatedAt) {
          const lastSeen = localStorage.getItem('lastSeenAnnouncement');
          if (!lastSeen || new Date(data.latestCreatedAt) > new Date(lastSeen)) {
            setHasNewAnnouncement(true);
          }
          sessionStorage.setItem('bb_announcement_checked', 'true');
        }
      } catch { }
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
    fetchBranding();
    checkAnnouncements();
    const onAnnouncementsSeen = () => setHasNewAnnouncement(false);
    window.addEventListener('announcementsSeen', onAnnouncementsSeen);
    return () => {
      window.removeEventListener('announcementsSeen', onAnnouncementsSeen);
    };
  }, []);

  // Auth checking effect (runs on mount, pathname changes, or custom profile update event)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          setAuth(await res.json());
        } else {
          setAuth({ authenticated: false });
        }
      } catch {
        setAuth({ authenticated: false });
      }
    };
    checkAuth();
    window.addEventListener('profileUpdated', checkAuth);
    return () => {
      window.removeEventListener('profileUpdated', checkAuth);
    };
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close mega on route change during render to avoid cascading updates
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMegaOpen(null);
    setMenuOpen(false);
  }

  const handleLogout = async () => {
    await fetch('/api/student/logout', { method: 'POST' });
    document.cookie = "selected_class=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem('selectedClass');
    setAuth({ authenticated: false });
    setMenuOpen(false);
    router.push('/login');
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  const isResourcesActive = () => {
    return resources.some(item => isActive(item.href));
  };

  const isPlatformActive = () => {
    return platform.some(item => isActive(item.href));
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link href="/?noredirect=true" className={styles.logoLink}>
          <Image src={siteLogo || '/logo.png'} alt="Bounce Back Academy" width={32} height={32} className={styles.logoImg} />
          <span className={styles.logoText}>
            Bounce Back Academy
          </span>
        </Link>

        {/* Desktop Nav — mega menus */}
        <nav className={styles.desktopNav} aria-label="Main navigation" ref={megaRef}>
          {/* Resources dropdown */}
          <button
            className={`${styles.navBtn} ${megaOpen === 'resources' || isResourcesActive() ? styles.navBtnActive : ''}`}
            onClick={() => setMegaOpen(megaOpen === 'resources' ? null : 'resources')}
            aria-expanded={megaOpen === 'resources'}
          >
            Resources
            <FaChevronDown className={`${styles.chevron} ${megaOpen === 'resources' ? styles.chevronOpen : ''}`} />
          </button>

          {/* Platform dropdown */}
          <button
            className={`${styles.navBtn} ${megaOpen === 'platform' || isPlatformActive() ? styles.navBtnActive : ''}`}
            onClick={() => setMegaOpen(megaOpen === 'platform' ? null : 'platform')}
            aria-expanded={megaOpen === 'platform'}
          >
            Platform
            <FaChevronDown className={`${styles.chevron} ${megaOpen === 'platform' ? styles.chevronOpen : ''}`} />
          </button>

          <Link href="/announcements" className={`${styles.navLink} ${isActive('/announcements') ? styles.navLinkActive : ''}`}>
            Announcements
            {hasNewAnnouncement && <span className={styles.dot} aria-hidden="true" />}
          </Link>

          {/* Mega dropdown */}
          {megaOpen && (
            <div className={`${styles.mega} ${styles.megaOpen}`} role="dialog" aria-label={megaOpen === 'resources' ? 'Resources menu' : 'Platform menu'}>
              <div className={styles.megaGrid}>
                {(megaOpen === 'resources' ? resources : platform).map((item) => (
                  <Link key={item.href} href={item.href} className={styles.megaItem} onClick={() => setMegaOpen(null)}>
                    <div className={styles.megaIcon}>{item.icon}</div>
                    <div>
                      <div className={styles.megaLabel}>
                        {item.label}
                        {'badge' in item && item.badge && <span className={styles.megaBadge}>{item.badge}</span>}
                      </div>
                      <div className={styles.megaDesc}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Auth */}
        <div className={styles.desktopAuth}>
          {auth.authenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.userInfo}>
                {auth.image
                  ? <Image src={auth.image} alt="" width={32} height={32} className={styles.avatarImg} />
                  : <FaUserCircle style={{ color: 'var(--primary)', fontSize: '1.2rem' }} />}
                <span className={styles.userName}>{auth.name || auth.email}</span>
              </div>
              <Link href="/profile" className={styles.authBtn}>Profile</Link>
              <button onClick={handleLogout} className={styles.authBtnGhost}>Logout</button>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.authBtnGhost}>Sign In</Link>
              <Link href="/register" className={styles.authBtn}>Create Account</Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Hamburger */}
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
          <div className={styles.mobileSection}>
            <p className={styles.mobileSectionHead}>Resources</p>
            {resources.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`${styles.mobileLink} ${isActive(item.href) ? styles.mobileLinkActive : ''}`}>
                <span className={styles.mobileLinkIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {'badge' in item && item.badge && <span className={styles.mobileBadge}>{item.badge}</span>}
              </Link>
            ))}
          </div>
          <div className={styles.mobileDivider} />
          <div className={styles.mobileSection}>
            <p className={styles.mobileSectionHead}>Platform</p>
            {platform.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`${styles.mobileLink} ${isActive(item.href) ? styles.mobileLinkActive : ''}`}>
                <span className={styles.mobileLinkIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {'badge' in item && item.badge && <span className={styles.mobileBadge}>{item.badge}</span>}
              </Link>
            ))}
          </div>
          <div className={styles.mobileDivider} />
          <div className={styles.mobileAuthRow}>
            {auth.authenticated ? (
              <>
                <Link href="/profile" className={styles.authBtn} onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center' }}>Profile</Link>
                <button onClick={handleLogout} className={styles.authBtnGhost} style={{ flex: 1 }}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.authBtnGhost} onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center' }}>Sign In</Link>
                <Link href="/register" className={styles.authBtn} onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center' }}>Create Account</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
