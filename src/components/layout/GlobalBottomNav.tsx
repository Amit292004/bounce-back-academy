"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Star, GraduationCap, Heart, User } from 'lucide-react';
import styles from './GlobalBottomNav.module.css';
import ClassSwitcherModal from './ClassSwitcherModal';

export default function GlobalBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState('');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [savedClass, setSavedClass] = useState<string | null>(null);

  const isClassRoute = pathname?.startsWith('/class/');
  const currentClass = isClassRoute ? decodeURIComponent(pathname.split('/')[2]) : undefined;

  useEffect(() => {
    const saved = localStorage.getItem('selectedClass');
    if (saved && saved !== 'Not Selected') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedClass(saved);
    }
  }, [pathname]);

  useEffect(() => {
    // Set initial hash after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentHash(window.location.hash);

    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    const interval = setInterval(() => {
      if (window.location.hash !== currentHash) {
        setCurrentHash(window.location.hash);
      }
    }, 100);

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname, currentHash]);

  const targetClass = currentClass || savedClass;

  const tabs = [
    { href: '/?noredirect=true', label: 'Home', icon: <Home size={20} /> },
    { href: '/#classes', label: targetClass || 'Classes', icon: <GraduationCap size={20} /> },
    { href: '/premium', label: 'Premium', icon: <Star size={20} /> },
    { href: '/favorites', label: 'Favourites', icon: <Heart size={20} /> },
  ];

  return (
    <>
      <nav className={styles.bottomNav}>
        {tabs.map(tab => {
          const isClassesTab = tab.href.includes('#classes');
          const isHomeTab = tab.href.startsWith('/?noredirect=true') || tab.href === '/';
          const isActive = isHomeTab
            ? (pathname === '/' && currentHash !== '#classes')
            : isClassesTab
              ? ((pathname === '/' && currentHash === '#classes') || pathname?.startsWith('/class'))
              : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
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
