import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import { BookOpen, GraduationCap, Sparkles, Code2, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AddToCartButton from '@/components/cart/AddToCartButton';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Learning Pathways & Courses | Bounce Back Academy',
  description:
    'Structured educational learning paths for NBSE Classes 8–12, competitive exams (JEE, NEET, CUET), AI Tutor, and practical skill development.',
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

  const schoolCourses = courses.filter((c) =>
    ['class 8', 'class 9', 'class 10', 'class 11', 'class 12'].includes(c.name.toLowerCase())
  );
  const examCourses = courses.filter((c) =>
    ['jee', 'neet', 'cuet'].includes(c.name.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Sparkles size={14} />
          <span>Complete Educational Ecosystem</span>
        </div>
        <h1 className={styles.title}>Learning Pathways &amp; Courses</h1>
        <p className={styles.subtitle}>
          Explore structured curriculum paths for school examinations, national competitive entrance tests,
          instant AI academic guidance, and hands-on career skills.
        </p>
      </div>

      {/* 4 Connected Learning Areas */}
      <div className={styles.categoryGrid}>
        {/* Area 1: School Learning */}
        <div className={styles.areaCard}>
          <div className={styles.areaIconWrap} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <GraduationCap size={24} />
          </div>
          <h2 className={styles.areaTitle}>School Learning</h2>
          <p className={styles.areaDesc}>
            Aligned with NBSE syllabus for Classes 8 through 12. Complete coverage of Mathematics, Science, Social Sciences, English, and more.
          </p>
          <div className={styles.areaBadges}>
            {schoolCourses.map((c) => (
              <Badge key={c.id} variant="primary" size="sm">
                {c.name}
              </Badge>
            ))}
          </div>
          <div className={styles.areaFooter}>
            <Link href="/school" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#818cf8', textDecoration: 'none' }}>
              <span>Explore School Learning</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Area 2: Competitive Entrance */}
        <div className={styles.areaCard}>
          <div className={styles.areaIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <BookOpen size={24} />
          </div>
          <h2 className={styles.areaTitle}>Competitive Exam Prep</h2>
          <p className={styles.areaDesc}>
            Focused preparation for JEE Main &amp; Advanced, NEET UG, and CUET with chapter-wise problem banks, mock tests, and previous year papers.
          </p>
          <div className={styles.areaBadges}>
            {examCourses.map((c) => (
              <Badge key={c.id} variant="danger" size="sm">
                {c.name}
              </Badge>
            ))}
          </div>
          <div className={styles.areaFooter}>
            <Link href="/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f87171', textDecoration: 'none' }}>
              <span>Explore Exam Paths</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Area 3: Bounce Back AI */}
        <div className={styles.areaCard}>
          <div className={styles.areaIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Sparkles size={24} />
          </div>
          <h2 className={styles.areaTitle}>Bounce Back AI</h2>
          <p className={styles.areaDesc}>
            24/7 academic tutor powered by modern AI. Get rigorous step-by-step mathematical derivations, conceptual breakdowns, and instant doubt clarity.
          </p>
          <div className={styles.areaBadges}>
            <Badge variant="success" size="sm">Free for Students</Badge>
            <Badge variant="default" size="sm">Multi-Language</Badge>
            <Badge variant="purple" size="sm">Step-by-Step</Badge>
          </div>
          <div className={styles.areaFooter}>
            <Link href="/ai-tutor" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', textDecoration: 'none' }}>
              <span>Launch AI Tutor</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Area 4: Skill Development */}
        <div className={styles.areaCard}>
          <div className={styles.areaIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Code2 size={24} />
          </div>
          <h2 className={styles.areaTitle}>Skill Development</h2>
          <p className={styles.areaDesc}>
            Practical career skills beyond textbooks: Artificial Intelligence tools, modern web engineering, programming foundations, and digital literacy.
          </p>
          <div className={styles.areaBadges}>
            <Badge variant="warning" size="sm">AI Tools</Badge>
            <Badge variant="cyan" size="sm">Coding</Badge>
            <Badge variant="default" size="sm">Self-Paced</Badge>
          </div>
          <div className={styles.areaFooter}>
            <Link href="/skills" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', textDecoration: 'none' }}>
              <span>Explore Practical Skills</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Courses / Bundles Section */}
      {premiumItems.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Featured Courses &amp; Modules</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '4px' }}>
                In-depth masterclasses and curated syllabus packages with lifetime access.
              </p>
            </div>
            <Link href="/premium" style={{ color: '#818cf8', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
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
