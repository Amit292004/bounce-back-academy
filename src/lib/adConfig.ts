import fs from 'fs';
import path from 'path';

export interface HeroAdData {
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

export function getAllHeroAds(): HeroAdData[] {
  try {
    const multiPath = path.join(process.cwd(), 'src/data/hero_ads.json');
    if (fs.existsSync(multiPath)) {
      const data = JSON.parse(fs.readFileSync(multiPath, 'utf8'));
      if (Array.isArray(data)) {
        return data;
      }
    }

    const singlePath = path.join(process.cwd(), 'src/data/hero_ad.json');
    if (fs.existsSync(singlePath)) {
      const data = JSON.parse(fs.readFileSync(singlePath, 'utf8'));
      if (Array.isArray(data.ads)) return data.ads;
      if (data && typeof data === 'object') return [data];
    }
  } catch {
    // Graceful fallback
  }
  return [];
}

export function getActiveHeroAds(): HeroAdData[] {
  return getAllHeroAds().filter(ad => ad && ad.isActive && ad.imageUrl);
}

export function getActiveHeroAd(): HeroAdData | null {
  const active = getActiveHeroAds();
  if (active.length > 0) return active[0];

  try {
    const filePath = path.join(process.cwd(), 'src/data/hero_ad.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch {
    // Graceful fallback
  }
  return null;
}
