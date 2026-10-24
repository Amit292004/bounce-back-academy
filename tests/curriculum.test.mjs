import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClassName } from '../src/lib/classNormalizer.ts';

describe('Curriculum & Class Normalization Suite', () => {
  test('normalizes bare numbers into Class X', () => {
    assert.equal(normalizeClassName('8'), 'Class 8');
    assert.equal(normalizeClassName('10'), 'Class 10');
    assert.equal(normalizeClassName('12'), 'Class 12');
  });

  test('normalizes ordinal suffixes (10th, 12th, 9th)', () => {
    assert.equal(normalizeClassName('Class 10th'), 'Class 10');
    assert.equal(normalizeClassName('12th'), 'Class 12');
    assert.equal(normalizeClassName('9th'), 'Class 9');
  });

  test('normalizes casing and dashes', () => {
    assert.equal(normalizeClassName('class-10'), 'Class 10');
    assert.equal(normalizeClassName('CLASS 11'), 'Class 11');
  });

  test('preserves special competitive exam names intact', () => {
    assert.equal(normalizeClassName('JEE'), 'JEE');
    assert.equal(normalizeClassName('NEET'), 'NEET');
    assert.equal(normalizeClassName('CUET'), 'CUET');
    assert.equal(normalizeClassName('Skills'), 'Skills');
  });

  test('handles invalid or non-string inputs safely', () => {
    assert.equal(normalizeClassName(''), '');
    assert.equal(normalizeClassName(null), null);
    assert.equal(normalizeClassName(undefined), undefined);
  });
});
