"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  contextualBadge?: string;
  title?: string;
  subtitle?: string;
  formTitle?: string;
  formSubtitle?: string;
  editorialHeadline?: string;
  editorialSubheadline?: string;
  breadcrumbLabel?: string;
  maxWidth?: 'sm' | 'md' | 'wide' | 'default';
  children: React.ReactNode;
}

export default function AuthLayout({
  contextualBadge = 'STUDENT ACCOUNT',
  title,
  subtitle,
  formTitle,
  formSubtitle,
  editorialHeadline,
  editorialSubheadline,
  breadcrumbLabel,
  maxWidth = 'default',
  children,
}: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  const effectiveFormTitle = formTitle || title || 'Welcome back.';
  const effectiveFormSubtitle = formSubtitle !== undefined ? formSubtitle : subtitle;
  const effectiveHeadline = editorialHeadline || 'Your next chapter starts here.';
  const effectiveSubheadline =
    editorialSubheadline ||
    'Access study resources, prepare for competitive exams, and develop practical skills with Bounce Back Academy.';
  const effectiveBreadcrumb = breadcrumbLabel || effectiveFormTitle;

  const isWide = maxWidth === 'md' || maxWidth === 'wide';

  return (
    <div className={styles.splitShell}>
      {/* =========================================================
          LEFT PANEL: EDITORIAL BRAND CANVAS (40% VIEWPORT)
          Pure Black (#000000), Disciplined Typography, Zero Noise
          ========================================================= */}
      <aside className={styles.brandPanel} aria-label="Brand Overview">
        <div className={styles.brandPanelInner}>
          {/* Top Brand Identity & Homepage Link */}
          <div className={styles.brandHeader}>
            <Link href="/" className={styles.brandLogoRow} title="Bounce Back Academy">
              <div className={styles.logoBadge}>
                <Image
                  src="/logo.png"
                  alt="Bounce Back Academy"
                  width={28}
                  height={28}
                  className={styles.logoImg}
                  priority
                />
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>Bounce Back Academy</span>
                <span className={styles.brandSubtitle}>Academic Resource Platform</span>
              </div>
            </Link>

            <Link href="/" className={styles.brandBackHome} title="Return to Bounce Back Academy Homepage">
              <ArrowLeft size={13} />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Center Editorial Focus Block */}
          <div className={styles.editorialBlock}>
            <div className={styles.editorialTag}>
              <span className={styles.editorialTagDot} />
              <span>Learning Platform</span>
            </div>
            <h2 className={styles.editorialHeadline}>{effectiveHeadline}</h2>
            <div className={styles.editorialRule} />
            <p className={styles.editorialSub}>{effectiveSubheadline}</p>
          </div>

          {/* Minimal Brand Footer */}
          <div className={styles.brandFooter}>
            <span>Bounce Back Academy</span>
            <span className={styles.bullet}>·</span>
            <span>Knowledge &amp; Skills</span>
            <span className={styles.bullet}>·</span>
            <span>© {currentYear}</span>
          </div>
        </div>
      </aside>

      {/* =========================================================
          RIGHT PANEL: AUTHENTICATION CANVAS (60% VIEWPORT)
          Deliberate Tonal Separation, Dedicated Form Surface
          ========================================================= */}
      <main className={styles.formPanel}>
        {/* Desktop Top Utility Bar */}
        <header className={styles.desktopTopNav}>
          <nav className={styles.desktopBreadcrumb} aria-label="Breadcrumb">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Bounce Back Academy
            </Link>
            <span className={styles.slash} aria-hidden="true">/</span>
            <span className={styles.currentSection}>{effectiveBreadcrumb}</span>
          </nav>

          <ThemeToggle variant="monochrome" />
        </header>

        {/* Compact Mobile Brand Header (< 960px) */}
        <header className={styles.mobileHeader}>
          <Link href="/" className={styles.mobileLogoRow} title="Bounce Back Academy">
            <div className={styles.logoBadge}>
              <Image
                src="/logo.png"
                alt="Bounce Back Academy"
                width={24}
                height={24}
                className={styles.logoImg}
                priority
              />
            </div>
            <span className={styles.mobileBrandName}>Bounce Back Academy</span>
          </Link>

          <div className={styles.mobileActions}>
            <ThemeToggle variant="monochrome" />
            <Link href="/" className={styles.mobileBackLink} title="Back to home" aria-label="Back to home">
              <ArrowLeft size={14} />
              <span>Home</span>
            </Link>
          </div>
        </header>

        {/* Form Canvas Area with Tonal Separation */}
        <div className={styles.formCanvas}>
          <div className={`${styles.formSurface} ${isWide ? styles.formSurfaceWide : ''}`}>
            {/* Form Top Brand Header Anchor */}
            <div className={styles.cardBrandHeader}>
              <Link href="/" className={styles.cardLogoRow} title="Bounce Back Academy">
                <div className={styles.cardLogoBadge}>
                  <Image
                    src="/logo.png"
                    alt="Bounce Back Academy"
                    width={22}
                    height={22}
                    className={styles.cardLogoImg}
                    priority
                  />
                </div>
                <div className={styles.cardBrandMeta}>
                  <span className={styles.cardBrandName}>Bounce Back Academy</span>
                  <span className={styles.cardBrandPlatform}>Academic Platform</span>
                </div>
              </Link>

              {contextualBadge && (
                <div className={styles.contextualBadge}>
                  <span className={styles.contextualDot} />
                  <span>{contextualBadge}</span>
                </div>
              )}
            </div>

            {/* Form Title & Contextual Hierarchy */}
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>{effectiveFormTitle}</h1>
              {effectiveFormSubtitle && (
                <p className={styles.formSubtitle}>{effectiveFormSubtitle}</p>
              )}
            </div>

            {/* Direct Form Slot */}
            {children}
          </div>

          {/* Restrained Legal Footer */}
          <footer className={styles.canvasFooter}>
            <div className={styles.footerLinks}>
              <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
              <span className={styles.footerDot}>·</span>
              <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              <span className={styles.footerDot}>·</span>
              <Link href="/contact" className={styles.footerLink}>Contact Support</Link>
            </div>
            <p className={styles.footerCopy}>
              © {currentYear} Bounce Back Academy. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
