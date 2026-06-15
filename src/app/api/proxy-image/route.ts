import { NextRequest, NextResponse } from 'next/server';
import { getDriveDirectUrl } from '@/lib/driveImage';
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // 1. Get the direct Google Drive URL (or check if it is one)
    const convertedUrl = getDriveDirectUrl(targetUrl);

    if (!convertedUrl) {
      return new NextResponse('Invalid url', { status: 400 });
    }

    // 2. Fetch the image content directly on the server side
    const response = await fetch(convertedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      logger.error(`[proxy-image] Failed to fetch target image. Status: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    // 3. Read the image binary data
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // 4. Return the image directly from our own domain
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Cache the image for 1 day to reduce load on Google Drive
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    logger.error('[proxy-image] Error proxying image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
