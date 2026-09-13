import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download?url=<encoded-url>&name=<filename>
 *
 * Server-side proxy that fetches any PDF (Google Drive, Vercel Blob, Cloudinary)
 * and streams it back to the browser as an attachment — zero CORS issues,
 * one click, no intermediate pages.
 *
 * Google Drive large-file flow:
 *   1. Fetch uc?export=download&id=... — may return a virus-warning HTML page
 *   2. Extract the confirm token from that page
 *   3. Re-fetch with &confirm=TOKEN to get the actual file
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const name = searchParams.get('name') || 'document.pdf';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Resolve relative URLs to full origin URLs
  let targetUrl = rawUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = new URL(rawUrl, request.url).toString();
  }

  // Google Drive File ID extraction
  let driveFileId = '';
  if (targetUrl.includes('drive.google.com') || targetUrl.includes('drive.usercontent.google.com')) {
    const fileMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch?.[1]) {
      driveFileId = fileMatch[1];
    } else {
      const idMatch = targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch?.[1]) driveFileId = idMatch[1];
    }

    if (driveFileId) {
      // Use Google Drive direct download endpoint
      targetUrl = `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download`;
    }
  }

  const driveViewFallback = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/view`
    : rawUrl.includes('drive.google.com')
    ? rawUrl
    : '';

  try {
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/pdf,application/octet-stream,*/*',
    };

    let res = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (!res.ok) {
      if (driveViewFallback) {
        return NextResponse.redirect(driveViewFallback);
      }
      return NextResponse.json(
        { error: `Upstream error: ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }

    let contentType = res.headers.get('content-type') || '';

    // Check if Google Drive returned an HTML page (virus scan warning or sign-in page)
    if (contentType.includes('text/html') && (targetUrl.includes('google.com') || res.url.includes('google.com'))) {
      const html = await res.text();

      // Look for confirmation token in Google Drive large-file virus warning page
      const confirmMatch =
        html.match(/confirm=([0-9A-Za-z_-]+)/) ||
        html.match(/name="confirm"\s+value="([0-9A-Za-z_-]+)"/) ||
        html.match(/href="(\/uc\?[^"]*confirm[^"]*)"/) ||
        html.match(/action="([^"]*)"[^>]*>[\s\S]*?Download anyway/i);

      if (confirmMatch) {
        const raw = confirmMatch[1];
        let confirmUrl = '';
        if (raw.startsWith('/') || raw.startsWith('http')) {
          confirmUrl = raw.startsWith('/') ? `https://drive.google.com${raw}` : raw;
          confirmUrl = confirmUrl.replace(/&amp;/g, '&');
        } else if (driveFileId) {
          confirmUrl = `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download&confirm=${raw}`;
        } else {
          const sep = targetUrl.includes('?') ? '&' : '?';
          confirmUrl = `${targetUrl}${sep}confirm=${raw}`;
        }

        res = await fetch(confirmUrl, {
          headers: fetchHeaders,
          redirect: 'follow',
        });
        contentType = res.headers.get('content-type') || '';
      }

      // If it is STILL HTML (e.g. accounts.google.com signin, access denied, or error page):
      // NEVER send HTML as a PDF!
      if (contentType.includes('text/html') || res.url.includes('accounts.google.com')) {
        if (driveViewFallback) {
          return NextResponse.redirect(driveViewFallback);
        }
        return NextResponse.json(
          { error: 'File is not accessible or requires authorization' },
          { status: 403 },
        );
      }
    }

    // For any general URL: verify it isn't an HTML error page
    if (contentType.includes('text/html')) {
      if (driveViewFallback) {
        return NextResponse.redirect(driveViewFallback);
      }
      return NextResponse.json(
        { error: 'The requested resource returned a web page instead of a document file' },
        { status: 502 },
      );
    }

    return streamResponse(res, name, contentType);
  } catch (err) {
    console.error('[/api/download] error:', err);
    if (driveViewFallback) {
      return NextResponse.redirect(driveViewFallback);
    }
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

/** Stream a fetch Response as a verified download attachment */
function streamResponse(res: Response, fileName: string, upstreamType: string): NextResponse {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // Clean ASCII name for fallback
  const asciiFileName =
    safeFileName
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\]/g, '')
      .trim() || 'document.pdf';

  const mimeType =
    safeFileName.toLowerCase().endsWith('.pdf') || upstreamType.includes('pdf')
      ? 'application/pdf'
      : upstreamType || 'application/octet-stream';

  const headers = new Headers({
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
    'Cache-Control': 'public, max-age=3600',
  });

  const contentLength = res.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new NextResponse(res.body, { status: 200, headers });
}
