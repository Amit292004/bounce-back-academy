import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test the core pure logic of download, view, and filename sanitization
function getDownloadLink(url) {
  if (!url) return "";
  try {
    if (url.includes("cloudinary.com")) return url;
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    }
    if (url.includes("docs.google.com")) {
      const docIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (docIdMatch && docIdMatch[1]) {
        const docId = docIdMatch[1];
        if (url.includes("/document/")) return `https://docs.google.com/document/d/${docId}/export?format=pdf`;
        if (url.includes("/spreadsheets/")) return `https://docs.google.com/spreadsheets/d/${docId}/export?format=pdf`;
        if (url.includes("/presentation/")) return `https://docs.google.com/presentation/d/${docId}/export?format=pdf`;
      }
    }
  } catch (e) {
    return url;
  }
  return url;
}

function sanitizeFileName(name, fallback = 'document.pdf') {
  if (!name) return fallback;
  let clean = name
    .replace(/[:\\/|]/g, ' - ')
    .replace(/[*?"<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  if (!clean) clean = 'document';
  if (!clean.toLowerCase().endsWith('.pdf') && !/\.(jpe?g|png|webp)$/i.test(clean)) {
    clean += '.pdf';
  }
  return clean;
}

function getViewLink(url) {
  if (!url) return "";
  const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('/raw/upload/') || url.includes('drive.google.com');
  if (isPDF) {
    return `/view?url=${encodeURIComponent(url)}`;
  }
  return url;
}

describe('Resource Utilities & Link Engine Suite', () => {
  describe('getDownloadLink', () => {
    test('handles empty or null URL safely', () => {
      assert.equal(getDownloadLink(''), '');
      assert.equal(getDownloadLink(null), '');
    });

    test('preserves Cloudinary links directly', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
      assert.equal(getDownloadLink(url), url);
    });

    test('transforms Google Drive file share URL to direct download URL', () => {
      const url = 'https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing';
      assert.equal(
        getDownloadLink(url),
        'https://drive.google.com/uc?export=download&id=1a2b3c4d5e'
      );
    });

    test('transforms Google Docs URL to export PDF URL', () => {
      const url = 'https://docs.google.com/document/d/9x8y7z/edit';
      assert.equal(
        getDownloadLink(url),
        'https://docs.google.com/document/d/9x8y7z/export?format=pdf'
      );
    });
  });

  describe('sanitizeFileName', () => {
    test('removes illegal Windows filesystem characters', () => {
      const dirty = 'Maths: Chapter 1/2*Intro?"test"|<file>.pdf';
      const clean = sanitizeFileName(dirty);
      assert.equal(clean.includes(':'), false);
      assert.equal(clean.includes('*'), false);
      assert.equal(clean.includes('?'), false);
      assert.equal(clean.includes('"'), false);
      assert.equal(clean.includes('<'), false);
      assert.equal(clean.includes('>'), false);
      assert.equal(clean.includes('|'), false);
    });

    test('ensures .pdf extension is appended when missing', () => {
      const name = 'Class 10 Science Notes';
      const clean = sanitizeFileName(name);
      assert.equal(clean.endsWith('.pdf'), true);
    });

    test('falls back gracefully when input is empty or invalid', () => {
      assert.equal(sanitizeFileName(''), 'document.pdf');
      assert.equal(sanitizeFileName(null), 'document.pdf');
    });
  });

  describe('getViewLink', () => {
    test('routes PDF URLs to internal /view viewer', () => {
      const url = 'https://example.com/notes.pdf';
      assert.equal(getViewLink(url), `/view?url=${encodeURIComponent(url)}`);
    });

    test('routes Google Drive URLs to internal /view viewer', () => {
      const url = 'https://drive.google.com/file/d/123/view';
      assert.equal(getViewLink(url), `/view?url=${encodeURIComponent(url)}`);
    });

    test('returns empty string for empty input', () => {
      assert.equal(getViewLink(''), '');
    });
  });
});
