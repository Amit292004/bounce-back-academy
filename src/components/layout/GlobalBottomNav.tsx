"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Star, GraduationCap, Heart } from 'lucide-react';
import styles from './GlobalBottomNav.module.css';
import ClassSwitcherModal from './ClassSwitcherModal';

export default function GlobalBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // All client-only state initialised to safe defaults (same as SSR)
  const [currentHash, setCurrentHash] = useState('');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [savedClass, setSavedClass] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isClassRoute = pathname?.startsWith('/class/');
  const currentClass = isClassRoute ? decodeURIComponent(pathname.split('/')[2]) : undefined;

  // After mount: read localStorage and hash — never on server
  useEffect(() => {
    setMounted(true);
    setCurrentHash(window.location.hash);

    const saved = localStorage.getItem('selectedClass');
    if (saved && saved !== 'Not Selected') {
      setSavedClass(saved);
    }
  }, []);

  // Keep hash in sync when navigating
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

  // Re-read localStorage when pathname changes (class switch)
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('selectedClass');
    if (saved && saved !== 'Not Selected') {
      setSavedClass(saved);
    }
  }, [pathname, mounted]);

  // Use currentClass (from URL) first — only fall back to savedClass after mount
  // to avoid SSR/client mismatch
  const targetClass = currentClass || (mounted ? savedClass : null);

  const tabs = [
    { href: '/?noredirect=true', label: 'Home',       icon: <Home size={20} /> },
    { href: '/#classes',         label: 'Classes',    icon: <GraduationCap size={20} /> },
    { href: '/premium',          label: 'Premium',    icon: <Star size={20} /> },
    { href: '/favorites',        label: 'Favourites', icon: <Heart size={20} /> },
  ];

  return (
    <>
      <nav className={styles.bottomNav}>
        {tabs.map(tab => {
          const isClassesTab = tab.href.includes('#classes');
          const isHomeTab    = tab.href.startsWith('/?noredirect=true');
          const isPremiumTab = tab.label === 'Premium';

          // Compute active state using only pathname + currentHash (safe on both server and client)
          const isActive = isHomeTab
            ? (pathname === '/' && currentHash !== '#classes')
            : isClassesTab
              ? ((pathname === '/' && currentHash === '#classes') || isClassRoute)
              : isPremiumTab
                ? pathname?.startsWith('/premium')
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
                    setIsSwitcherOpen(true);
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

      <ClassSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentClass={currentClass}
      />
    </>
  );
}
