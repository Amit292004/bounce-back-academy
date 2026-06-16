"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaHome, FaBook, FaCalendarAlt, FaFileAlt, 
  FaVideo, FaBullhorn, FaImages, FaUsers, FaComments, FaSignOutAlt,
  FaBars, FaTimes, FaAd, FaPaperPlane, FaStore, FaStar
} from 'react-icons/fa';
import styles from './layout.module.css';
import { getDriveImageUrl } from '@/lib/driveImage';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branding, setBranding] = useState<{ siteLogo?: string | null, adminPhoto?: string | null }>({});

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/admin/branding')
      .then(res => res.json())
      .then(data => setBranding(data || {}));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: <FaHome /> },
    { label: 'Courses / Classes', href: '/admin/dashboard/courses', icon: <FaBook /> },
    { label: 'Subjects', href: '/admin/dashboard/subjects', icon: <FaBook /> },
    { label: 'Chapters', href: '/admin/dashboard/chapters', icon: <FaBook /> },
    { label: 'Years', href: '/admin/dashboard/years', icon: <FaCalendarAlt /> },
    { label: 'Question Papers', href: '/admin/dashboard/papers', icon: <FaFileAlt /> },
    { label: 'Notes', href: '/admin/dashboard/notes', icon: <FaFileAlt /> },
    { label: 'Videos', href: '/admin/dashboard/videos', icon: <FaVideo /> },
    { label: 'Quizzes & Tests', href: '/admin/dashboard/quizzes', icon: <FaFileAlt /> },
    { label: 'Premium Store', href: '/admin/dashboard/premium', icon: <FaStore /> },
    { label: 'Announcements', href: '/admin/dashboard/announcements', icon: <FaBullhorn /> },
    { label: 'Advertising', href: '/admin/dashboard/advertising', icon: <FaAd /> },
    { label: 'Branding', href: '/admin/dashboard/branding', icon: <FaImages /> },
    { label: 'Broadcaster', href: '/admin/dashboard/broadcaster', icon: <FaPaperPlane /> },
    { label: 'Users', href: '/admin/dashboard/users', icon: <FaUsers /> },
    { label: 'Feedback', href: '/admin/dashboard/feedback', icon: <FaComments /> },
    { label: 'Reviews', href: '/admin/dashboard/reviews', icon: <FaStar /> },
  ];

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img 
              src={getDriveImageUrl(branding.siteLogo) || "/logo.png"} 
              alt="Bounce Back Academy Logo" 
              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }} 
            />
            <h2 className="text-gradient" style={{ fontSize: '1rem', fontWeight: 800 }}>Bounce Back Academy</h2>
          </div>
          <button 
            className={styles.hamburger} 
            style={{ display: 'none' }} // Show only on mobile via CSS but handled here for logic if needed
            onClick={() => setIsSidebarOpen(false)}
          >
            {/* FaTimes would go here if we wanted a close button inside sidebar header on mobile */}
          </button>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="nav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition)',
                  border: 'none'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          {branding.adminPhoto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src={getDriveImageUrl(branding.adminPhoto) || ""} alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Administrator</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Manage Platform</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
              padding: '0.75rem', background: 'transparent', border: 'none',
              color: 'var(--error)', cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
            }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src={branding.siteLogo || "/logo.png"} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Admin Panel</span>
          </div>
          <button className={styles.hamburger} onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </button>
        </header>

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
