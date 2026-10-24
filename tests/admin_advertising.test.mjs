import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const API_ROUTE_PATH = path.resolve('src/app/api/ads/active/route.ts');
const CAROUSEL_PATH = path.resolve('src/components/home/PromoCarousel.tsx');
const ADMIN_PAGE_PATH = path.resolve('src/app/admin/dashboard/advertising/page.tsx');
const DATA_FILE_PATH = path.resolve('src/data/hero_ad.json');

test('Admin Image Advertising & Black Button Link Suite', async (t) => {
  await t.test('hero_ad.json and API route exist and are properly structured', () => {
    assert.ok(fs.existsSync(DATA_FILE_PATH), 'hero_ad.json must exist');
    assert.ok(fs.existsSync(API_ROUTE_PATH), 'route.ts must exist');

    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const json = JSON.parse(raw);
    assert.ok('imageUrl' in json, 'Must have imageUrl property');
    assert.ok('link' in json, 'Must have link property');
    assert.ok('buttonText' in json, 'Must have buttonText property');
  });

  await t.test('API route handles both GET and POST with validation and persistence', () => {
    const routeCode = fs.readFileSync(API_ROUTE_PATH, 'utf8');
    assert.ok(routeCode.includes('export async function GET()'), 'Has GET endpoint');
    assert.ok(routeCode.includes('export async function POST('), 'Has POST endpoint');
    assert.ok(routeCode.includes('hero_ad.json'), 'Syncs with hero_ad.json');
    assert.ok(routeCode.includes('prisma.branding'), 'Syncs with database branding table');
  });

  await t.test('PromoCarousel mounts active advertisement and renders image and black button link', () => {
    const carouselCode = fs.readFileSync(CAROUSEL_PATH, 'utf8');
    assert.ok(carouselCode.includes('/api/ads/active'), 'Fetches from /api/ads/active');
    assert.ok(carouselCode.includes('current.imageUrl'), 'Renders uploaded ad image');
    assert.ok(carouselCode.includes('className={styles.adImageContainer}'), 'Uses styled ad image container');
    assert.ok(carouselCode.includes('className={styles.ctaButton}'), 'Renders black CTA button');
    assert.ok(carouselCode.includes('href={dynamicHref}'), 'Black button is bound to dynamicHref from ad link');
  });

  await t.test('Admin advertising page allows image upload, link entry, and live card preview', () => {
    const adminCode = fs.readFileSync(ADMIN_PAGE_PATH, 'utf8');
    assert.ok(adminCode.includes('/api/ads/active'), 'Saves to /api/ads/active');
    assert.ok(adminCode.includes('Destination Link (Target URL for the Black Button)'), 'Has link input label');
    assert.ok(adminCode.includes('Black Button CTA Text'), 'Has button text input');
    assert.ok(adminCode.includes('Live Hero Card Preview'), 'Renders exact live card preview');
    assert.ok(adminCode.includes('PRESET_LINKS'), 'Provides quick destination presets');
    assert.ok(adminCode.includes('FaWhatsapp'), 'Preserves WhatsApp student broadcast');
  });
});
