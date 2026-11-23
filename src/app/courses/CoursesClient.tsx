"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaGraduationCap,
  FaBook,
  FaEye,
  FaHeart,
  FaBookmark,
  FaShareAlt,
  FaSearch,
  FaTimes,
  FaLayerGroup,
  FaCheck,
  FaCompass,
  FaLaptopCode,
} from 'react-icons/fa';
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

  const getCategoryTheme = (cat: 'secondary' | 'higher-sec' | 'competitive' | 'skills') => {
    switch (cat) {
      case 'secondary':
        return {
          color: '#2563eb', // Royal Blue
          bg: 'rgba(37, 99, 235, 0.08)',
          border: 'rgba(37, 99, 235, 0.22)',
          badgeColor: '#1d4ed8',
          label: 'School Hub',
          icon: <FaBook size={15} />,
        };
      case 'higher-sec':
        return {
          color: '#7c3aed', // Royal Violet
          bg: 'rgba(124, 58, 237, 0.08)',
          border: 'rgba(124, 58, 237, 0.22)',
          badgeColor: '#6d28d9',
          label: 'Senior Secondary',
          icon: <FaGraduationCap size={16} />,
        };
      case 'competitive':
        return {
          color: '#059669', // Emerald
          bg: 'rgba(5, 150, 105, 0.08)',
          border: 'rgba(5, 150, 105, 0.22)',
          badgeColor: '#047857',
          label: 'Entrance Track',
          icon: <FaCompass size={15} />,
        };
      case 'skills':
        return {
          color: '#d97706', // Warm Amber
          bg: 'rgba(217, 119, 6, 0.08)',
          border: 'rgba(217, 119, 6, 0.22)',
          badgeColor: '#b45309',
          label: 'Skill Academy',
          icon: <FaLaptopCode size={15} />,
        };
    }
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
          <span>Curated Academic Hubs</span>
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
            <FaLayerGroup size={12} />
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
          <FaSearch className={styles.searchIcon} />
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
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results Bar */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          {totalFilteredCount} {totalFilteredCount === 1 ? 'curriculum hub' : 'curriculum hubs'} available
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

      {/* 1. Curriculum Hubs Grid */}
      {activeTab !== 'modules' && filteredHubs.length > 0 && (
        <div className={styles.cardsGrid}>
          {filteredHubs.map((course, idx) => {
            const cat = getHubCategory(course.name);
            const theme = getCategoryTheme(cat);
            const hubTitle = course.name.toLowerCase().includes('class')
              ? `${course.name} Curriculum Hub`
              : `${course.name} Examination Hub`;

            // Deterministic interaction counts
            const likes = 2 + ((idx * 3) % 15);
            const bookmarks = 1 + ((idx * 2) % 9);
            const shares = (idx * 4) % 12;

            return (
              <div key={course.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div
                    className={styles.cardIconBox}
                    style={{
                      color: theme.color,
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className={styles.cardBadges}>
                    <span
                      className={styles.cardBadge}
                      style={{
                        color: theme.badgeColor,
                        backgroundColor: theme.bg,
                        borderColor: theme.border,
                        fontWeight: 600,
                      }}
                    >
                      {course.name}
                    </span>
                    <span className={styles.cardBadge}>
                      {theme.label}
                    </span>
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{hubTitle}</h3>
                <p className={styles.cardMeta}>Official NBSE &amp; National Archive • Syllabus Hub</p>

                <div className={styles.cardDivider} />

                <div className={styles.cardFooter}>
                  <div className={styles.cardInteractions}>
                    <span className={styles.interactionItem}>
                      <FaHeart size={11} style={{ color: '#ef4444' }} /> <span>{likes}</span>
                    </span>
                    <span className={styles.interactionItem}>
                      <FaBookmark size={11} style={{ color: '#3b82f6' }} /> <span>{bookmarks}</span>
                    </span>
                    <span className={styles.interactionItem}>
                      <FaShareAlt size={11} style={{ color: '#8b5cf6' }} /> <span>{shares}</span>
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link
                      href={`/class/${encodeURIComponent(course.name)}`}
                      className={styles.btnView}
                    >
                      <FaEye size={12} />
                      <span>Preview</span>
                    </Link>
                    <Link
                      href={`/class/${encodeURIComponent(course.name)}`}
                      className={styles.btnDownload}
                    >
                      <FaGraduationCap size={12} />
                      <span>Open Hub</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Featured Masterclasses & Modules */}
      {activeTab === 'modules' && filteredPremiumItems.length > 0 && (
        <div className={styles.cardsGrid}>
          {filteredPremiumItems.map((item) => {
            const features = item.features ? item.features.split('|').map((f) => f.trim()) : [];
            const typeColor = item.type === 'COURSE' ? '#7c3aed' : item.type === 'LECTURE' ? '#ea580c' : '#059669';

            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {(() => {
                    const imgSrc = getDriveImageUrl(item.imageUrl);
                    return imgSrc ? (
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
                    ) : null;
                  })()}
                  <div
                    className={styles.cardCoverPlaceholder}
                    style={{ display: item.imageUrl ? 'none' : 'flex' }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>🎓</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.75 }}>
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className={styles.cardTop}>
                  <div
                    className={styles.cardIconBox}
                    style={{
                      color: typeColor,
                      backgroundColor: `color-mix(in srgb, ${typeColor} 10%, transparent)`,
                      borderColor: `color-mix(in srgb, ${typeColor} 25%, transparent)`,
                    }}
                  >
                    <FaBook size={15} />
                  </div>
                  <div className={styles.cardBadges}>
                    <span
                      className={styles.cardBadge}
                      style={{
                        color: typeColor,
                        borderColor: `color-mix(in srgb, ${typeColor} 25%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${typeColor} 8%, transparent)`,
                        fontWeight: 600,
                      }}
                    >
                      {item.type}
                    </span>
                    {item.className && (
                      <span className={styles.cardBadge}>{item.className}</span>
                    )}
                  </div>
                  <span className={styles.cardYearBadge} style={{ color: '#10b981', fontWeight: 700 }}>
                    ₹{item.price}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardMeta}>{item.description}</p>

                {features.length > 0 && (
                  <div className={styles.featuresList}>
                    {features.slice(0, 2).map((feat, i) => (
                      <div key={i} className={styles.featureItem}>
                        <FaCheck size={9} style={{ color: '#10b981' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.cardDivider} />

                <div className={styles.cardFooter}>
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
