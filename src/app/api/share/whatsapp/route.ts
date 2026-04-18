import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('image');
  const title = searchParams.get('title') || 'Bounce Back Academy';
  const description = searchParams.get('desc') || 'Empowering Students to Excel';

  if (!imageUrl) {
    return new NextResponse('Image URL is required', { status: 400 });
  }

  // Return a minimal HTML page with Open Graph tags
  // WhatsApp will crawl this to generate the preview
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="${imageUrl}" />
      <meta http-equiv="refresh" content="0;url=${imageUrl}">
    </head>
    <body>
      <p>Redirecting to image...</p>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
