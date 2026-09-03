import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy-pdf?url=<encoded-url>
 *
 * Server-side CORS proxy for inline PDF viewing with react-pdf.
 * Returns the PDF bytes as application/pdf (no attachment header)
 * so pdfjs-dist can fetch and render it in the browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const commonHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/pdf,application/octet-stream,*/*",
  };

  try {
    const res1 = await fetch(url, { headers: commonHeaders, redirect: "follow" });

    if (!res1.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res1.status} ${res1.statusText}` },
        { status: 502 }
      );
    }

    const contentType = res1.headers.get("content-type") || "";

    // Google Drive virus-warning HTML intercept
    if (contentType.includes("text/html") && url.includes("drive.google.com")) {
      const html = await res1.text();
      const confirmMatch =
        html.match(/confirm=([0-9A-Za-z_-]+)/) ||
        html.match(/"([^"]*confirm=[^"]*)"/) ||
        html.match(/href="(\/uc\?[^"]*confirm[^"]*)"/) ||
        html.match(/action="([^"]*)"[^>]*>[\s\S]*?Download anyway/);

      let confirmUrl = "";
      if (confirmMatch) {
        const raw = confirmMatch[1];
        if (raw.startsWith("/") || raw.startsWith("http")) {
          confirmUrl = raw.startsWith("/") ? `https://drive.google.com${raw}` : raw;
          confirmUrl = confirmUrl.replace(/&amp;/g, "&");
        } else {
          const sep = url.includes("?") ? "&" : "?";
          confirmUrl = `${url}${sep}confirm=${raw}`;
        }
      } else {
        const sep = url.includes("?") ? "&" : "?";
        confirmUrl = `${url}${sep}confirm=t`;
      }

      const res2 = await fetch(confirmUrl, { headers: commonHeaders, redirect: "follow" });
      if (!res2.ok) {
        return NextResponse.json({ error: "Could not bypass Drive confirmation" }, { status: 502 });
      }
      return streamInline(res2);
    }

    return streamInline(res1);
  } catch (err) {
    console.error("[/api/proxy-pdf] error:", err);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}

function streamInline(res: Response): NextResponse {
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Cache-Control": "private, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  });
  const contentLength = res.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  return new NextResponse(res.body, { status: 200, headers });
}
