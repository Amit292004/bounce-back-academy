"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  FileText,
  BookOpen,
  Award,
} from 'lucide-react';
import styles from './PromoCarousel.module.css';
import { HeroAdData } from '@/lib/adConfig';

export interface PromoSlide {
  id: string;
  badge: string;
  badgeType: 'alert' | 'ai' | 'study' | 'sponsored';
  title: string;
  description: string;
  highlights: string[];
  ctaText: string;
  ctaHref: string;
  meta: string;
  accentColor: string;
  bgGlow: string;
  imageUrl?: string | null;
  icon: typeof FileText;
}

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    id: 'exam-alert-2026',
    badge: 'NBSE 2026 Exam Alert',
    badgeType: 'alert',
    title: '10-Year Solved Question Papers',
    description: 'Class 10 & 12 board examination papers with official scoring rubrics, blueprints, and step-by-step solutions.',
    highlights: ['All Subjects Included', 'Official Scoring Keys', 'Free PDF Downloads'],
    ctaText: 'Explore Past Papers',
    ctaHref: '/papers',
    meta: 'Board Exam Special',
    accentColor: '#f97316',
    bgGlow: 'rgba(249, 115, 22, 0.16)',
    icon: FileText,
  },
  {
    id: 'ai-doubt-assistant',
    badge: '24/7 AI Doubt Solver',
    badgeType: 'ai',
    title: 'Instant Textbook Doubt Resolution',
    description: 'Upload any question from Science, Maths, or Board syllabus. Get step-by-step derivations and answers in seconds.',
    highlights: ['Zero Wait Time', 'Class 8–12 & JEE/NEET', '100% Free Access'],
    ctaText: 'Try AI Doubt Solver',
    ctaHref: '/ai-tutor',
    meta: 'Interactive AI Tool',
    accentColor: '#818cf8',
    bgGlow: 'rgba(129, 140, 248, 0.18)',
    icon: Sparkles,
  },
  {
    id: 'study-notes-pack',
    badge: 'Study Material Pack',
    badgeType: 'study',
    title: 'High-Yield Chapter Revision Notes',
    description: 'Hand-curated revision notes and quick formula sheets designed specifically to score 90%+ in your board exams.',
    highlights: ['Formula Cheat-Sheets', 'Concept Summaries', 'Updated 2026 Syllabus'],
    ctaText: 'Download Study Notes',
    ctaHref: '/notes',
    meta: 'Curriculum Verified',
    accentColor: '#10b981',
    bgGlow: 'rgba(16, 185, 129, 0.16)',
    icon: BookOpen,
  },
  {
    id: 'sponsored-crash-course',
    badge: 'Sponsored Campaign',
    badgeType: 'sponsored',
    title: 'Targeted Exam Crash Courses',
    description: 'Intensive board and entrance preparation batches with structured milestones and verified faculty mentorship.',
    highlights: ['Limited Batch Seats', 'Weekly Practice Quizzes', 'Personalized Mentorship'],
    ctaText: 'View Available Batches',
    ctaHref: '/courses',
    meta: 'Admissions Open',
    accentColor: '#ec4899',
    bgGlow: 'rgba(236, 72, 153, 0.16)',
    icon: Award,
  },
];

interface PromoCarouselProps {
  slides?: PromoSlide[];
  userClass?: string | null;
  initialAd?: HeroAdData | null;
  initialAds?: HeroAdData[];
}

function buildSlidesFromAds(
  input?: { ads?: HeroAdData[]; [key: string]: any } | HeroAdData[] | HeroAdData | null,
  fallbackSlides = DEFAULT_SLIDES
): PromoSlide[] {
  let adList: HeroAdData[] = [];
  if (Array.isArray(input)) {
    adList = input;
  } else if (input && typeof input === 'object' && Array.isArray((input as any).ads)) {
    adList = (input as any).ads;
  } else if (input && typeof input === 'object' && (input as HeroAdData).imageUrl) {
    adList = [input as HeroAdData];
  }

  const activeAds = adList.filter(ad => ad && ad.isActive && ad.imageUrl);
  const cleanFallbacks = fallbackSlides.filter(s => !s.id.startsWith('admin-ad-') && s.id !== 'admin-image-ad');

  if (activeAds.length > 0) {
    const adminSlides: PromoSlide[] = activeAds.map((ad, idx) => {
      const accentColor =
        ad.badgeType === 'alert'
          ? '#f97316'
          : ad.badgeType === 'ai'
          ? '#6366f1'
          : ad.badgeType === 'study'
          ? '#10b981'
          : '#ec4899';

      const bgGlow =
        ad.badgeType === 'alert'
          ? 'rgba(249, 115, 22, 0.2)'
          : ad.badgeType === 'ai'
          ? 'rgba(99, 102, 241, 0.2)'
          : ad.badgeType === 'study'
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(236, 72, 153, 0.2)';

      return {
        id: ad.id ? `admin-ad-${ad.id}` : `admin-ad-${idx}`,
        badge: ad.badge || 'Sponsored Announcement',
        badgeType: ad.badgeType || 'sponsored',
        title: ad.title || 'Special Announcement',
        description: ad.description || '',
        highlights: ['Official Offer', 'Limited Time', 'Direct Link'],
        ctaText: ad.buttonText || 'Explore Now',
        ctaHref: ad.link || '/papers',
        meta: 'Featured Campaign',
        accentColor,
        bgGlow,
        imageUrl: ad.imageUrl,
        icon: Award,
      };
    });

    return [...adminSlides, ...cleanFallbacks];
  }

  return cleanFallbacks;
}

