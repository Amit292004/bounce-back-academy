"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  BookOpen,
  FileText,
  Video as VideoIcon,
  HelpCircle,
  GraduationCap,
  Target,
  Sparkles,
  Compass,
  ShoppingCart,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  SearchCategory,
  SearchResultItem,
  SearchResponse,
  POPULAR_SEARCHES,
  PLATFORM_PAGES,
  ContentType,
} from '@/lib/search';
import styles from './UniversalSearchModal.module.css';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const CATEGORY_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'All Results' },
  { id: 'courses', label: 'Courses' },
  { id: 'resources', label: 'Notes & Papers' },
  { id: 'curriculum', label: 'Chapters & Subjects' },
  { id: 'videos_quizzes', label: 'Videos & Quizzes' },
  { id: 'exams', label: 'Exams' },
  { id: 'pages', label: 'Pages & Help' },
];

const RECENT_SEARCHES_KEY = 'bb_universal_recent_searches';

export default function UniversalSearchModal({
  isOpen,
  onClose,
  initialQuery = '',
}: UniversalSearchModalProps) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<SearchCategory, number>>({
    all: 0,
    courses: 0,
    resources: 0,
    curriculum: 0,
    videos_quizzes: 0,
    exams: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevFocusedElement = useRef<HTMLElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 6));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Focus management and keyboard lock
  useEffect(() => {
    if (isOpen) {
      prevFocusedElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (prevFocusedElement.current) {
        prevFocusedElement.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch search results with debouncing and request cancellation
  const fetchSearchResults = useCallback(
    async (q: string, category: SearchCategory) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        setError(null);
        setCategoryCounts({
          all: 0,
          courses: 0,
          resources: 0,
          curriculum: 0,
          videos_quizzes: 0,
          exams: 0,
          pages: 0,
        });
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const sp = new URLSearchParams();
        sp.set('q', trimmed);
        sp.set('category', category);
        sp.set('limit', '30');

        const res = await fetch(`/api/search?${sp.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Search failed with status: ${res.status}`);
        }

        const data: SearchResponse = await res.json();
        setResults(data.results || []);
        if (data.categoryCounts) {
          setCategoryCounts(data.categoryCounts);
        }
        setSelectedIndex(data.results && data.results.length > 0 ? 0 : -1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Failed to fetch search results. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchSearchResults(query, selectedCategory);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, isOpen, fetchSearchResults]);

  // Handle navigating to a search result
  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    onClose();
    router.push(item.href);
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollIndexIntoView(next);
        return next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollIndexIntoView(next);
        return next;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectResult(results[selectedIndex]);
      } else if (query.trim()) {
        // If query entered, launch AI Tutor or search library
        saveRecentSearch(query);
        onClose();
        router.push(`/library?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const scrollIndexIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`[data-result-index="${index}"]`);
    if (items.length > 0) {
      (items[0] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  // Helper to render icon by content type
  const renderItemIcon = (type: ContentType) => {
    switch (type) {
      case 'course':
        return <ShoppingCart size={18} />;
      case 'note':
        return <BookOpen size={18} />;
      case 'paper':
        return <FileText size={18} />;
      case 'video':
        return <VideoIcon size={18} />;
      case 'quiz':
        return <HelpCircle size={18} />;
      case 'chapter':
      case 'class':
      case 'subject':
        return <GraduationCap size={18} />;
      case 'exam':
        return <Target size={18} />;
      case 'tool':
        return <Sparkles size={18} />;
      case 'page':
      case 'faq':
      default:
        return <Compass size={18} />;
    }
  };

  // Helper to render badge variant style
  const getBadgeClass = (variant?: SearchResultItem['badgeVariant']) => {
    switch (variant) {
      case 'primary':
        return styles.badgePrimary;
      case 'success':
        return styles.badgeSuccess;
      case 'warning':
        return styles.badgeWarning;
      case 'danger':
        return styles.badgeDanger;
      case 'purple':
        return styles.badgePurple;
      case 'cyan':
        return styles.badgeCyan;
      default:
        return styles.badgeDefault;
    }
  };

  // Highlight query matches in titles
  const renderHighlightedText = (text: string, matchedTerms?: string[]) => {
    if (!query.trim() || !text) return text;

    // Build terms list
    const terms = (matchedTerms && matchedTerms.length > 0
      ? matchedTerms
      : query.trim().split(' ')
    ).filter((t) => t.length > 1);

    if (terms.length === 0) return text;

    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search across Bounce Back Academy"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modal}>
        {/* ── Search Input Header ── */}
        <div className={styles.inputHeader}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search courses, notes, subjects, exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search across Bounce Back Academy"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className={styles.headerActions}>
            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search input"
                title="Clear query"
              >
                <X size={16} />
              </button>
            )}
            <kbd className={styles.escBadge} title="Press Escape to close">
              ESC
            </kbd>
          </div>
        </div>

        {/* ── Categories Filter Bar (Shown when search is active) ── */}
        {query.trim().length > 0 && (
          <div className={styles.categoriesBar} role="tablist" aria-label="Search Categories">
            {CATEGORY_TABS.map((tab) => {
              const count = categoryCounts[tab.id] ?? 0;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory(tab.id)}
                >
                  <span>{tab.label}</span>
                  {count > 0 && <span className={styles.categoryCount}>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div className={styles.modalBody} ref={listRef}>
          {/* State 1: Empty Query / Recommendations */}
          {!query.trim() && (
            <div className={styles.emptyStateContainer}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <section>
                  <div className={styles.sectionHeader}>
                    <p className={styles.sectionTitle}>Recent Searches</p>
                    <button
                      type="button"
                      className={styles.clearHistoryBtn}
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                  <div className={styles.recentGrid}>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        className={styles.pillBtn}
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                      >
                        <Clock size={13} style={{ opacity: 0.6 }} />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular Searches */}
              <section>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionTitle}>Popular Topics &amp; Exams</p>
                </div>
                <div className={POPULAR_SEARCHES.length > 0 ? styles.popularGrid : ''}>
                  {POPULAR_SEARCHES.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.pillBtn}
                      onClick={() => {
                        setQuery(term);
                        inputRef.current?.focus();
                      }}
                    >
                      <Search size={12} style={{ opacity: 0.6 }} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Quick Platform Shortcuts */}
              <section>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionTitle}>Quick Platform Shortcuts</p>
                </div>
                <div className={styles.shortcutsGrid}>
                  {PLATFORM_PAGES.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={p.href}
                      className={styles.shortcutCard}
                      onClick={() => onClose()}
                    >
                      <div className={styles.resultIconWrap}>{renderItemIcon(p.id === 'page-ai-tutor' ? 'tool' : 'page')}</div>
                      <div>
                        <div className={styles.shortcutTitle}>{p.title}</div>
                        <div className={styles.shortcutDesc}>{p.subtitle}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* State 2: Loading Indicator */}
          {loading && query.trim() && (
            <div className={styles.skeletonList}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={styles.skeletonRow}>
                  <div className={styles.skeletonIcon} />
                  <div className={styles.skeletonLines}>
                    <div className={styles.skeletonLine} style={{ width: '45%' }} />
                    <div className={styles.skeletonLine} style={{ width: '70%', height: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* State 3: Error Banner */}
          {!loading && error && (
            <div className={styles.errorState}>
              <AlertCircle size={28} color="#ef4444" />
              <p className={styles.noResultsTitle}>{error}</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => fetchSearchResults(query, selectedCategory)}
              >
                <RotateCcw size={14} />
                <span>Retry Search</span>
              </button>
            </div>
          )}

          {/* State 4: No Results Found */}
          {!loading && !error && query.trim() && results.length === 0 && (
            <div className={styles.noResultsState}>
              <div className={styles.noResultsIcon}>
                <Search size={24} />
              </div>
              <h3 className={styles.noResultsTitle}>No results found for &ldquo;{query}&rdquo;</h3>
              <p className={styles.noResultsDesc}>
                We couldn&apos;t find matching materials. Try searching by specific class (e.g. &ldquo;Class 10&rdquo;),
                subject (e.g. &ldquo;Science&rdquo;), or open the AI Tutor.
              </p>
              <div className={styles.noResultsSuggestions}>
                <button
                  type="button"
                  className={styles.pillBtn}
                  onClick={() => setQuery('Class 10 Science')}
                >
                  Search &ldquo;Class 10 Science&rdquo;
                </button>
                <button
                  type="button"
                  className={styles.pillBtn}
                  onClick={() => setQuery('Chemical Reactions')}
                >
                  Search &ldquo;Chemical Reactions&rdquo;
                </button>
                <button
                  type="button"
                  className={styles.pillBtn}
                  onClick={() => setQuery('JEE Main')}
                >
                  Search &ldquo;JEE Main&rdquo;
                </button>
              </div>
            </div>
          )}

          {/* State 5: Active Results List */}
          {!loading && !error && results.length > 0 && (
            <div className={styles.resultsList} role="listbox">
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-result-index={index}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={styles.resultIconWrap}>{renderItemIcon(item.type)}</div>

                    <div className={styles.resultContent}>
                      <div className={styles.resultTitleRow}>
                        <span className={styles.resultTitle}>
                          {renderHighlightedText(item.title, item.matchedTerms)}
                        </span>
                        {item.badge && (
                          <span className={`${styles.resultBadge} ${getBadgeClass(item.badgeVariant)}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <div className={styles.resultSubtitle}>
                          {renderHighlightedText(item.subtitle, item.matchedTerms)}
                        </div>
                      )}

                      {item.description && (
                        <div className={styles.resultDesc}>
                          {item.description}
                        </div>
                      )}
                    </div>

                    <div className={styles.resultAction}>
                      {isSelected ? (
                        <kbd className={styles.enterHint}>↵</kbd>
                      ) : (
                        <ArrowRight size={14} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dedicated AI Tutor Action Card (Never auto-executes, user can click to launch tutor) */}
              <div
                className={styles.aiTutorCard}
                onClick={() => {
                  saveRecentSearch(query);
                  onClose();
                  router.push(`/ask?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                <div className={styles.aiTutorCardText}>
                  <div className={styles.aiTutorCardTitle}>
                    <Sparkles size={15} />
                    <span>Ask Bounce Back AI Tutor</span>
                  </div>
                  <div className={styles.aiTutorCardDesc}>
                    Get instant step-by-step academic explanations and derivations for &ldquo;{query}&rdquo;
                  </div>
                </div>
                <ArrowRight size={16} color="#34d399" />
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer with Keyboard Navigation Hints ── */}
        <div className={styles.modalFooter}>
          <div className={styles.footerHints}>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> Navigate
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>↵</kbd> Select
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>ESC</kbd> Close
            </span>
          </div>

          <div>
            {results.length > 0 && query.trim() ? (
              <span>Showing {results.length} relevant results</span>
            ) : (
              <span>Universal Educational Search</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
