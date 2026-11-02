import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation Pathways & Section Coverage Suite', () => {
  const routesDir = path.resolve('src/app');

  test('core learning routes and aliases exist and redirect safely', () => {
    const requiredPages = [
      'school/page.tsx',
      'exams/page.tsx',
      'skills/page.tsx',
      'ai-tutor/page.tsx',
      'ask/page.tsx',
      'courses/page.tsx',
    ];

    for (const pageRelPath of requiredPages) {
      const fullPath = path.join(routesDir, pageRelPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Required route page missing: src/app/${pageRelPath}`
      );
    }

    const redirectPages = [
      'class/page.tsx',
      'school-learning/page.tsx',
      'competitive-exams/page.tsx',
      'practical-skills/page.tsx',
    ];

    for (const pageRelPath of redirectPages) {
      const fullPath = path.join(routesDir, pageRelPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Redirect alias route missing: src/app/${pageRelPath}`
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('redirect('),
        `Alias route src/app/${pageRelPath} should call redirect()`
      );
    }
  });

  test('Courses page points to class hubs', () => {
    const coursesPagePath = path.resolve('src/app/courses/page.tsx');
    const content = fs.readFileSync(coursesPagePath, 'utf8');

    assert.ok(content.includes('/class/'), 'Courses page should link to class hubs');
  });

  test('Navbar resources menu includes core academic resources and excludes removed pathway cards', () => {
    const navbarPath = path.resolve('src/components/layout/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(content.includes("href: '/papers'"), 'Navbar should include /papers');
    assert.ok(content.includes("href: '/notes'"), 'Navbar should include /notes');
    assert.ok(content.includes("href: '/videos'"), 'Navbar should include /videos');
    assert.ok(content.includes("href: '/library'"), 'Navbar should include /library');

    // Excluded sections from resources
    assert.ok(!content.includes("label: 'School Learning (8–12)'"), 'Navbar must not include School Learning in resources');
    assert.ok(!content.includes("label: 'Competitive Exams'"), 'Navbar must not include Competitive Exams in resources');
    assert.ok(!content.includes("label: 'Practical Skill Courses'"), 'Navbar must not include Practical Skill Courses in resources');
  });

  test('Footer includes direct navigation to study resources and platform links', () => {
    const footerPath = path.resolve('src/components/layout/Footer.tsx');
    const content = fs.readFileSync(footerPath, 'utf8');

    assert.ok(content.includes('href="/papers"'), 'Footer should include /papers');
    assert.ok(content.includes('href="/notes"'), 'Footer should include /notes');
    assert.ok(content.includes('href="/videos"'), 'Footer should include /videos');
    assert.ok(content.includes('href="/ai-tutor"'), 'Footer should include /ai-tutor');
    assert.ok(content.includes('href="/library"'), 'Footer should include /library');

    // Excluded from footer
    assert.ok(!content.includes('School Learning (8–12)'), 'Footer must not include School Learning');
    assert.ok(!content.includes('Competitive Exams'), 'Footer must not include Competitive Exams');
    assert.ok(!content.includes('Practical Skill Courses'), 'Footer must not include Practical Skill Courses');
  });
});