export default function PromoCarousel({
  slides = DEFAULT_SLIDES,
  userClass,
  initialAd,
  initialAds,
}: PromoCarouselProps) {
  const [allSlides, setAllSlides] = useState<PromoSlide[]>(() =>
    buildSlidesFromAds(initialAds || initialAd, slides)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Sync client-side on mount, tab focus, or cross-tab storage changes
  useEffect(() => {
    let isMounted = true;
    const fetchLatestAd = () => {
      fetch('/api/ads/active', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (isMounted) {
            setAllSlides(buildSlidesFromAds(data, slides));
          }
        })
        .catch(() => {});
    };

    fetchLatestAd();

    window.addEventListener('focus', fetchLatestAd);
    window.addEventListener('storage', fetchLatestAd);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', fetchLatestAd);
      window.removeEventListener('storage', fetchLatestAd);
    };
  }, [slides]);

  const total = allSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play timer (paused on hover / touch)
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4800);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, total]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    setIsPaused(false);
  };

  const current = allSlides[currentIndex] || allSlides[0];

  // Personalize CTA link if user has class selected and target is papers/notes
  let dynamicHref = current.ctaHref;
  if (userClass && (current.ctaHref === '/papers' || current.ctaHref === '/notes')) {
    dynamicHref = `${current.ctaHref}?class=${encodeURIComponent(userClass)}`;
  }

  const badgeClass =
    current.badgeType === 'alert'
      ? styles.badgeAlert
      : current.badgeType === 'ai'
      ? styles.badgeAi
      : current.badgeType === 'study'
      ? styles.badgeStudy
      : styles.badgeSponsored;

  const Icon = current.icon || FileText;

  return (
    <div
      className={styles.carouselContainer}
      role="region"
      aria-roledescription="carousel"
      aria-label="Announcements & Campaigns Carousel"
      suppressHydrationWarning
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Ambient Glow Behind Active Slide */}
      <div
        className={styles.ambientGlow}
        style={{ background: current.bgGlow }}
        aria-hidden="true"
      />

      {/* Top Meta Bar */}
      <div className={styles.topBar}>
        <span className={`${styles.badge} ${badgeClass}`}>
          <span className={styles.liveDot} />
          <span>{current.badge}</span>
        </span>

        <span className={styles.slideCounter} aria-label={`Slide ${currentIndex + 1} of ${total}`}>
          <span>0{currentIndex + 1}</span>
          <span>/</span>
          <span>0{total}</span>
        </span>
      </div>

      {/* Slide Body */}
      <div key={current.id} className={styles.slideBody} aria-live="polite">
        {current.imageUrl ? (
          <>
            <Link href={dynamicHref} className={styles.adImageContainer} aria-label={current.title}>
              <div
                className={styles.adImageBackdrop}
                style={{ backgroundImage: `url(${current.imageUrl})` }}
                aria-hidden="true"
              />
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className={styles.adImage}
                unoptimized
              />
            </Link>
            <h3 className={styles.slideTitleWithImage}>{current.title}</h3>
            {current.description && (
              <p className={styles.slideDescriptionWithImage}>{current.description}</p>
            )}
          </>
        ) : (
          <>
            <div className={styles.textSlideVisual} aria-hidden="true">
              <Icon size={22} strokeWidth={2} style={{ color: current.accentColor }} />
            </div>
            <h3 className={styles.slideTitle}>{current.title}</h3>
            {current.description && (
              <p className={styles.slideDescription}>{current.description}</p>
            )}
            <div className={styles.highlightList} aria-label="Key highlights">
              {current.highlights.map((item) => (
                <span key={item} className={styles.highlightChip}>
                  <span className={styles.chipCheck}>✓</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA & Controls Bar */}
      <div className={styles.bottomRow}>
        {/* The Black Button connected to the ad destination link */}
        <Link href={dynamicHref} className={styles.ctaButton}>
          <span>{current.ctaText}</span>
          <ArrowRight size={15} strokeWidth={2.5} />
        </Link>

        {/* Navigation Dots and Controls */}
        <div className={styles.navControls}>
          <div className={styles.paginationDots} role="tablist" aria-label="Slide Selector">
            {allSlides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(idx)}
                className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                aria-selected={idx === currentIndex}
                role="tab"
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={prevSlide}
              className={styles.arrowButton}
              aria-label="Previous campaign"
              type="button"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={nextSlide}
              className={styles.arrowButton}
              aria-label="Next campaign"
              type="button"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
