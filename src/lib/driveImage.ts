/**
 * Extracts a Google Drive file ID from various link formats.
 */
export function getDriveFileId(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;

  // /file/d/FILE_ID/  — most common share link format
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // ?id=FILE_ID or &id=FILE_ID — thumbnail / uc / open formats
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Extract from lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match) return lh3Match[1];

  return null;
}

/**
 * Returns the raw, direct Google Drive image URL (for server-side fetching).
 */
export function getDriveDirectUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;

  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}

/**
 * Returns the proxy URL for the client image src.
 * Bypasses all CORS, CSP, browser caching, and ad-blocker issues
 * by routing the request through our own server.
 */
export function getDriveImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;

  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Return non-Drive URLs as-is
  return url;
}
