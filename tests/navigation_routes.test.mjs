import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation Pathways & Section Coverage Suite', () => {
  const routesDir = path.resolve('src/app');

  test('all 4 core pathways have dedicated app router directories and page files', () => {
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
  });

  test('redirect alias routes exist and prevent 404 on direct access', () => {
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

  test('LearningPathsSection points every card to its dedicated section', () => {
    const componentPath = path.resolve('src/components/home/LearningPathsSection.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(content.includes("href: '/school'"), 'School learning card should link to /school');
    assert.ok(content.includes("href: '/exams'"), 'Exam prep card should link to /exams');
    assert.ok(
      content.includes("href: '/ai-tutor'") || content.includes("href: '/ask'"),
      'AI tutor card should link to /ai-tutor or /ask'
    );
    assert.ok(content.includes("href: '/skills'"), 'Practical skills card should link to /skills');
    assert.ok(!content.includes("href: '/#classes'"), 'Card should not link to /#classes placeholder');
  });

  test('Courses page areas point to their dedicated section destinations', () => {
    const coursesPagePath = path.resolve('src/app/courses/page.tsx');
    const content = fs.readFileSync(coursesPagePath, 'utf8');

    assert.ok(content.includes('href="/school"'), 'School learning area should link to /school');
    assert.ok(content.includes('href="/exams"'), 'Exam prep area should link to /exams');
    assert.ok(content.includes('href="/skills"'), 'Skill development area should link to /skills');
    assert.ok(
      content.includes('href="/ai-tutor"') || content.includes('href="/ask"'),
      'AI tutor area should link to /ai-tutor or /ask'
    );
  });

  test('Navbar resources menu includes direct links to school, exams, and skills', () => {
    const navbarPath = path.resolve('src/components/layout/Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(content.includes("href: '/school'"), 'Navbar should include /school');
    assert.ok(content.includes("href: '/exams'"), 'Navbar should include /exams');
    assert.ok(content.includes("href: '/skills'"), 'Navbar should include /skills');
  });

  test('Footer includes direct navigation to all 4 pathways', () => {
    const footerPath = path.resolve('src/components/layout/Footer.tsx');
    const content = fs.readFileSync(footerPath, 'utf8');

    assert.ok(content.includes('href="/school"'), 'Footer should include /school');
    assert.ok(content.includes('href="/exams"'), 'Footer should include /exams');
    assert.ok(content.includes('href="/skills"'), 'Footer should include /skills');
    assert.ok(content.includes('href="/ai-tutor"'), 'Footer should include /ai-tutor');
  });
});
