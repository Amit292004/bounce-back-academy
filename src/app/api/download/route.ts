import { NextRequest, NextResponse } from 'next/server';
import { sanitizeFileName } from '@/lib/utils';

/**
 * GET /api/download?url=<encoded-url>&name=<filename>
 *
 * Server-side proxy that fetches PDFs (Google Drive, Vercel Blob, Cloudinary)
 * and streams back the exact verified binary with proper application/pdf MIME type.
 *
 * Ensures:
 * 1. Never serves HTML error/login pages as .pdf files.
 * 2. Proper Content-Type: application/pdf so mobile and desktop OS open it directly.
 * 3. Sanitized filenames without illegal characters (e.g. colons) that corrupt Windows files.
 * 4. Exact Content-Length using ArrayBuffer to prevent stream truncation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const name = searchParams.get('name') || 'document.pdf';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Resolve relative URLs to full origin URLs if needed
  let targetUrl = rawUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = new URL(rawUrl, request.url).toString();
  }

  // Extract Google Drive File ID
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
      Accept: 'application/pdf,application/octet-stream,image/*,*/*',
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

    // Handle Google Drive virus-warning confirmation page for large files
    if (contentType.includes('text/html') && (targetUrl.includes('google.com') || res.url.includes('google.com'))) {
      const html = await res.text();

      const confirmMatch =
        html.match(/confirm=([0-9A-Za-z_-]+)/) ||
        html.match(/name="confirm"\s+value="([0-9A-Za-z_-]+)"/) ||
        html.match(/"([^"]*confirm=[^"]*)"/) ||
        html.match(/href="(\/uc\?[^"]*confirm[^"]*)"/) ||
        html.match(/action="([^"]*)"[^>]*>[\s\S]*?Download anyway/i);

      let confirmUrl = '';
      if (confirmMatch) {
        const raw = confirmMatch[1];
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
    }

    const buffer = await res.arrayBuffer();

    // Check if the content is still HTML (e.g. login required, access denied, or error page)
    if (contentType.includes('text/html') || res.url.includes('accounts.google.com')) {
      if (driveViewFallback) {
        return NextResponse.redirect(driveViewFallback);
      }
      return NextResponse.json(
        { error: 'The requested resource returned a web page instead of a document file' },
        { status: 502 },
      );
    }

    return buildAttachmentResponse(buffer, name, contentType);
  } catch (err) {
    console.error('[/api/download] error:', err);
    if (driveViewFallback) {
      return NextResponse.redirect(driveViewFallback);
    }
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

/** Build response with verified binary buffer and safe filename headers */
function buildAttachmentResponse(buffer: ArrayBuffer, fileName: string, upstreamType: string): NextResponse {
  const safeFileName = sanitizeFileName(fileName);
  const asciiFileName =
    safeFileName
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\]/g, '')
      .trim() || 'document.pdf';

  const isImage = /\.(jpe?g|png|webp)$/i.test(safeFileName) || upstreamType.includes('image/');
  const mimeType = isImage ? upstreamType || 'image/jpeg' : 'application/pdf';

  const headers = new Headers({
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
    'Content-Length': buffer.byteLength.toString(),
    'Cache-Control': 'public, max-age=3600',
  });

  return new NextResponse(buffer, { status: 200, headers });
}
