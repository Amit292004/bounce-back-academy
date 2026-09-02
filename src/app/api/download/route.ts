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
  const url = searchParams.get('url');
  const name = searchParams.get('name') || 'document.pdf';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // ── Step 1: initial fetch ──────────────────────────────────────────────
    const res1 = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
      redirect: 'follow',
    });

    if (!res1.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res1.status} ${res1.statusText}` },
        { status: 502 },
      );
    }

    const contentType = res1.headers.get('content-type') || '';

    // ── Step 2: Google Drive virus-warning intercept ───────────────────────
    // When Google Drive can't scan large files it returns an HTML warning page.
    // We extract the confirm token and re-fetch with it.
    if (contentType.includes('text/html') && url.includes('drive.google.com')) {
      const html = await res1.text();

      // Modern Drive warning: look for the download link with confirm param
      const confirmMatch =
        html.match(/confirm=([0-9A-Za-z_-]+)/) ||
        html.match(/"([^"]*confirm=[^"]*)"/) ||
        html.match(/href="(\/uc\?[^"]*confirm[^"]*)"/) ||
        html.match(/action="([^"]*)"[^>]*>[\s\S]*?Download anyway/);

      let confirmUrl = '';

      if (confirmMatch) {
        // Could be just the token or could be a full URL
        const raw = confirmMatch[1];
        if (raw.startsWith('/') || raw.startsWith('http')) {
          confirmUrl = raw.startsWith('/')
            ? `https://drive.google.com${raw}`
            : raw;
          // Unescape HTML entities
          confirmUrl = confirmUrl.replace(/&amp;/g, '&');
        } else {
          // It's just the token — append to original URL
          const separator = url.includes('?') ? '&' : '?';
          confirmUrl = `${url}${separator}confirm=${raw}`;
        }
      } else {
        // Try the standard confirm=t shortcut (works for most files)
        const separator = url.includes('?') ? '&' : '?';
        confirmUrl = `${url}${separator}confirm=t`;
      }

      const res2 = await fetch(confirmUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/pdf,application/octet-stream,*/*',
        },
        redirect: 'follow',
      });

      if (!res2.ok) {
        // Last resort: open original URL in new tab
        return NextResponse.redirect(url);
      }

      return streamResponse(res2, name);
    }

    // ── Step 3: Direct file (PDF / blob / Cloudinary) ─────────────────────
    return streamResponse(res1, name);
  } catch (err) {
    console.error('[/api/download] error:', err);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

/** Stream a fetch Response as a forced-download attachment */
function streamResponse(res: Response, fileName: string): NextResponse {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}"`,
    'Cache-Control': 'no-store',
  });

  // Forward Content-Length if available so browser shows progress
  const contentLength = res.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new NextResponse(res.body, { status: 200, headers });
}
