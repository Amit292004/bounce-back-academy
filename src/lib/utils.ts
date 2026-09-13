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
    if (url.includes("drive.google.com") || url.includes("drive.usercontent.google.com")) {
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
        return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
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

export async function handleDownload(url: string, fileName?: string) {
  if (!url) return;

  const safeFileName = fileName
    ? (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
    : 'document.pdf';

  const proxyUrl =
    `/api/download?url=${encodeURIComponent(url)}` +
    (fileName ? `&name=${encodeURIComponent(fileName)}` : '');

  try {
    const res = await fetch(proxyUrl);

    // If redirected to Google Drive or external view
    if (res.redirected && res.url) {
      window.open(res.url, '_blank');
      return;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error || `Download failed (HTTP ${res.status})`;
      if (url.includes('drive.google.com')) {
        window.open(url, '_blank');
        return;
      }
      alert(errMsg);
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      if (url.includes('drive.google.com')) {
        window.open(url, '_blank');
        return;
      }
      alert('Unable to download: Upstream server returned a webpage instead of a document file.');
      return;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.error('Download error:', error);
    if (url.includes('drive.google.com')) {
      window.open(url, '_blank');
    } else {
      window.open(proxyUrl, '_blank');
    }
  }
}
