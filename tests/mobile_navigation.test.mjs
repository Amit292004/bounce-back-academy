import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('SaaS Mobile Navigation Architecture & Drawer Verification Suite', () => {
  const navbarPath = path.resolve('src/components/layout/Navbar.tsx');
  const navbarCssPath = path.resolve('src/components/layout/Navbar.module.css');
  const bottomNavCssPath = path.resolve('src/components/layout/GlobalBottomNav.module.css');

  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const navbarCss = fs.readFileSync(navbarCssPath, 'utf8');
  const bottomNavCss = fs.readFileSync(bottomNavCssPath, 'utf8');

  test('drawer panel implements 3 distinct architectural regions', () => {
    // Region 1: Header
    assert.ok(navbarContent.includes('styles.drawerHeader'), 'Must contain drawerHeader');
    assert.ok(navbarContent.includes('styles.drawerLogoLink'), 'Header must contain logo link');
    assert.ok(navbarContent.includes('styles.drawerCloseBtn'), 'Header must contain close button');

    // Region 2: Scrollable Body
    assert.ok(navbarContent.includes('styles.drawerBody'), 'Must contain scrollable drawerBody');
    assert.ok(navbarContent.includes('styles.drawerSearchBox'), 'Body must contain universal search trigger');

    // Region 3: Compact Account Footer
    assert.ok(navbarContent.includes('styles.drawerFooter'), 'Must contain drawerFooter');
    assert.ok(navbarContent.includes('styles.drawerAccountCard'), 'Footer must contain account identity card');
    assert.ok(navbarContent.includes('styles.drawerGuestCard'), 'Footer must contain guest card');
  });

  test('LEARNING group organizes core learning routes cleanly', () => {
    assert.ok(navbarContent.includes('LEARNING'), 'Must have LEARNING group label');
    assert.ok(navbarContent.includes('href="/courses"'), 'Must link to /courses');
    assert.ok(navbarContent.includes('href="/school"'), 'Must link to /school');
    assert.ok(navbarContent.includes('href="/exams"'), 'Must link to /exams');
    assert.ok(navbarContent.includes('href="/skills"'), 'Must link to /skills');
    assert.ok(navbarContent.includes('href="/library"'), 'Must link to /library');
  });

  test('RESOURCES are cleanly nested under Study Library', () => {
    assert.ok(navbarContent.includes('href="/notes"'), 'Must link to /notes');
    assert.ok(navbarContent.includes('href="/papers"'), 'Must link to /papers');
    assert.ok(navbarContent.includes('href="/videos"'), 'Must link to /videos');
    assert.ok(navbarContent.includes('drawerSubmenuToggle'), 'Must have toggle for nested resources');
  });

  test('CAMPUS group contains platform tools and community features', () => {
    assert.ok(navbarContent.includes('CAMPUS'), 'Must have CAMPUS group label');
    assert.ok(navbarContent.includes('href="/ai-tutor"'), 'Must link to /ai-tutor');
    assert.ok(navbarContent.includes('href="/announcements"'), 'Must link to /announcements');
    assert.ok(navbarContent.includes('href="/quiz"'), 'Must link to /quiz');
    assert.ok(navbarContent.includes('href="/forum"'), 'Must link to /forum');
    assert.ok(navbarContent.includes('href="/favorites"'), 'Must link to /favorites');
    assert.ok(navbarContent.includes('href="/reviews"'), 'Must link to /reviews');
    assert.ok(navbarContent.includes('href="/premium"'), 'Must link to /premium');
  });

  test('ACCOUNT footer provides separate management and authentication actions', () => {
    assert.ok(navbarContent.includes('href="/dashboard"'), 'Must link to /dashboard');
    assert.ok(navbarContent.includes('href="/profile"'), 'Must link to /profile');
    assert.ok(navbarContent.includes('href="/contact"'), 'Must link to /contact');
    assert.ok(navbarContent.includes('handleLogout'), 'Must include logout handler');
    assert.ok(navbarContent.includes('href="/login"'), 'Must include guest /login');
    assert.ok(navbarContent.includes('href="/register"'), 'Must include guest /register');
  });

  test('redundant decorative badges (SEARCH, NBSE, PREP, SKILLS) are purged from mobile drawer', () => {
    // Check that inside the drawer nav list, redundant badge strings are not rendered
    const drawerBodySection = navbarContent.substring(
      navbarContent.indexOf('className={styles.drawerBody}'),
      navbarContent.indexOf('className={styles.drawerFooter}')
    );
    assert.ok(!drawerBodySection.includes('>NBSE<'), 'Redundant NBSE badge removed');
    assert.ok(!drawerBodySection.includes('>Prep<'), 'Redundant Prep badge removed');
    assert.ok(!drawerBodySection.includes('>Skills<'), 'Redundant Skills badge removed');
    assert.ok(!drawerBodySection.includes('>Search<'), 'Redundant Search badge removed');
  });

  test('mobile drawer backdrop and scroll lock with escape key handling are active', () => {
    assert.ok(navbarContent.includes('drawerBackdrop'), 'Backdrop overlay exists');
    assert.ok(navbarContent.includes("document.body.classList.add('mobile-drawer-open')"), 'Body class applied when open');
    assert.ok(navbarContent.includes("document.body.classList.remove('mobile-drawer-open')"), 'Body class removed on close');
    assert.ok(navbarContent.includes("document.body.style.overflow = 'hidden'"), 'Overflow locked on open');
    assert.ok(navbarContent.includes("e.key === 'Escape'"), 'Escape key handler present');
  });

  test('GlobalBottomNav is hidden when mobile drawer is open to prevent overlapping navigation', () => {
    assert.ok(
      bottomNavCss.includes(':global(body.mobile-drawer-open) .bottomNav'),
      'GlobalBottomNav must hide when mobile-drawer-open class is active'
    );
    assert.ok(
      bottomNavCss.includes('display: none !important'),
      'GlobalBottomNav must have display: none !important'
    );
  });

  test('desktop navigation structure and PC styling are fully preserved', () => {
    assert.ok(navbarContent.includes('className={styles.desktopNav}'), 'desktopNav preserved');
    assert.ok(navbarContent.includes('className={styles.desktopAuth}'), 'desktopAuth preserved');
    assert.ok(navbarContent.includes('className={styles.desktopSearchWrap}'), 'desktopSearchWrap preserved');
    assert.ok(navbarCss.includes('.desktopNav'), 'desktopNav CSS preserved');
    assert.ok(navbarCss.includes('.desktopAuth'), 'desktopAuth CSS preserved');
  });
});
