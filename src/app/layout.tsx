import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Bounce Back Academy – Free NBSE Study Material for Classes 8–12";
  const defaultDesc = "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures.";

  let imageUrl = "/logo.png";
  let description = defaultDesc;

  // WhatsApp branding is handled via /ad route metadata
  // Keeping layout metadata static avoids Prisma SSR issues with Turbopack

  return {
    title: {
      default: defaultTitle,
      template: "%s | Bounce Back Academy",
    },
    description: defaultDesc,
    metadataBase: new URL("https://bouncebackacademy.vercel.app"),
    openGraph: {
      title: "Bounce Back Academy",
      description: description,
      url: "https://bouncebackacademy.vercel.app",
      siteName: "Bounce Back Academy",
      images: [{ url: imageUrl }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "RD88kClebuq3g0JxmGSaFloIen2rk_aCSH7ge3nSJwg",
    },
  };
}

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Bounce Back Academy",
              "alternateName": ["Bounce Back", "BBA"],
              "url": "https://bouncebackacademy.vercel.app/"
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('bba-theme');
                  if (localTheme === 'dark' || (!localTheme && true)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
