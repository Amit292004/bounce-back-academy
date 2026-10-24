import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FAQS, FAQ_CATEGORIES } from '../src/data/faqs.ts';

describe('FAQ Knowledge Base & Filter Contract Suite', () => {
  const REQUIRED_CATEGORIES = [
    'getting-started',
    'courses',
    'study-materials',
    'exams',
    'ai-tutor',
    'payments',
    'account-support',
    'quizzes',
  ];

  test('all 8 required logical categories are registered and configured', () => {
    const registeredIds = FAQ_CATEGORIES.map((c) => c.id);
    for (const catId of REQUIRED_CATEGORIES) {
      assert.ok(
        registeredIds.includes(catId),
        `Required FAQ category "${catId}" is missing from FAQ_CATEGORIES`
      );
    }
    assert.strictEqual(FAQ_CATEGORIES.length, 8, 'Expected exactly 8 FAQ categories');
  });

  test('every category has at least 3 relevant questions and no category is empty', () => {
    for (const cat of FAQ_CATEGORIES) {
      const itemsInCat = FAQS.filter((f) => f.category === cat.id);
      assert.ok(
        itemsInCat.length >= 3,
        `Category "${cat.id}" should have at least 3 questions, found ${itemsInCat.length}`
      );
    }
  });

  test('FAQ items have unique IDs, valid questions, and grounded answers', () => {
    const ids = new Set();

    for (const faq of FAQS) {
      assert.ok(faq.id && typeof faq.id === 'string', `Invalid FAQ id: ${faq.id}`);
      assert.ok(!ids.has(faq.id), `Duplicate FAQ id detected: ${faq.id}`);
      ids.add(faq.id);

      assert.ok(
        faq.q && faq.q.trim().endsWith('?'),
        `FAQ question should end with "?": "${faq.q}"`
      );
      assert.ok(
        faq.a && faq.a.length >= 40,
        `FAQ answer is too short or empty for: "${faq.q}"`
      );

      // Verify no placeholder or invented contact info
      const forbidden = ['todo', 'lorem ipsum', 'tbd', 'placeholder', 'example.com'];
      for (const f of forbidden) {
        assert.ok(
          !faq.q.toLowerCase().includes(f) && !faq.a.toLowerCase().includes(f),
          `Forbidden placeholder "${f}" found in FAQ "${faq.id}"`
        );
      }
    }
  });

  test('search matches across question, answer text, and keyword tags', () => {
    const query = 'groq';
    const matches = FAQS.filter((f) => {
      const inQ = f.q.toLowerCase().includes(query);
      const inA = f.a.toLowerCase().includes(query);
      const inK = f.keywords?.some((k) => k.toLowerCase().includes(query));
      return inQ || inA || inK;
    });

    assert.ok(matches.length >= 1, 'Search for "groq" should return at least 1 match');
    assert.ok(
      matches.some((m) => m.category === 'ai-tutor'),
      'Search for "groq" should match AI tutor question'
    );
  });

  test('category filtering properly segments questions', () => {
    const paymentsFaqs = FAQS.filter((f) => f.category === 'payments');
    for (const item of paymentsFaqs) {
      assert.strictEqual(item.category, 'payments');
    }
    assert.ok(paymentsFaqs.length >= 3);
  });

  test('real support contact details are verified across answers', () => {
    const supportFaqs = FAQS.filter(
      (f) => f.category === 'account-support' || f.category === 'payments'
    );
    const mentionsSupport = supportFaqs.some(
      (f) =>
        f.a.includes('bouncebackacademy.edu@gmail.com') &&
        f.a.includes('7628024274')
    );
    assert.ok(
      mentionsSupport,
      'Support FAQs must provide authentic email bouncebackacademy.edu@gmail.com and phone +91 7628024274'
    );
  });

  test('FaqSection component implements two-column category layout and compact support strip', () => {
    const componentPath = path.resolve('src/components/home/FaqSection.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(content.includes('styles.categoryGrid'), 'Must contain categoryGrid class');
    assert.ok(content.includes('styles.categoryCard'), 'Must contain categoryCard class');
    assert.ok(content.includes('styles.supportStrip'), 'Must contain compact supportStrip class');
    assert.ok(content.includes('aria-expanded'), 'Must have aria-expanded for accordion');
    assert.ok(content.includes('aria-controls'), 'Must have aria-controls for accordion');
    assert.ok(content.includes('role="region"'), 'Must have role="region" for answer panel');
    assert.ok(content.includes('href="/contact"'), 'Contact support action must point to /contact');
    assert.ok(content.includes('href="/courses"'), 'Explore courses action must point to /courses');
  });

  test('FaqSection.module.css enforces 2-column grid and responsive single-column layout', () => {
    const cssPath = path.resolve('src/components/home/FaqSection.module.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(
      css.includes('grid-template-columns: repeat(2, 1fr)'),
      'Desktop layout must define a 2-column category grid'
    );
    assert.ok(
      css.includes('grid-template-columns: 1fr'),
      'Mobile/tablet media query must collapse grid to single-column'
    );
    assert.ok(
      css.includes('prefers-reduced-motion'),
      'Must support reduced motion preference'
    );
  });
});
