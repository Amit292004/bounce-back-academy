"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaHome, FaBook, FaCalendarAlt, FaFileAlt, 
  FaVideo, FaBullhorn, FaImages, FaUsers, FaComments, FaSignOutAlt 
} from 'react-icons/fa';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: <FaHome /> },
    { label: 'Subjects', href: '/admin/dashboard/subjects', icon: <FaBook /> },
    { label: 'Years', href: '/admin/dashboard/years', icon: <FaCalendarAlt /> },
    { label: 'Question Papers', href: '/admin/dashboard/papers', icon: <FaFileAlt /> },
    { label: 'Notes', href: '/admin/dashboard/notes', icon: <FaFileAlt /> },
    { label: 'Videos', href: '/admin/dashboard/videos', icon: <FaVideo /> },
    { label: 'Announcements', href: '/admin/dashboard/announcements', icon: <FaBullhorn /> },
    { label: 'Branding', href: '/admin/dashboard/branding', icon: <FaImages /> },
    { label: 'Users', href: '/admin/dashboard/users', icon: <FaUsers /> },
    { label: 'Feedback', href: '/admin/dashboard/feedback', icon: <FaComments /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        background: 'var(--surface)', 
        borderRight: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bounce Back Admin</h2>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition)'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
