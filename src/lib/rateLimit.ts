/**
 * Fix #3: Rate limiting for auth endpoints.
 *
 * Uses @upstash/ratelimit + @upstash/redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured (production).
 *
 * Falls back to a simple in-process Map when those env vars are absent (local dev),
 * so development never breaks.
 */
import { NextRequest, NextResponse } from 'next/server';

// ---------- In-process fallback (dev only) ----------
type FallbackEntry = { count: number; resetAt: number };
const devStore = new Map<string, FallbackEntry>();

function devRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = devStore.get(key);
  if (!entry || now > entry.resetAt) {
    devStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true;
}

// ---------- Upstash (production) ----------
let upstashRatelimit: ((key: string) => Promise<{ success: boolean }>) | null = null;

async function getUpstashLimiter(limit: number, windowSeconds: number) {
  if (upstashRatelimit) return upstashRatelimit;
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds}s`),
    });
    upstashRatelimit = (key: string) => rl.limit(key);
    return upstashRatelimit;
  } catch {
    return null;
  }
}

/**
 * Call at the top of an API route handler.
 *
 * @param request  - The incoming NextRequest
 * @param limit    - Max requests allowed per window
 * @param windowS  - Window size in seconds
 * @returns        - null if allowed; a 429 NextResponse if blocked
 */
export async function checkRateLimit(
  request: NextRequest,
  limit = 5,
  windowS = 60,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const key = `rate:${request.nextUrl.pathname}:${ip}`;

  const useUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (useUpstash) {
    const limiter = await getUpstashLimiter(limit, windowS);
    if (limiter) {
      const { success } = await limiter(key);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
      return null;
    }
  }

  // Fallback: in-process limiter for local dev
  const allowed = devRateLimit(key, limit, windowS * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }
  return null;
}
