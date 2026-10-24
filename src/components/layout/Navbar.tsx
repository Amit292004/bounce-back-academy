"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaRobot, FaChevronDown } from 'react-icons/fa';
import {
  ShoppingCart,
  Compass,
  GraduationCap,
  Target,
  Code,
  BookOpen,
  FileText,
  HelpCircle,
  Video,
  Bot,
  Bell,
  CheckSquare,
  MessageSquare,
  Bookmark,
  Star,
  Sparkles,
  LayoutDashboard,
  User,
  LogOut,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import ThemeToggle from '@/components/ThemeToggle';
import {
  UniversalSearchModal,
  DesktopSearchTrigger,
  MobileSearchTrigger,
  MobileMenuSearchTrigger,
  useUniversalSearch,
} from '@/components/search';
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
    label: 'School Learning (8–12)',
    href: '/school',
    desc: 'NBSE curriculum notes, papers & videos',
    badge: 'NBSE',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    label: 'Competitive Exams',
    href: '/exams',
    desc: 'JEE Main, Advanced, NEET UG & CUET',
    badge: 'Prep',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    label: 'Practical Skill Courses',
    href: '/skills',
    desc: 'AI tools, web development & coding',
    badge: 'Skills',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    label: 'Study Library',
    href: '/library',
    desc: 'Search all notes, papers & videos',
    badge: 'Search',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
    label: 'Saved Favourites',
    href: '/favorites',
    desc: 'Your bookmarked papers & notes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const { isOpen: searchOpen, openSearch, closeSearch } = useUniversalSearch();
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [scrolled, setScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);
  const [megaOpen, setMegaOpen] = useState<'resources' | 'platform' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close mega menu and user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (megaOpen) setMegaOpen(null);
        if (userMenuOpen) setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, megaOpen, userMenuOpen]);

  // Lock body scroll and set class when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('mobile-drawer-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close menus on route change during render to avoid cascading updates
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMegaOpen(null);
    setUserMenuOpen(false);
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
    <>
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

          <Link href="/courses" className={`${styles.navLink} ${isActive('/courses') ? styles.navLinkActive : ''}`}>
            Courses
          </Link>
          <Link
            href="/ai-tutor"
            className={`${styles.navLink} ${styles.aiTutorLink} ${isActive('/ask') || isActive('/ai-tutor') ? styles.navLinkActive : ''}`}
          >
            <FaRobot className={styles.aiTutorIcon} aria-hidden="true" />
            <span>AI Tutor</span>
          </Link>
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

        {/* Desktop Universal Search Trigger */}
        <div className={styles.desktopSearchWrap}>
          <DesktopSearchTrigger onClick={openSearch} />
        </div>

        {/* Auth */}
        <div className={styles.desktopAuth}>
          {auth.authenticated ? (
            <div className={styles.userMenuContainer} ref={userMenuRef}>
              <button
                type="button"
                className={`${styles.userTriggerBtn} ${userMenuOpen ? styles.userTriggerActive : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User account menu"
              >
                {auth.image ? (
                  <Image src={auth.image} alt="" width={26} height={26} className={styles.avatarImg} />
                ) : (
                  <FaUserCircle className={styles.avatarPlaceholder} />
                )}
                <span className={styles.userName}>{auth.name || auth.email || 'My Account'}</span>
                <FaChevronDown className={`${styles.userChevron} ${userMenuOpen ? styles.chevronOpen : ''}`} />
              </button>

              {userMenuOpen && (
                <div className={styles.userDropdownMenu} role="menu">
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userDropdownAvatarWrap}>
                      {auth.image ? (
                        <Image src={auth.image} alt="" width={38} height={38} className={styles.userDropdownAvatar} />
                      ) : (
                        <FaUserCircle className={styles.userDropdownPlaceholder} />
                      )}
                    </div>
                    <div className={styles.userDropdownInfo}>
                      <div className={styles.userDropdownName}>{auth.name || 'Student'}</div>
                      {auth.email && <div className={styles.userDropdownEmail}>{auth.email}</div>}
                    </div>
                  </div>

                  <div className={styles.userDropdownDivider} />

                  <div className={styles.userDropdownList}>
                    <Link
                      href="/dashboard"
                      className={`${styles.userDropdownItem} ${styles.userDropdownItemPrimary}`}
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <span className={styles.userDropdownIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="9" />
                          <rect x="14" y="3" width="7" height="5" />
                          <rect x="14" y="12" width="7" height="9" />
                          <rect x="3" y="16" width="7" height="5" />
                        </svg>
                      </span>
                      <div className={styles.userDropdownItemContent}>
                        <span className={styles.userDropdownItemLabel}>Dashboard</span>
                        <span className={styles.userDropdownItemDesc}>Courses, progress &amp; quick stats</span>
                      </div>
                    </Link>

                    <Link
                      href="/profile"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <span className={styles.userDropdownIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <div className={styles.userDropdownItemContent}>
                        <span className={styles.userDropdownItemLabel}>My Profile</span>
                        <span className={styles.userDropdownItemDesc}>Class &amp; account settings</span>
                      </div>
                    </Link>

                    <Link
                      href="/favorites"
                      className={styles.userDropdownItem}
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <span className={styles.userDropdownIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </span>
                      <div className={styles.userDropdownItemContent}>
                        <span className={styles.userDropdownItemLabel}>Saved Favourites</span>
                        <span className={styles.userDropdownItemDesc}>Bookmarked notes &amp; papers</span>
                      </div>
                    </Link>
                  </div>

                  <div className={styles.userDropdownDivider} />

                  <div className={styles.userDropdownFooter}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className={styles.userDropdownLogout}
                      role="menuitem"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.authBtnGhost}>Sign In</Link>
              <Link href="/register" className={styles.authBtn}>Create Account</Link>
            </>
          )}
          <button
            onClick={openCart}
            className={styles.cartIconBtn}
            aria-label={`Open shopping cart (${itemCount} items)`}
            title="Shopping Cart"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </button>
          <ThemeToggle />
        </div>

        {/* Mobile Actions: Search Icon + Cart Icon + Hamburger */}
        <div className={styles.mobileActions}>
          <button
            type="button"
            onClick={openSearch}
            className={styles.mobileActionBtn}
            aria-label="Search"
            title="Search"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={openCart}
            className={styles.mobileActionBtn}
            aria-label={`Open shopping cart (${itemCount} items)`}
            title="Shopping Cart"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={styles.mobileMenuBtn}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`${styles.mobileDrawer} ${menuOpen ? styles.mobileDrawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        aria-hidden={!menuOpen}
      >
        {/* Region 1: Drawer Header */}
        <div className={styles.drawerHeader}>
          <Link
            href="/?noredirect=true"
            className={styles.drawerLogoLink}
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src={siteLogo || '/logo.png'}
              alt="Bounce Back Academy"
              width={28}
              height={28}
              className={styles.logoImg}
            />
            <span className={styles.drawerLogoText}>Bounce Back Academy</span>
          </Link>

          <div className={styles.drawerHeaderActions}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openSearch();
              }}
              className={styles.drawerActionBtn}
              aria-label="Search"
              title="Search"
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              className={styles.drawerActionBtn}
              aria-label={`Open shopping cart (${itemCount} items)`}
              title="Shopping Cart"
            >
              <ShoppingCart size={17} />
              {itemCount > 0 && <span className={styles.drawerCartBadge}>{itemCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className={styles.drawerCloseBtn}
              aria-label="Close navigation menu"
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Region 2: Scrollable Drawer Body */}
        <div className={styles.drawerBody}>
          {/* Quick Search Trigger Bar */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openSearch();
            }}
            className={styles.drawerSearchBox}
          >
            <Search size={15} className={styles.drawerSearchIcon} />
            <span className={styles.drawerSearchPlaceholder}>Search notes, papers, courses...</span>
            <kbd className={styles.drawerSearchKbd}>⌘K</kbd>
          </button>

          {/* Group A: LEARNING */}
          <div className={styles.drawerGroup}>
            <div className={styles.drawerGroupHeader}>
              <span className={styles.drawerGroupLabel}>LEARNING</span>
            </div>
            <div className={styles.drawerNavList}>
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/courses') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Compass size={18} /></span>
                <span className={styles.drawerNavTitle}>Courses</span>
              </Link>

              <Link
                href="/school"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/school') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><GraduationCap size={18} /></span>
                <span className={styles.drawerNavTitle}>School Learning</span>
              </Link>

              <Link
                href="/exams"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/exams') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Target size={18} /></span>
                <span className={styles.drawerNavTitle}>Competitive Exams</span>
              </Link>

              <Link
                href="/skills"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/skills') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Code size={18} /></span>
                <span className={styles.drawerNavTitle}>Practical Skills</span>
              </Link>

              {/* Study Library & Contextual Resources */}
              <div className={styles.drawerExpandableGroup}>
                <div className={styles.drawerExpandableRow}>
                  <Link
                    href="/library"
                    onClick={() => setMenuOpen(false)}
                    className={`${styles.drawerNavItem} ${styles.drawerNavMainItem} ${isActive('/library') ? styles.drawerNavItemActive : ''}`}
                  >
                    <span className={styles.drawerNavIcon}><BookOpen size={18} /></span>
                    <span className={styles.drawerNavTitle}>Study Library</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setLibraryExpanded(!libraryExpanded)}
                    className={styles.drawerSubmenuToggle}
                    aria-label={libraryExpanded ? 'Collapse study resources' : 'Expand study resources'}
                    aria-expanded={libraryExpanded}
                  >
                    <ChevronDown
                      size={15}
                      className={`${styles.drawerChevron} ${libraryExpanded ? styles.drawerChevronRotated : ''}`}
                    />
                  </button>
                </div>

                {libraryExpanded && (
                  <div className={styles.drawerSubmenu}>
                    <Link
                      href="/notes"
                      onClick={() => setMenuOpen(false)}
                      className={`${styles.drawerSubItem} ${isActive('/notes') ? styles.drawerSubItemActive : ''}`}
                    >
                      <span className={styles.drawerSubIcon}><FileText size={15} /></span>
                      <span className={styles.drawerSubTitle}>Study Notes</span>
                    </Link>
                    <Link
                      href="/papers"
                      onClick={() => setMenuOpen(false)}
                      className={`${styles.drawerSubItem} ${isActive('/papers') ? styles.drawerSubItemActive : ''}`}
                    >
                      <span className={styles.drawerSubIcon}><HelpCircle size={15} /></span>
                      <span className={styles.drawerSubTitle}>Question Papers</span>
                    </Link>
                    <Link
                      href="/videos"
                      onClick={() => setMenuOpen(false)}
                      className={`${styles.drawerSubItem} ${isActive('/videos') ? styles.drawerSubItemActive : ''}`}
                    >
                      <span className={styles.drawerSubIcon}><Video size={15} /></span>
                      <span className={styles.drawerSubTitle}>Video Lectures</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.drawerDivider} />

          {/* Group B: CAMPUS */}
          <div className={styles.drawerGroup}>
            <div className={styles.drawerGroupHeader}>
              <span className={styles.drawerGroupLabel}>CAMPUS</span>
            </div>
            <div className={styles.drawerNavList}>
              <Link
                href="/ai-tutor"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/ask') || isActive('/ai-tutor') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Bot size={18} /></span>
                <span className={styles.drawerNavTitle}>AI Tutor</span>
                <span className={styles.drawerPillBadge}>Free</span>
              </Link>

              <Link
                href="/announcements"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/announcements') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Bell size={18} /></span>
                <span className={styles.drawerNavTitle}>Announcements</span>
                {hasNewAnnouncement && <span className={styles.drawerDot} aria-hidden="true" />}
              </Link>

              <Link
                href="/quiz"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/quiz') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><CheckSquare size={18} /></span>
                <span className={styles.drawerNavTitle}>Quiz &amp; Tests</span>
              </Link>

              <Link
                href="/forum"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/forum') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><MessageSquare size={18} /></span>
                <span className={styles.drawerNavTitle}>Discussion Forum</span>
              </Link>

              <Link
                href="/favorites"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/favorites') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Bookmark size={18} /></span>
                <span className={styles.drawerNavTitle}>Saved Favourites</span>
              </Link>

              <Link
                href="/reviews"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/reviews') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Star size={18} /></span>
                <span className={styles.drawerNavTitle}>Student Reviews</span>
              </Link>

              <Link
                href="/premium"
                onClick={() => setMenuOpen(false)}
                className={`${styles.drawerNavItem} ${isActive('/premium') ? styles.drawerNavItemActive : ''}`}
              >
                <span className={styles.drawerNavIcon}><Sparkles size={18} /></span>
                <span className={styles.drawerNavTitle}>Premium Store</span>
                <span className={styles.drawerPillBadgeAccent}>New</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Region 3: Compact Account Footer */}
        <div className={styles.drawerFooter}>
          {auth.authenticated ? (
            <div className={styles.drawerAccountCard}>
              <div className={styles.drawerAccountHeader}>
                <div className={styles.drawerAccountAvatar}>
                  {auth.image ? (
                    <Image src={auth.image} alt="" width={34} height={34} className={styles.avatarImg} />
                  ) : (
                    <FaUserCircle className={styles.avatarPlaceholder} style={{ fontSize: '2rem' }} />
                  )}
                </div>
                <div className={styles.drawerAccountInfo}>
                  <span className={styles.drawerAccountName}>{auth.name || 'Student'}</span>
                  {auth.email && <span className={styles.drawerAccountEmail}>{auth.email}</span>}
                </div>
                <div className={styles.drawerThemeToggleWrap}>
                  <ThemeToggle />
                </div>
              </div>

              <div className={styles.drawerAccountGrid}>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`${styles.drawerAccountBtn} ${isActive('/dashboard') ? styles.drawerAccountBtnActive : ''}`}
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className={`${styles.drawerAccountBtn} ${isActive('/profile') ? styles.drawerAccountBtnActive : ''}`}
                >
                  <User size={14} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className={`${styles.drawerAccountBtn} ${isActive('/contact') ? styles.drawerAccountBtnActive : ''}`}
                >
                  <HelpCircle size={14} />
                  <span>Support</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.drawerLogoutBtn}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.drawerGuestCard}>
              <div className={styles.drawerGuestActions}>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={styles.drawerGuestLoginBtn}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className={styles.drawerGuestRegisterBtn}
                >
                  Create Account
                </Link>
              </div>
              <div className={styles.drawerGuestFooter}>
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className={styles.drawerSupportLink}
                >
                  <HelpCircle size={14} />
                  <span>Contact Support</span>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    <div className={styles.headerSpacer} aria-hidden="true" />
    <UniversalSearchModal isOpen={searchOpen} onClose={closeSearch} />
  </>
  );
}
