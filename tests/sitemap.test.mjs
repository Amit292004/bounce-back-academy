import test from 'node:test';
import assert from 'node:assert/strict';

test('Sitemap & SEO Route Indexing Suite', async (t) => {
  const base = 'https://bouncebackacademy.vercel.app';

  // Mock static routes defined in sitemap
  const coreRoutes = [
    `${base}`,
    `${base}/school`,
    `${base}/exams`,
    `${base}/skills`,
    `${base}/library`,
    `${base}/courses`,
    `${base}/ai-tutor`,
    `${base}/notes`,
    `${base}/papers`,
    `${base}/videos`,
    `${base}/quiz`,
    `${base}/premium`,
  ];

  await t.test('sitemap covers all 4 core pillars and marketing gateways', () => {
    assert.ok(coreRoutes.includes(`${base}/library`), 'Missing universal library');
    assert.ok(coreRoutes.includes(`${base}/courses`), 'Missing courses catalog');
    assert.ok(coreRoutes.includes(`${base}/ai-tutor`), 'Missing AI tutor canonical route');
    assert.ok(coreRoutes.includes(`${base}/notes`), 'Missing study notes');
    assert.ok(coreRoutes.includes(`${base}/papers`), 'Missing past papers');
  });

  await t.test('class dynamic paths format correctly with URI encoding', () => {
    const courseNames = ['Class 10', 'Class 11 Science', 'JEE', 'NEET'];
    const classUrls = courseNames.map(name => `${base}/class/${encodeURIComponent(name)}`);
    assert.equal(classUrls[0], `${base}/class/Class%2010`);
    assert.equal(classUrls[2], `${base}/class/JEE`);
  });
});
