import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const HERO_TSX_PATH = path.resolve('src/components/home/HeroSection.tsx');
const HERO_CSS_PATH = path.resolve('src/components/home/HeroSection.module.css');
const PAGE_TSX_PATH = path.resolve('src/app/page.tsx');

test('Hero Redesign: Scope & Integrity Checks', async (t) => {
  await t.test('HeroSection.tsx and HeroSection.module.css exist and are non-empty', () => {
    assert.ok(fs.existsSync(HERO_TSX_PATH), 'HeroSection.tsx must exist');
    assert.ok(fs.existsSync(HERO_CSS_PATH), 'HeroSection.module.css must exist');
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    const css = fs.readFileSync(HERO_CSS_PATH, 'utf8');
    assert.ok(tsx.length > 500, 'HeroSection.tsx has substantive content');
    assert.ok(css.length > 500, 'HeroSection.module.css has substantive content');
  });

  await t.test('Existing headline and subheadline text are strictly preserved', () => {
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    assert.ok(
      tsx.includes('The smartest way to prepare for'),
      'Must contain exact lead headline text'
    );
    assert.ok(
      tsx.includes('<AnimatedTitle onIndexChange={setActiveTopicIndex} />'),
      'Must preserve AnimatedTitle with rotating topic subjects'
    );
    assert.ok(
      tsx.includes('Free question papers, study notes, video lectures, real-world skills, and AI-powered doubt solving for Classes 8–12, CUET, JEE &amp; NEET.'),
      'Must preserve exact supporting description copy'
    );
  });

  await t.test('All three CTA buttons and their exact destinations are preserved', () => {
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    // Primary CTA
    assert.ok(
      tsx.includes("userClass ? `/class/${encodeURIComponent(userClass)}` : '/school'"),
      'Primary CTA routes to /class/[id] or /school'
    );
    assert.ok(
      tsx.includes("classDisplayName ? `${classDisplayName} Dashboard` : 'School Learning Hub'"),
      'Primary CTA text preserved'
    );
    // Secondary CTA 1
    assert.ok(
      tsx.includes("userClass ? `/papers?class=${encodeURIComponent(userClass)}` : '/papers'"),
      'Secondary CTA 1 routes to /papers'
    );
    assert.ok(
      tsx.includes('Explore Papers'),
      'Secondary CTA 1 text preserved'
    );
    // Secondary CTA 2
    assert.ok(
      tsx.includes('href="/ai-tutor"'),
      'Secondary CTA 2 routes to /ai-tutor'
    );
    assert.ok(
      tsx.includes('AI Tutor'),
      'Secondary CTA 2 label preserved'
    );
    assert.ok(
      tsx.includes('FREE'),
      'FREE badge preserved'
    );
  });

  await t.test('Student activity indicator is preserved with live data binding', () => {
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    assert.ok(
      tsx.includes('stats.activeNow'),
      'Must bind to stats.activeNow'
    );
    assert.ok(
      tsx.includes('studying right now'),
      'Must display studying right now text'
    );
  });

  await t.test('All 4 numerical analytics metrics are preserved and bound to live stats', () => {
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    assert.ok(tsx.includes("label: 'Students enrolled', value: stats.users"), 'Preserves Students enrolled');
    assert.ok(tsx.includes("label: 'Past papers', value: stats.papers"), 'Preserves Past papers');
    assert.ok(tsx.includes("label: 'Study notes', value: stats.notes"), 'Preserves Study notes');
    assert.ok(tsx.includes("label: 'Video lectures', value: stats.videos"), 'Preserves Video lectures');
    assert.ok(tsx.includes('<AnimatedNumber'), 'Preserves AnimatedNumber counter component');
  });

  await t.test('Right column renders Advertisement & Promo Carousel with all campaign types', () => {
    const tsx = fs.readFileSync(HERO_TSX_PATH, 'utf8');
    assert.ok(tsx.includes('<PromoCarousel'), 'Renders PromoCarousel in right column');
    assert.ok(tsx.includes('userClass={userClass}'), 'Passes userClass to PromoCarousel');

    const promoPath = path.resolve('src/components/home/PromoCarousel.tsx');
    assert.ok(fs.existsSync(promoPath), 'PromoCarousel.tsx exists');
    const promoTsx = fs.readFileSync(promoPath, 'utf8');

    // 4 Key Campaign Slides
    assert.ok(promoTsx.includes('NBSE 2026 Exam Alert'), 'Includes Exam Alert campaign');
    assert.ok(promoTsx.includes('24/7 AI Doubt Solver'), 'Includes AI Doubt Solver campaign');
    assert.ok(promoTsx.includes('Study Material Pack'), 'Includes Study Material Pack campaign');
    assert.ok(promoTsx.includes('Sponsored Campaign'), 'Includes Sponsored Campaign');

    // Interactive Controls
    assert.ok(promoTsx.includes('paginationDots'), 'Has pagination dots');
    assert.ok(promoTsx.includes('arrowButton'), 'Has next/prev navigation buttons');
    assert.ok(promoTsx.includes('handleTouchStart'), 'Has touch swipe handlers');
    assert.ok(promoTsx.includes('setInterval'), 'Has auto-play timer');
  });

  await t.test('CSS composition delivers asymmetric SaaS layout on desktop and responsive stacking on mobile', () => {
    const css = fs.readFileSync(HERO_CSS_PATH, 'utf8');
    // Container max width
    assert.ok(css.includes('max-width: 1200px'), 'Hero container aligns with standard 1200px grid');
    // Asymmetric 2-column grid
    assert.ok(css.includes('grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)'), 'Desktop grid has asymmetric 2 columns');
    // Center-aligned hero proposition
    assert.ok(css.includes('text-align: center'), 'Headline is center-aligned');
    assert.ok(css.includes('align-items: center'), 'Left column is center-aligned');
    // Promo Carousel styles
    const promoCssPath = path.resolve('src/components/home/PromoCarousel.module.css');
    assert.ok(fs.existsSync(promoCssPath), 'PromoCarousel.module.css exists');
    const promoCss = fs.readFileSync(promoCssPath, 'utf8');
    assert.ok(promoCss.includes('.carouselContainer'), 'Carousel container class exists');
    assert.ok(promoCss.includes('height: 435px'), 'Carousel has fixed locked height on desktop');
    assert.ok(promoCss.includes('max-height: 435px'), 'Carousel has locked max-height to eliminate size jumping');
    assert.ok(promoCss.includes('.adImageContainer'), 'Has dedicated ad image container');
    assert.ok(promoCss.includes('object-fit: contain'), 'Image uses contain so it fits properly without clipping');
    assert.ok(promoCss.includes('.adImageBackdrop'), 'Has ambient blurred backdrop for letterbox harmonization');
    assert.ok(promoCss.includes('.textSlideVisual'), 'Has dedicated text slide visual container');
    assert.ok(promoCss.includes('.slideTitleWithImage'), 'Has dedicated title style for image slides');
    assert.ok(promoCss.includes('.bottomRow'), 'Has fixed bottom row positioning');
    assert.ok(promoCss.includes('.badge'), 'Badge class exists');
    assert.ok(promoCss.includes('.paginationDots'), 'Pagination dots class exists');
    // KPI Strip styles
    assert.ok(css.includes('.statsBar'), 'statsBar class exists');
    assert.ok(css.includes('grid-template-columns: repeat(4, 1fr)'), 'Desktop KPI strip has 4 columns');
    // Responsive breakpoints
    assert.ok(css.includes('@media (max-width: 1024px)'), 'Includes tablet responsive rules');
    assert.ok(css.includes('@media (max-width: 768px)'), 'Includes mobile responsive rules');
    assert.ok(css.includes('grid-template-columns: 1fr 1fr'), 'Mobile KPI strip has clean 2x2 column layout');
  });

  await t.test('Top banner and sections below hero remain intact in page.tsx', () => {
    const page = fs.readFileSync(PAGE_TSX_PATH, 'utf8');
    assert.ok(page.includes('{bannerMessage && ('), 'Top banner message preserved');
    assert.ok(page.includes('<HeroSection userClass={userClass}'), 'HeroSection is rendered with userClass prop');
    assert.ok(page.includes('<LearningPathsSection />'), 'LearningPathsSection preserved below hero');
    assert.ok(page.includes('<FeaturesGrid />'), 'FeaturesGrid preserved');
    assert.ok(page.includes('<TestimonialsSection />'), 'TestimonialsSection preserved');
    assert.ok(page.includes('<FaqSection />'), 'FaqSection preserved');
  });
});
