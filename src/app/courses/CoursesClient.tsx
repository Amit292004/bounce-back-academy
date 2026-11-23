"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Layers,
  Search,
  X,
  ArrowRight,
  Play,
  FileText,
} from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { getDriveImageUrl } from '@/lib/driveImage';
import styles from './page.module.css';

interface CourseItem {
  id: string;
  name: string;
  createdAt?: string | Date;
}

interface PremiumItem {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  type: string;
  imageUrl?: string | null;
  className?: string | null;
  features?: string | null;
  createdAt?: string | Date;
}

interface CoursesClientProps {
  initialCourses: CourseItem[];
  initialPremiumItems: PremiumItem[];
}

type FilterTab = 'all' | 'secondary' | 'higher-sec' | 'competitive' | 'modules';

export default function CoursesClient({ initialCourses, initialPremiumItems }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Classification helper for curriculum hubs
  const getHubCategory = (name: string): 'secondary' | 'higher-sec' | 'competitive' | 'skills' => {
    const lower = name.toLowerCase().trim();
    if (lower === 'skills') return 'skills';
    if (lower.includes('class 8') || lower.includes('class 9') || lower.includes('class 10')) {
      return 'secondary';
    }
    if (lower.includes('class 11') || lower.includes('class 12')) {
      return 'higher-sec';
    }
    return 'competitive';
  };

  const getHubIcon = (name: string) => {
    const lower = name.toLowerCase().trim();
    if (lower === 'skills') {
      return <Layers size={18} />;
    }
    if (lower.includes('class 11') || lower.includes('class 12')) {
      return <BookOpen size={18} />;
    }
    if (lower.includes('class 8') || lower.includes('class 9') || lower.includes('class 10')) {
      return <GraduationCap size={18} />;
    }
    return <Trophy size={18} />;
  };

  const getHubBadge = (name: string): string => {
    const lower = name.toLowerCase().trim();
    if (lower === 'skills') return 'Skill Academy';
    if (lower.includes('class 8') || lower.includes('class 9') || lower.includes('class 10')) {
      return 'Curriculum';
    }
    if (lower.includes('class 11') || lower.includes('class 12')) {
      return 'Senior Sec';
    }
    return 'Entrance Track';
  };

  const getHubDescription = (name: string): string => {
    const lower = name.toLowerCase().trim();
    if (lower === 'class 8') return 'Comprehensive Class 8 syllabus coverage, chapter notes, and past 10-year question papers.';
    if (lower === 'class 9') return 'Comprehensive Class 9 syllabus coverage, chapter notes, and past 10-year question papers.';
    if (lower === 'class 10') return 'Full board preparation, chapter summaries, past 10-year papers, and practice tests.';
    if (lower === 'class 11') return 'Stream-wise syllabus notes, past question papers, and video lectures.';
    if (lower === 'class 12') return 'Board examination archive, question banks, and verified revision notes.';
    if (lower === 'cuet') return 'High-yield topic notes, previous year question banks, and mock tests.';
    if (lower === 'jee') return 'Physics derivations, chemical equations, and engineering prep papers.';
    if (lower === 'neet') return 'Medical entrance question papers, biology notes, and exam practice.';
    if (lower === 'skills') return 'Practical masterclasses in AI tools, productivity, and modern workflows.';
    return 'Dedicated syllabus notes, verified past question papers, and video lectures.';
  };

  // Category counts
  const counts = useMemo(() => {
    const secondaryCount = initialCourses.filter((c) => getHubCategory(c.name) === 'secondary').length;
    const higherSecCount = initialCourses.filter((c) => getHubCategory(c.name) === 'higher-sec').length;
    const competitiveCount = initialCourses.filter((c) => {
      const cat = getHubCategory(c.name);
      return cat === 'competitive' || cat === 'skills';
    }).length;

    return {
      all: initialCourses.length,
      secondary: secondaryCount,
      higherSec: higherSecCount,
      competitive: competitiveCount,
      modules: initialPremiumItems.length,
    };
  }, [initialCourses, initialPremiumItems]);

  // Filtered curriculum hubs
  const filteredHubs = useMemo(() => {
    if (activeTab === 'modules') return [];

    return initialCourses.filter((course) => {
      const cat = getHubCategory(course.name);
      if (activeTab === 'secondary' && cat !== 'secondary') return false;
      if (activeTab === 'higher-sec' && cat !== 'higher-sec') return false;
      if (activeTab === 'competitive' && cat !== 'competitive' && cat !== 'skills') return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const name = course.name.toLowerCase();
      return (
        name.includes(q) ||
        (q.includes('class') && name.includes(q.replace('class', '').trim())) ||
        (q === 'school' && (cat === 'secondary' || cat === 'higher-sec')) ||
        (q === 'exam' && cat === 'competitive') ||
        (q === 'skills' && cat === 'skills')
      );
    });
  }, [initialCourses, activeTab, searchQuery]);

  // Filtered premium items
  const filteredPremiumItems = useMemo(() => {
    if (activeTab !== 'modules') return [];

    return initialPremiumItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.className && item.className.toLowerCase().includes(q)) ||
        item.type.toLowerCase().includes(q)
      );
    });
  }, [initialPremiumItems, activeTab, searchQuery]);

  const totalFilteredCount = activeTab === 'modules' ? filteredPremiumItems.length : filteredHubs.length;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Curated Learning Programs</span>
        </div>
        <h1 className={styles.title}>Courses &amp; Curriculum Hubs</h1>
        <p className={styles.subtitle}>
          Official NBSE &amp; National syllabus coverage. Free online preview of chapter notes, past exam papers, and video lectures.
        </p>
      </div>

      {/* Toolbar (Segmented Tabs & Search) */}
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentedBtn} ${activeTab === 'all' ? styles.segmentedBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={13} />
            <span>All Hubs</span>
            <span className={styles.tabCount}>{counts.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentedBtn} ${activeTab === 'secondary' ? styles.segmentedBtnActive : ''}`}
            onClick={() => setActiveTab('secondary')}
          >
            <span>Secondary (8–10)</span>
            <span className={styles.tabCount}>{counts.secondary}</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentedBtn} ${activeTab === 'higher-sec' ? styles.segmentedBtnActive : ''}`}
            onClick={() => setActiveTab('higher-sec')}
          >
            <span>Higher Sec (11–12)</span>
            <span className={styles.tabCount}>{counts.higherSec}</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentedBtn} ${activeTab === 'competitive' ? styles.segmentedBtnActive : ''}`}
            onClick={() => setActiveTab('competitive')}
          >
            <span>Entrance &amp; Skills</span>
            <span className={styles.tabCount}>{counts.competitive}</span>
          </button>
          {counts.modules > 0 && (
            <button
              type="button"
              className={`${styles.segmentedBtn} ${activeTab === 'modules' ? styles.segmentedBtnActive : ''}`}
              onClick={() => setActiveTab('modules')}
            >
              <span>Featured Courses</span>
              <span className={styles.tabCount}>{counts.modules}</span>
            </button>
          )}
        </div>

        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by title, subject, or class…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results Bar */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          Showing {totalFilteredCount} {totalFilteredCount === 1 ? 'learning program' : 'learning programs'}
        </span>
        {searchQuery && (
          <button
            type="button"
            className={styles.resetFiltersBtn}
            onClick={() => setSearchQuery('')}
          >
            Reset Search
          </button>
        )}
      </div>

      {/* Empty State */}
      {totalFilteredCount === 0 && (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>No curriculum hubs found</h3>
          <p className={styles.emptyStateText}>
            We couldn&apos;t find any hubs matching &ldquo;{searchQuery}&rdquo;. Try another search keyword or reset filters.
          </p>
          <button
            type="button"
            className={styles.btnResetAll}
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
            }}
          >
            View All Hubs
          </button>
        </div>
      )}

      {/* 1. Curriculum Hubs Grid (Exact Dashboard Card Design) */}
      {activeTab !== 'modules' && filteredHubs.length > 0 && (
        <div className={styles.cardsGrid}>
          {filteredHubs.map((course) => (
            <Link
              key={course.id}
              href={`/class/${encodeURIComponent(course.name)}`}
              className={styles.statCard}
            >
              <div className={styles.statTop}>
                <div className={styles.statIcon}>
                  {getHubIcon(course.name)}
                </div>
                <span className={styles.statBadge}>
                  {getHubBadge(course.name)}
                </span>
              </div>

              <div className={styles.statValue}>{course.name}</div>
              <div className={styles.statLabel}>{getHubDescription(course.name)}</div>

              <div className={styles.statAction}>
                <span>Open Hub</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 2. Featured Masterclasses & Modules */}
      {activeTab === 'modules' && filteredPremiumItems.length > 0 && (
        <div className={styles.cardsGrid}>
          {filteredPremiumItems.map((item) => {
            const imgSrc = getDriveImageUrl(item.imageUrl);
            return (
              <div key={item.id} className={styles.featuredCard}>
                <div className={styles.imageWrapper}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className={styles.cardCoverImg}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.style.display = 'none';
                        const sib = t.nextElementSibling as HTMLElement;
                        if (sib) sib.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={styles.cardCoverPlaceholder}
                    style={{ display: imgSrc ? 'none' : 'flex' }}
                  >
                    <GraduationCap size={28} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.75 }}>
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className={styles.statTop}>
                  <div className={styles.statIcon}>
                    {item.type === 'NOTE' ? (
                      <BookOpen size={16} />
                    ) : item.type === 'PYQ' ? (
                      <FileText size={16} />
                    ) : item.type === 'LECTURE' ? (
                      <Play size={16} />
                    ) : (
                      <GraduationCap size={16} />
                    )}
                  </div>
                  <span className={styles.statBadge}>{item.type}</span>
                </div>

                <div className={styles.statValue} style={{ fontSize: '1rem', lineHeight: 1.35 }}>
                  {item.title}
                </div>
                <div className={styles.statLabel} style={{ minHeight: '2.5rem' }}>
                  {item.description}
                </div>

                <div className={styles.featuredPriceRow}>
                  <span className={styles.featuredPrice}>₹{item.price}</span>
                  {item.originalPrice && (
                    <span className={styles.featuredOriginalPrice}>₹{item.originalPrice}</span>
                  )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <AddToCartButton
                    course={{
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      price: item.price,
                      originalPrice: item.originalPrice,
                      type: item.type,
                      imageUrl: item.imageUrl,
                      className: item.className,
                      features: item.features,
                    }}
                    showViewDetails={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
