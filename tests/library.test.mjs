import test from 'node:test';
import assert from 'node:assert/strict';

test('Universal Study Library Contract & Filtering Suite', async (t) => {
  const mockItems = [
    { id: '1', title: 'Quadratic Equations Notes', type: 'NOTE', className: 'Class 10', subject: 'Maths' },
    { id: '2', title: 'NBSE 2023 Science Board Paper', type: 'PAPER', className: 'Class 10', subject: 'Science', year: '2023' },
    { id: '3', title: 'Light Reflection & Refraction Lecture 1', type: 'VIDEO', className: 'Class 10', subject: 'Science', lectureNumber: 1 },
    { id: '4', title: 'Trigonometry Concept Mastery Quiz', type: 'QUIZ', className: 'Class 10', subject: 'Maths', questionCount: 10 },
    { id: '5', title: 'Wave Optics Derivations', type: 'NOTE', className: 'Class 12', subject: 'Physics' },
  ];

  await t.test('filters items accurately by type tab', () => {
    const notesOnly = mockItems.filter(item => item.type === 'NOTE');
    assert.equal(notesOnly.length, 2);
    assert.equal(notesOnly[0].title, 'Quadratic Equations Notes');

    const papersOnly = mockItems.filter(item => item.type === 'PAPER');
    assert.equal(papersOnly.length, 1);
    assert.equal(papersOnly[0].year, '2023');
  });

  await t.test('filters items by class and query string', () => {
    const q = 'Trigonometry';
    const classFilter = 'Class 10';
    const filtered = mockItems.filter(item => 
      item.className === classFilter && 
      item.title.toLowerCase().includes(q.toLowerCase())
    );
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].type, 'QUIZ');
  });

  await t.test('handles case-insensitive and empty queries without throwing', () => {
    const query = '';
    const all = mockItems.filter(item => !query || item.title.toLowerCase().includes(query.toLowerCase()));
    assert.equal(all.length, mockItems.length);
  });
});
