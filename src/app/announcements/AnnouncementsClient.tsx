"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertCircle,
  Sparkles,
  Calendar,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  CheckCircle2,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import styles from './page.module.css';

export interface AnnouncementItem {
  id: string;
  message: string | null;
  imageUrl: string | null;
  type: string;
  isActive: boolean;
  priority: number;
  className?: string | null;
  createdAt: string | Date;
}

interface AnnouncementsClientProps {
  initialAnnouncements: AnnouncementItem[];
}

function stripEmojis(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
    .trim();
}

function parseAnnouncement(message?: string | null) {
  if (!message) return { title: 'Official Announcement', body: '' };
  const clean = stripEmojis(message);

  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return { title: lines[0], body: lines.slice(1).join(' ') };
  }

  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts[0].length < 40) {
      return { title: parts[0].trim(), body: parts.slice(1).join(':').trim() };
    }
  }

  if (clean.length > 45 && clean.includes('.')) {
    const firstDot = clean.indexOf('.');
    if (firstDot > 10 && firstDot < 45) {
      return {
        title: clean.slice(0, firstDot).trim(),
        body: clean.slice(firstDot + 1).trim(),
      };
    }
  }

  return { title: clean, body: '' };
}

function formatDate(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export default function AnnouncementsClient({ initialAnnouncements }: AnnouncementsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'classes' | 'updates'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('lastSeenAnnouncement', new Date().toISOString());
      window.dispatchEvent(new Event('announcementsSeen'));
    } catch {}
  }, []);

  const totalCount = initialAnnouncements.length;
  const alertsCount = useMemo(
    () => initialAnnouncements.filter((a) => a.type === 'BANNER' || a.priority > 0).length,
    [initialAnnouncements]
  );
  const classCount = useMemo(
    () => initialAnnouncements.filter((a) => Boolean(a.className)).length,
    [initialAnnouncements]
  );
  const updatesCount = useMemo(
    () => initialAnnouncements.filter((a) => a.type === 'SECTION' && !a.className).length,
    [initialAnnouncements]
  );

  const filteredAnnouncements = useMemo(() => {
    return initialAnnouncements.filter((item) => {
      // Tab filter
      if (activeTab === 'alerts' && item.type !== 'BANNER' && item.priority <= 0) return false;
      if (activeTab === 'classes' && !item.className) return false;
      if (activeTab === 'updates' && (item.type === 'BANNER' || item.className)) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msg = (item.message || '').toLowerCase();
        const cls = (item.className || '').toLowerCase();
        const typ = (item.type || '').toLowerCase();
        return msg.includes(q) || cls.includes(q) || typ.includes(q);
      }

      return true;
    });
  }, [initialAnnouncements, activeTab, searchQuery]);

  return (
    <div className={styles.container}>
      {/* ── Page Header: Match Dashboard / Courses Standard ── */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Official Notice Board</span>
        </div>

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Announcements &amp; Notices</h1>
            <p className={styles.subtitle}>
              Official academic notices, syllabus circulars, exam schedule releases, and platform updates for students.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/" className={styles.btnActionSecondary}>
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
            <Link href="/dashboard" className={styles.btnActionPrimary}>
              <GraduationCap size={14} />
              <span>Student Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4-Column Stat Summary Cards (Exact Dashboard / Courses Pattern) ── */}
      <div className={styles.statsRow}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`${styles.statCard} ${activeTab === 'all' ? styles.statCardActive : ''}`}
        >
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <Bell size={18} />
            </div>
            <span className={styles.statBadge}>Archive</span>
          </div>
          <div className={styles.statValue}>{totalCount}</div>
          <div className={styles.statLabel}>Total Published Notices</div>
          <div className={styles.statAction}>
            <span>View All</span>
            <ArrowRight size={12} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`${styles.statCard} ${activeTab === 'alerts' ? styles.statCardActive : ''}`}
        >
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <AlertCircle size={18} />
            </div>
            <span className={styles.statBadge}>Priority</span>
          </div>
          <div className={styles.statValue}>{alertsCount}</div>
          <div className={styles.statLabel}>Urgent Alerts &amp; Banners</div>
          <div className={styles.statAction}>
            <span>View Alerts</span>
            <ArrowRight size={12} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`${styles.statCard} ${activeTab === 'classes' ? styles.statCardActive : ''}`}
        >
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <GraduationCap size={18} />
            </div>
            <span className={styles.statBadge}>Curriculum</span>
          </div>
          <div className={styles.statValue}>{classCount > 0 ? `${classCount} Class` : 'All Batches'}</div>
          <div className={styles.statLabel}>Class-Specific Notices</div>
          <div className={styles.statAction}>
            <span>Class Feeds</span>
            <ArrowRight size={12} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('updates')}
          className={`${styles.statCard} ${activeTab === 'updates' ? styles.statCardActive : ''}`}
        >
          <div className={styles.statTop}>
            <div className={styles.statIcon}>
              <Sparkles size={18} />
            </div>
            <span className={styles.statBadge}>Platform</span>
          </div>
          <div className={styles.statValue}>{updatesCount}</div>
          <div className={styles.statLabel}>Features &amp; Study Notes</div>
          <div className={styles.statAction}>
            <span>Explore Updates</span>
            <ArrowRight size={12} />
          </div>
        </button>
      </div>

      {/* ── Toolbar: Segmented Tabs & Search ── */}
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`${styles.segmentedBtn} ${activeTab === 'all' ? styles.segmentedBtnActive : ''}`}
          >
            <Bell size={13} />
            <span>All Notices</span>
            <span className={styles.tabCount}>{totalCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'alerts'}
            onClick={() => setActiveTab('alerts')}
            className={`${styles.segmentedBtn} ${activeTab === 'alerts' ? styles.segmentedBtnActive : ''}`}
          >
            <AlertCircle size={13} />
            <span>Official Alerts</span>
            <span className={styles.tabCount}>{alertsCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'classes'}
            onClick={() => setActiveTab('classes')}
            className={`${styles.segmentedBtn} ${activeTab === 'classes' ? styles.segmentedBtnActive : ''}`}
          >
            <GraduationCap size={13} />
            <span>Class Updates</span>
            <span className={styles.tabCount}>{classCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'updates'}
            onClick={() => setActiveTab('updates')}
            className={`${styles.segmentedBtn} ${activeTab === 'updates' ? styles.segmentedBtnActive : ''}`}
          >
            <Sparkles size={13} />
            <span>Features</span>
            <span className={styles.tabCount}>{updatesCount}</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements, circulars, or keywords..."
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Results Bar ── */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          Showing {filteredAnnouncements.length} of {totalCount} announcements
          {activeTab !== 'all' && ` · Filtered by ${activeTab}`}
          {searchQuery && ` · Matching "${searchQuery}"`}
        </span>

        {(activeTab !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className={styles.resetFiltersBtn}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ── Announcements Cards Grid ── */}
      {filteredAnnouncements.length > 0 ? (
        <div className={styles.cardsGrid}>
          {filteredAnnouncements.map((item) => {
            const { title, body } = parseAnnouncement(item.message);
            const isAlert = item.type === 'BANNER' || item.priority > 0;

            return (
              <article
                key={item.id}
                className={styles.announcementCard}
                onClick={() => setSelectedAnnouncement(item)}
              >
                {item.imageUrl && (
                  <div className={styles.imageWrapper}>
                    <img
                      src={item.imageUrl}
                      alt={title}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                  </div>
                )}

                <div className={styles.cardBody}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}>
                      {isAlert ? <AlertCircle size={18} /> : <Bell size={18} />}
                    </div>
                    <div className={styles.badgeGroup}>
                      <span className={styles.statBadge}>
                        {isAlert ? 'Alert' : 'Update'}
                      </span>
                      {item.className && (
                        <span className={styles.classBadge}>
                          <GraduationCap size={11} />
                          <span>{item.className}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.statValue}>{title}</div>

                  <div className={styles.statLabel}>
                    {body || 'Official communication released by Bounce Back Academy administration.'}
                  </div>

                  <div className={styles.cardDivider} />

                  <div className={styles.cardBottomRow}>
                    <div className={styles.dateMeta}>
                      <Calendar size={12} />
                      <span suppressHydrationWarning>{formatDate(item.createdAt)}</span>
                    </div>

                    <div className={styles.statAction}>
                      <span>Read Notice</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}>
            <Bell size={28} />
          </div>
          <h3 className={styles.emptyTitle}>No announcements found</h3>
          <p className={styles.emptySubtitle}>
            {searchQuery
              ? `No announcements match "${searchQuery}". Try a different keyword or reset filters.`
              : 'There are currently no active announcements in this category.'}
          </p>
          {(activeTab !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              className={styles.emptyActionBtn}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── Detail Modal for Full Announcement Reading ── */}
      {selectedAnnouncement && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedAnnouncement(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.statIcon}>
                  {selectedAnnouncement.type === 'BANNER' || selectedAnnouncement.priority > 0 ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Bell size={18} />
                  )}
                </div>
                <div>
                  <div className={styles.badgeGroup}>
                    <span className={styles.statBadge}>
                      {selectedAnnouncement.type === 'BANNER' ? 'Official Alert' : 'Academic Notice'}
                    </span>
                    {selectedAnnouncement.className && (
                      <span className={styles.classBadge}>
                        <GraduationCap size={11} />
                        <span>{selectedAnnouncement.className}</span>
                      </span>
                    )}
                  </div>
                  <div className={styles.dateMeta} style={{ marginTop: '0.3rem' }}>
                    <Calendar size={12} />
                    <span suppressHydrationWarning>{formatDate(selectedAnnouncement.createdAt)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {selectedAnnouncement.imageUrl && (
              <div className={styles.modalImageWrapper}>
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt="Announcement image"
                  className={styles.modalImage}
                />
              </div>
            )}

            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>
                {parseAnnouncement(selectedAnnouncement.message).title}
              </h2>
              <div className={styles.modalText}>
                {parseAnnouncement(selectedAnnouncement.message).body ||
                  selectedAnnouncement.message ||
                  'No additional details provided.'}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.modalStatus}>
                <CheckCircle2 size={13} />
                <span>Verified Official Notice</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseActionBtn}
                onClick={() => setSelectedAnnouncement(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
