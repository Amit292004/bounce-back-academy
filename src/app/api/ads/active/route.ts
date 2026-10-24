import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdConfig {
  id?: string;
  imageUrl: string;
  link: string;
  title: string;
  description: string;
  buttonText: string;
  badge: string;
  badgeType: 'alert' | 'ai' | 'study' | 'sponsored';
  isActive: boolean;
  order?: number;
  updatedAt?: string;
}

const DEFAULT_AD: AdConfig = {
  id: 'ad-default',
  imageUrl: '',
  link: '/papers',
  title: 'NBSE 2026 Solved Question Papers',
  description: 'Class 10 & 12 board examination papers with official scoring rubrics, blueprints, and step-by-step solutions.',
  buttonText: 'Explore Past Papers',
  badge: 'Featured Campaign',
  badgeType: 'alert',
  isActive: true,
};

function sanitizeAd(item: any, index: number = 0): AdConfig {
  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `ad-${Date.now()}-${index}`,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '',
    link: typeof item.link === 'string' && item.link.trim() ? item.link.trim() : '/papers',
    title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Special Announcement',
    description: typeof item.description === 'string' ? item.description.trim() : '',
    buttonText: typeof item.buttonText === 'string' && item.buttonText.trim() ? item.buttonText.trim() : 'Explore Offer',
    badge: typeof item.badge === 'string' && item.badge.trim() ? item.badge.trim() : 'Featured Campaign',
    badgeType: ['alert', 'ai', 'study', 'sponsored'].includes(item.badgeType) ? item.badgeType : 'sponsored',
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    order: typeof item.order === 'number' ? item.order : index,
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

function getLocalAds(): AdConfig[] {
  try {
    const multiPath = path.join(process.cwd(), 'src/data/hero_ads.json');
    if (fs.existsSync(multiPath)) {
      const data = JSON.parse(fs.readFileSync(multiPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d, i) => sanitizeAd(d, i));
      }
    }

    const singlePath = path.join(process.cwd(), 'src/data/hero_ad.json');
    if (fs.existsSync(singlePath)) {
      const data = JSON.parse(fs.readFileSync(singlePath, 'utf8'));
      if (Array.isArray(data.ads) && data.ads.length > 0) {
        return data.ads.map((d: any, i: number) => sanitizeAd(d, i));
      }
      if (data && typeof data === 'object') {
        return [sanitizeAd(data, 0)];
      }
    }
  } catch (err) {
    logger.error('Error reading local hero_ads.json:', err);
  }
  return [DEFAULT_AD];
}

function saveLocalAds(ads: AdConfig[]) {
  try {
    const dir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Save array of ads to hero_ads.json
    const multiPath = path.join(dir, 'hero_ads.json');
    fs.writeFileSync(multiPath, JSON.stringify(ads, null, 2), 'utf8');

    // 2. Keep hero_ad.json synchronized for single-ad compatibility
    const singlePath = path.join(dir, 'hero_ad.json');
    const primary = ads.find(a => a.isActive) || ads[0] || DEFAULT_AD;
    fs.writeFileSync(singlePath, JSON.stringify({ ...primary, ads }, null, 2), 'utf8');
  } catch (err) {
    logger.error('Error writing local ads:', err);
  }
}

export async function GET() {
  try {
    const ads = getLocalAds();

    // Check database if available
    try {
      if (prisma && prisma.branding) {
        const branding = await prisma.branding.findFirst();
        if (branding && branding.adMessage && branding.adMessage.startsWith('[')) {
          try {
            const dbAds = JSON.parse(branding.adMessage);
            if (Array.isArray(dbAds) && dbAds.length > 0) {
              return NextResponse.json({
                ...(dbAds.find((a: any) => a.isActive) || dbAds[0]),
                ads: dbAds,
              }, {
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              });
            }
          } catch {}
        }
      }
    } catch {}

    const primaryAd = ads.find(a => a.isActive) || ads[0] || DEFAULT_AD;

    return NextResponse.json({
      ...primaryAd,
      ads: ads,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('Failed to get active ad:', error);
    return NextResponse.json({ ...DEFAULT_AD, ads: [DEFAULT_AD] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let ads = getLocalAds();

    if (Array.isArray(body)) {
      // Replaced entire list
      ads = body.map((item, idx) => sanitizeAd(item, idx));
    } else if (Array.isArray(body.ads)) {
      // Replaced entire list via { ads: [...] }
      ads = body.ads.map((item: any, idx: number) => sanitizeAd(item, idx));
    } else {
      // Single ad update or creation
      const clean = sanitizeAd(body, ads.length);
      const existingIdx = ads.findIndex(a => a.id === clean.id);
      if (existingIdx >= 0) {
        ads[existingIdx] = clean;
      } else {
        ads = [clean, ...ads];
      }
    }

    // Save to local JSON files (hero_ads.json and hero_ad.json)
    saveLocalAds(ads);

    // Revalidate homepage SSR cache immediately
    try {
      revalidatePath('/');
    } catch (revErr) {
      logger.error('Failed to revalidate / route:', revErr);
    }

    // Persist to PostgreSQL branding table
    try {
      if (prisma && prisma.branding) {
        const existing = await prisma.branding.findFirst();
        const primary = ads.find(a => a.isActive) || ads[0] || DEFAULT_AD;
        const payload = {
          adImageUrl: primary.imageUrl || null,
          adMessage: JSON.stringify(ads),
        };

        if (existing) {
          await prisma.branding.update({
            where: { id: existing.id },
            data: payload,
          });
        } else {
          await prisma.branding.create({
            data: payload,
          });
        }
      }
    } catch (dbErr) {
      logger.error('Failed to sync ads to prisma.branding:', dbErr);
    }

    const primaryAd = ads.find(a => a.isActive) || ads[0] || DEFAULT_AD;
    return NextResponse.json({ success: true, ads, ad: primaryAd }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Error saving active ads:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
