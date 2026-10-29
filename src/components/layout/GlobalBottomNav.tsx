"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, GraduationCap, BookOpen, Sparkles, UserCheck } from 'lucide-react';
import styles from './GlobalBottomNav.module.css';
import ClassSwitcherModal from './ClassSwitcherModal';

export default function GlobalBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentHash, setCurrentHash] = useState('');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [savedClass, setSavedClass] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isClassRoute = pathname?.startsWith('/class/');
  const currentClass = isClassRoute ? decodeURIComponent(pathname.split('/')[2]) : undefined;

  useEffect(() => {
    setMounted(true);
    setCurrentHash(window.location.hash);

    const saved = localStorage.getItem('selectedClass');
    if (saved && saved !== 'Not Selected') {
      setSavedClass(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setCurrentHash(window.location.hash);

    const handleHashChange = () => setCurrentHash(window.location.hash);
    const interval = setInterval(() => {
      if (window.location.hash !== currentHash) {
        setCurrentHash(window.location.hash);
      }
    }, 200);

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname, mounted, currentHash]);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('selectedClass');
    if (saved && saved !== 'Not Selected') {
      setSavedClass(saved);
    }
  }, [pathname, mounted]);

  const targetClass = currentClass || (mounted ? savedClass : null);

  const tabs = [
    { href: '/?noredirect=true', label: 'Home',      icon: <Home size={19} /> },
    { href: '/school',           label: 'Classes',   icon: <GraduationCap size={19} /> },
    { href: '/courses',          label: 'Courses',   icon: <BookOpen size={19} /> },
    { href: '/ai-tutor',         label: 'AI Tutor',  icon: <Sparkles size={19} /> },
    { href: '/dashboard',        label: 'Dashboard', icon: <UserCheck size={19} /> },
  ];

  return (
    <>
      <nav className={styles.bottomNav} aria-label="Mobile Bottom Navigation">
        {tabs.map((tab) => {
          const isClassesTab = tab.href === '/school' || tab.href.includes('#classes');
          const isHomeTab = tab.href.startsWith('/?noredirect=true');
          const isCoursesTab = tab.href === '/courses';
          const isAiTab = tab.href === '/ai-tutor' || tab.href === '/ask';
          const isDashboardTab = tab.href === '/dashboard';

          const isActive = isHomeTab
            ? pathname === '/' && currentHash !== '#classes'
            : isClassesTab
            ? pathname?.startsWith('/school') || isClassRoute
            : isCoursesTab
            ? pathname?.startsWith('/courses') || pathname?.startsWith('/exams') || pathname?.startsWith('/skills') || pathname?.startsWith('/premium')
            : isAiTab
            ? pathname === '/ask' || pathname === '/ai-tutor'
            : isDashboardTab
            ? pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile')
            : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              onClick={(e) => {
                if (isClassesTab) {
                  e.preventDefault();
                  if (targetClass) {
                    router.push(`/class/${encodeURIComponent(targetClass)}`);
                  } else {
                    router.push('/school');
                  }
                } else {
                  setCurrentHash('');
                }
              }}
              className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {isSwitcherOpen && (
        <ClassSwitcherModal
          isOpen={isSwitcherOpen}
          currentClass={targetClass || undefined}
          onClose={() => setIsSwitcherOpen(false)}
        />
      )}
    </>
  );
}
