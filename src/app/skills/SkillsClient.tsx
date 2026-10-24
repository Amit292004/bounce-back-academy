'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  Code2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export interface DbPremiumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  features: string | null;
  className: string | null;
}

interface SkillsClientProps {
  dbItems: DbPremiumItem[];
}

function SkillsClientInner({ dbItems }: SkillsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const sp = new URLSearchParams(searchParams.toString());
    if (cat !== 'all') {
      sp.set('category', cat);
    } else {
      sp.delete('category');
    }
    router.replace(`/skills?${sp.toString()}`, { scroll: false });
  };

  // Filter DB courses by category using className or title
  const filteredDbItems = useMemo(() => {
    if (selectedCategory === 'all') return dbItems;
    if (selectedCategory === 'ai-tools') {
      return dbItems.filter(
        (i) =>
          i.title.toLowerCase().includes('ai') ||
          i.title.toLowerCase().includes('chatgpt') ||
          (i.className ?? '').toLowerCase().includes('ai'),
      );
    }
    if (selectedCategory === 'web-dev') {
      return dbItems.filter(
        (i) =>
          i.title.toLowerCase().includes('web') ||
          (i.className ?? '').toLowerCase().includes('web'),
      );
    }
    if (selectedCategory === 'programming') {
      return dbItems.filter(
        (i) =>
          i.title.toLowerCase().includes('program') ||
          i.title.toLowerCase().includes('python') ||
          i.title.toLowerCase().includes('javascript') ||
          (i.className ?? '').toLowerCase().includes('program'),
      );
    }
    // For any other category filter by className match
    return dbItems.filter(
      (i) => (i.className ?? '').toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [dbItems, selectedCategory]);

  const categoryPills = [
    { id: 'all', label: 'All Skill Courses' },
    { id: 'ai-tools', label: 'AI Tools & Productivity' },
    { id: 'web-dev', label: 'Web Development' },
    { id: 'programming', label: 'Programming Fundamentals' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Code2 size={15} />
          <span>Practical Skills Academy</span>
        </div>
        <h1 className={styles.title}>Practical Skill Courses</h1>
        <p className={styles.subtitle}>
          Real-world competencies beyond textbook theory. Master modern AI tools, full-stack web engineering,
          core programming fundamentals, and career-oriented digital workflows.
        </p>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        {categoryPills.map((p) => {
          const isActive = selectedCategory === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectCategory(p.id)}
              className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Banner */}
      <div className={styles.trackBanner}>
        <div>
          <div className={styles.trackBannerTitle}>Built for High-Growth Competency</div>
          <div className={styles.trackBannerDesc}>
            Every course combines practical projects, lifetime curriculum updates, and direct integration with the Bounce Back AI Doubt Solver.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button href="/premium" variant="primary" size="sm">
            <Zap size={14} />
            <span>Premium Store</span>
          </Button>
          <Button href="/class/Skills" variant="secondary" size="sm">
            <Layers size={14} />
            <span>Skills Hub</span>
          </Button>
        </div>
      </div>

      {/* DB Items — Real Purchasable Courses */}
      {filteredDbItems.length > 0 ? (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                <Sparkles size={18} color="#f59e0b" />
                <span>Featured Masterclasses &amp; Workshops</span>
              </h2>
              <p className={styles.sectionSub}>
                Verified specialized courses available for enrollment with lifetime access.
              </p>
            </div>
            <Link href="/premium" style={{ color: '#818cf8', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              View Store Catalog &rarr;
            </Link>
          </div>

          <div className={styles.coursesGrid}>
            {filteredDbItems.map((item) => {
              // Extract clean preview bullets from real description
              const rawDesc = item.description || '';
              const cleanLines = rawDesc
                .split('\n')
                .map((l) => l.trim())
                .filter(
                  (l) =>
                    l.length > 0 &&
                    !l.toLowerCase().includes('special offer') &&
                    !l.toLowerCase().includes('bounce back academy'),
                );

              return (
                <div key={item.id} className={styles.courseCard}>
                  <div className={styles.cardTopRow}>
                    <Badge variant="warning" size="sm">
                      {item.type === 'LECTURE' ? 'Video Masterclass' : 'Curated Course'}
                    </Badge>
                    <div className={styles.priceTag}>
                      <span>₹{item.price}</span>
                      {item.originalPrice && (
                        <span className={styles.origPrice}>₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  <h3 className={styles.courseTitle}>{item.title}</h3>
                  <p className={styles.courseDesc}>
                    {cleanLines[0] || 'Master modern digital tools and AI applications.'}
                  </p>

                  <div className={styles.outcomesList}>
                    {cleanLines.slice(1, 4).map((line, idx) => (
                      <div key={idx} className={styles.outcomeItem}>
                        <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{line.replace(/^[•\-\*✅💡📜⚡🎯🚀]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.cardFooter}>
                    <Button href={`/premium/${item.id}`} variant="primary" size="sm" style={{ flex: 1 }}>
                      <span>View Course Details</span>
                      <ArrowRight size={14} />
                    </Button>
                    <Button href={`/premium?item=${item.id}`} variant="outline" size="sm">
                      <span>Enroll</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Code2 size={28} />}
          title={selectedCategory === 'all' ? 'No skill courses available yet' : 'No courses found in this category'}
          description={
            selectedCategory === 'all'
              ? 'Check back soon — or explore topics right now with our AI Tutor.'
              : "Try selecting 'All Skill Courses' to browse our full catalog, or ask our AI Tutor."
          }
          action={
            selectedCategory === 'all' ? (
              <Button variant="primary" size="sm" href="/ai-tutor">
                Explore with AI Tutor
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => handleSelectCategory('all')}>
                Show All Courses
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

export default function SkillsClient(props: SkillsClientProps) {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.6 }}>Loading Skill Courses...</div>}>
      <SkillsClientInner {...props} />
    </Suspense>
  );
}
