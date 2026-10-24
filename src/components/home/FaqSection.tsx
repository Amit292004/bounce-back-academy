"use client";

import React, { useState, useMemo, useId } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronDown,
  Mail,
  Phone,
  ArrowRight,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Compass,
  FileText,
  GraduationCap,
  Bot,
  CreditCard,
  LifeBuoy,
  Trophy,
} from 'lucide-react';
import { FAQS, FAQ_CATEGORIES, FaqCategoryId, FaqItem } from '@/data/faqs';
import styles from './FaqSection.module.css';

const CATEGORY_ICONS: Record<
  FaqCategoryId,
  React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = {
  'getting-started': Compass,
  'courses': BookOpen,
  'study-materials': FileText,
  'exams': GraduationCap,
  'ai-tutor': Bot,
  'payments': CreditCard,
  'account-support': LifeBuoy,
  'quizzes': Trophy,
};

export default function FaqSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategoryId | 'all'>('all');
  // Collapsed by default
  const [openId, setOpenId] = useState<string | null>(null);
  const searchInputId = useId();

  // Normalize search query
  const query = searchQuery.trim().toLowerCase();

  // Matcher function
  const matchesQuery = (faq: FaqItem, q: string): boolean => {
    if (!q) return true;
    const inQ = faq.q.toLowerCase().includes(q);
    const inA = faq.a.toLowerCase().includes(q);
    const inKeywords = faq.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
    return inQ || inA || inKeywords;
  };

  // Category counts based on current search query
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: FAQS.filter((f) => matchesQuery(f, query)).length,
    };
    FAQ_CATEGORIES.forEach((cat) => {
      counts[cat.id] = FAQS.filter((f) => f.category === cat.id && matchesQuery(f, query)).length;
    });
    return counts;
  }, [query]);

  // Categories to render based on selection and search
  const visibleCategories = useMemo(() => {
    const candidateCategories =
      selectedCategory === 'all'
        ? FAQ_CATEGORIES
        : FAQ_CATEGORIES.filter((c) => c.id === selectedCategory);

    return candidateCategories
      .map((cat) => {
        const catFaqs = FAQS.filter(
          (faq) => faq.category === cat.id && matchesQuery(faq, query)
        );
        return {
          ...cat,
          faqs: catFaqs,
        };
      })
      .filter((cat) => cat.faqs.length > 0);
  }, [selectedCategory, query]);

  // Total matching count
  const totalMatchesAcrossAll = categoryCounts.all ?? 0;

  // Toggle accordion item (one open at a time across the FAQ)
  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Reset all filters and search
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Helper to get category short label
  const getCategoryLabel = (catId: FaqCategoryId): string => {
    const cat = FAQ_CATEGORIES.find((c) => c.id === catId);
    return cat?.shortLabel || cat?.label || catId;
  };

  return (
    <section className={styles.section} id="faqs" aria-labelledby="faq-main-heading">
      <div className={styles.container}>
        {/* ── 1. Heading & Introduction ── */}
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>HELP CENTER</p>
          <h2 className={styles.title} id="faq-main-heading">
            Frequently Asked Questions
          </h2>
          <p className={styles.subtitle}>
            Find answers about courses, study materials, exam preparation, AI Tutor, and your account.
          </p>
        </div>

        {/* ── 2. Search Field ── */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} aria-hidden="true" />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frequently asked questions..."
              className={styles.searchInput}
              aria-label="Search frequently asked questions"
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.clearSearchBtn}
                aria-label="Clear search query"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* ── 3. Category Filter Chips ── */}
        <div className={styles.categoriesContainer}>
          <div
            className={styles.categoryPills}
            role="tablist"
            aria-label="FAQ Categories"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              aria-controls="faq-grid-region"
              className={`${styles.categoryPill} ${
                selectedCategory === 'all' ? styles.categoryPillActive : ''
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>All Questions</span>
              <span className={styles.pillCount}>{categoryCounts.all}</span>
            </button>

            {FAQ_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id];
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="faq-grid-region"
                  className={`${styles.categoryPill} ${
                    isSelected ? styles.categoryPillActive : ''
                  } ${count === 0 && query ? styles.categoryPillEmpty : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  title={cat.description}
                >
                  <span>{cat.label}</span>
                  <span className={styles.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Filter Feedback (when searching) ── */}
        {query && (
          <div className={styles.searchFeedback}>
            <span>
              Showing {totalMatchesAcrossAll} {totalMatchesAcrossAll === 1 ? 'match' : 'matches'} for &ldquo;
              <strong>{searchQuery}</strong>&rdquo;
              {selectedCategory !== 'all' && (
                <> in <strong>{getCategoryLabel(selectedCategory)}</strong></>
              )}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className={styles.resetFilterLink}
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* ── 4. Two-Column Category FAQ Grid (8 Equal Dimension Boxes) ── */}
        <div
          id="faq-grid-region"
          className={`${styles.categoryGrid} ${
            visibleCategories.length === 1 ? styles.categoryGridSingle : ''
          }`}
          role="region"
          aria-live="polite"
        >
          {visibleCategories.length > 0 ? (
            visibleCategories.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.id] ?? HelpCircle;

              return (
                <div key={category.id} className={styles.categoryCard}>
                  {/* Category Card Header */}
                  <div className={styles.categoryCardHeader}>
                    <div className={styles.categoryTitleGroup}>
                      <span className={styles.categoryIconWrap}>
                        <IconComponent size={17} aria-hidden="true" />
                      </span>
                      <h3 className={styles.categoryTitle}>{category.label}</h3>
                    </div>
                    <span className={styles.categoryCountBadge}>
                      {category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  {/* Compact Questions List with Subtle Dividers */}
                  <div className={styles.questionsList}>
                    {category.faqs.map((faq) => {
                      const isOpen = openId === faq.id;
                      const buttonId = `faq-btn-${faq.id}`;
                      const panelId = `faq-panel-${faq.id}`;

                      return (
                        <div
                          key={faq.id}
                          className={`${styles.questionRow} ${
                            isOpen ? styles.questionRowOpen : ''
                          }`}
                        >
                          <button
                            id={buttonId}
                            type="button"
                            className={styles.questionButton}
                            onClick={() => toggle(faq.id)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                          >
                            <span className={styles.questionText}>{faq.q}</span>
                            <span className={styles.chevronWrapper}>
                              <ChevronDown
                                className={`${styles.chevron} ${
                                  isOpen ? styles.chevronOpen : ''
                                }`}
                                size={16}
                                aria-hidden="true"
                              />
                            </span>
                          </button>

                          <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className={`${styles.answerGrid} ${
                              isOpen ? styles.answerGridOpen : ''
                            }`}
                          >
                            <div className={styles.answerContent}>
                              <p className={styles.answerText}>{faq.a}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconCircle}>
                <HelpCircle size={26} className={styles.emptyIcon} aria-hidden="true" />
              </div>
              <h3 className={styles.emptyTitle}>No matching questions found</h3>
              <p className={styles.emptyDescription}>
                We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;
                {selectedCategory !== 'all' ? (
                  <> in <strong>{getCategoryLabel(selectedCategory)}</strong>.</>
                ) : (
                  '.'
                )}
                {selectedCategory !== 'all' && totalMatchesAcrossAll > 0 ? (
                  <>
                    {' '}There are <strong>{totalMatchesAcrossAll}</strong> matching{' '}
                    {totalMatchesAcrossAll === 1 ? 'question' : 'questions'} in other categories.
                  </>
                ) : (
                  ' Try searching for terms like notes, JEE, AI tutor, or login.'
                )}
              </p>
              <div className={styles.emptyActions}>
                {selectedCategory !== 'all' && totalMatchesAcrossAll > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={styles.primaryActionButton}
                  >
                    View All Matching Questions ({totalMatchesAcrossAll})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={styles.primaryActionButton}
                  >
                    Clear Search &amp; Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Compact Horizontal Support Strip ── */}
        <div className={styles.supportStrip}>
          <div className={styles.supportLeft}>
            <div className={styles.supportTextWrap}>
              <span className={styles.supportPrompt}>
                <strong>Still need help?</strong> Find answers by contacting our support team.
              </span>
              <div className={styles.supportMicroChannels}>
                <a
                  href="mailto:bouncebackacademy.edu@gmail.com"
                  className={styles.microChannelLink}
                  title="Email support"
                >
                  <Mail size={13} aria-hidden="true" />
                  <span>bouncebackacademy.edu@gmail.com</span>
                </a>
                <span className={styles.microDivider} aria-hidden="true">•</span>
                <a
                  href="https://wa.me/917628024274"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.microChannelLink}
                  title="WhatsApp support"
                >
                  <Phone size={13} aria-hidden="true" />
                  <span>+91 7628024274</span>
                </a>
              </div>
            </div>
          </div>

          <div className={styles.supportActions}>
            <Link href="/contact" className={styles.primarySupportBtn}>
              <span>Contact Support</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/courses" className={styles.secondarySupportBtn}>
              <BookOpen size={14} aria-hidden="true" />
              <span>Explore Courses</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
