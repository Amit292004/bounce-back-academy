"use client";

import { useEffect, useState, useCallback } from 'react';
import UniversalSearchModal from './UniversalSearchModal';
import { DesktopSearchTrigger, MobileSearchTrigger, MobileMenuSearchTrigger } from './SearchTrigger';

export { UniversalSearchModal, DesktopSearchTrigger, MobileSearchTrigger, MobileMenuSearchTrigger };

/**
 * Hook to manage universal search open state and global keyboard shortcut (Ctrl+K / Cmd+K)
 */
export function useUniversalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const activeElement = document.activeElement;
        const tagName = activeElement?.tagName?.toLowerCase();
        const isEditable = (activeElement as HTMLElement)?.isContentEditable;

        // Do not trigger if typing in an existing input or textarea unless it is already the search modal
        if (
          (tagName === 'input' || tagName === 'textarea' || isEditable) &&
          !activeElement?.getAttribute('aria-label')?.includes('Bounce Back Academy')
        ) {
          return;
        }

        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  };
}
