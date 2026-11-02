import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import AddToCartButton from '@/components/cart/AddToCartButton';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Courses & Learning Modules | Bounce Back Academy',
  description:
    'Explore comprehensive syllabus-aligned courses, past papers, notes, and video modules for Classes 8–12, JEE, and NEET.',
  alternates: {
    canonical: '/courses',
  },
};

export default async function CoursesPage() {
  const [courses, premiumItems] = await Promise.all([
    prisma.course.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.premiumItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Sparkles size={14} />
          <span>Curated Learning Programs</span>
        </div>
        <h1 className={styles.title}>Courses &amp; Learning Modules</h1>
        <p className={styles.subtitle}>
          Explore structured curriculum paths, chapter notes, and in-depth video modules curated for academic success.
        </p>
      </div>

      {/* Curriculum Class Hubs */}
      {courses.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Curriculum Hubs</h2>
              <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', marginTop: '4px' }}>
                Select your class or examination to access dedicated notes, past papers, and video lectures.
              </p>
            </div>
          </div>
          <div className={styles.categoryGrid}>
            {courses.map((course) => (
              <div key={course.id} className={styles.areaCard}>
                <h3 className={styles.areaTitle}>{course.name}</h3>
                <p className={styles.areaDesc}>
                  Comprehensive syllabus coverage, chapter notes, and verified past question papers.
                </p>
                <div className={styles.areaFooter}>
                  <Link
                    href={`/class/${encodeURIComponent(course.name)}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <span>Open {course.name} Hub</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Courses / Bundles Section */}
      {premiumItems.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Featured Courses &amp; Modules</h2>
              <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', marginTop: '4px' }}>
                In-depth masterclasses and curated syllabus packages with lifetime access.
              </p>
            </div>
            <Link href="/premium" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              View All Courses &rarr;
            </Link>
          </div>

          <div className={styles.coursesGrid}>
            {premiumItems.map((item) => {
              const features = item.features ? item.features.split('|').map((f) => f.trim()) : [];
              return (
                <div key={item.id} className={styles.courseCard}>
                  <div className={styles.courseHeader}>
                    <Badge variant="purple" size="sm">{item.type}</Badge>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span className={styles.coursePrice}>₹{item.price}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, textDecoration: 'line-through' }}>
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className={styles.courseName}>{item.title}</h3>
                  <p className={styles.courseDesc}>{item.description}</p>

                  {features.length > 0 && (
                    <div className={styles.featuresList}>
                      {features.slice(0, 3).map((feat, i) => (
                        <div key={i} className={styles.featureItem}>
                          <CheckCircle2 size={13} color="#10b981" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
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
        </section>
      )}
    </div>
  );
}
