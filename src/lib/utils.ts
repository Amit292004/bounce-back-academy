import { logger } from '@/lib/logger'

/**
 * Converts a standard Google Drive share link into a direct download link.
 * Handles:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 */
export function getDownloadLink(url: string): string {
  if (!url) return "";
  
  try {
    // Handle Cloudinary Links
    if (url.includes("cloudinary.com")) {
      return url; // Return original URL for Cloudinary
    }

    // Handle Google Drive File Links
    if (url.includes("drive.google.com")) {
      let fileId = "";
      
      // Pattern: /file/d/FILE_ID/view
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fileId = fileIdMatch[1];
      } else {
        // Pattern: ?id=FILE_ID
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
          fileId = idMatch[1];
        }
      }
      
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    
    // Handle Google Docs/Sheets/Slides Links (convert to PDF export)
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
    logger.error("Error parsing link:", e);
  }
  
  return url;
}

// Keep the old name as an alias to avoid breaking other files
export const getGoogleDriveDownloadLink = getDownloadLink;

/**
 * Returns a link suitable for viewing in the browser.
 * For Cloudinary PDFs, it switches 'raw' to 'image' to allow browser previewing.
 */
export function getViewLink(url: string): string {
  if (!url) return "";

  // If it's a PDF or Drive link, use our internal viewer page
  const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('/raw/upload/') || url.includes('drive.google.com');
  
  if (isPDF) {
    return `/view?url=${encodeURIComponent(url)}`;
  }

  return url;
}

/**
 * Sanitizes a filename to ensure it is completely safe for Windows, Mac, Linux, and mobile filesystems.
 * Strips/replaces reserved characters: \ / : * ? " < > | and control characters.
 */
export function sanitizeFileName(name: string, fallback = 'document.pdf'): string {
  if (!name) return fallback;

  // Replace colons, slashes, backslashes, pipe with hyphens
  let clean = name
    .replace(/[:\\/|]/g, ' - ')
    .replace(/[*?"<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control chars
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  // Strip trailing periods or spaces (disallowed on Windows)
  clean = clean.replace(/[. ]+$/, '');

  if (!clean) clean = 'document';

  // Ensure .pdf extension
  if (!clean.toLowerCase().endsWith('.pdf') && !/\.(jpe?g|png|webp)$/i.test(clean)) {
    clean += '.pdf';
  }

  return clean;
}

export async function handleDownload(url: string, fileName?: string) {
  if (!url || url.includes('example.com')) {
    alert('This study material does not have a downloadable file attached yet.');
    return;
  }

  const safeFileName = sanitizeFileName(fileName || 'document.pdf');

  // ── Google Drive ────────────────────────────────────────────────────────────
  // Server-side proxying of Drive files fails because Google blocks unauthenticated
  // server requests. Instead we build the direct download URL and let the browser
  // fetch it using the user's own Google session — works for any publicly shared file.
  if (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')) {
    // Extract file ID from any Drive URL format
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch   = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId    = fileMatch?.[1] || idMatch?.[1] || '';

    const directUrl = fileId
      ? `https://drive.google.com/uc?export=download&id=${fileId}`
      : url; // fallback to original if no ID found

    // Use an invisible <a download> — browser handles auth via its Google session
    const link = document.createElement('a');
    link.href = directUrl;
    link.download = safeFileName;
    link.target = '_blank';           // needed for cross-origin download trigger
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // ── Non-Drive (Vercel Blob, Cloudinary, direct PDFs) ────────────────────────
  // Route through our server-side proxy to handle CORS, set correct MIME type,
  // and sanitize the filename.
  const proxyUrl =
    `/api/download?url=${encodeURIComponent(url)}` +
    `&name=${encodeURIComponent(safeFileName)}`;

  try {
    const res = await fetch(proxyUrl);

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      alert(errData?.error || `Download failed (HTTP ${res.status})`);
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      alert('Unable to download: the server returned a web page instead of a document.');
      return;
    }

    // Create a blob with an explicit PDF MIME so all OS / mobile viewers open it
    const blobData = await res.blob();
    const pdfBlob  = new Blob([blobData], {
      type: contentType.includes('image/') ? contentType : 'application/pdf',
    });
    const blobUrl  = window.URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10_000);
  } catch (error) {
    logger.error('Download error:', error);
    // Last-resort fallback: open the proxy URL directly in a new tab
    window.open(proxyUrl, '_blank');
  }
}
