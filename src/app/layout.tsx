import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  const isWhatsApp = /WhatsApp/i.test(userAgent);

  const defaultTitle = "Bounce Back Academy – Free NBSE Study Material for Classes 8–12";
  const defaultDesc = "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures.";

  // Fetch branding for WhatsApp preview
  let imageUrl = "/logo.png";
  let description = defaultDesc;

  try {
    const branding = await prisma.branding.findFirst() as any;
    if (branding) {
      if (isWhatsApp && branding.whatsappImageUrl) {
        imageUrl = branding.whatsappImageUrl;
      }
      if (isWhatsApp && branding.whatsappMessage) {
        description = branding.whatsappMessage;
      }
    }
  } catch (e) {
    console.error("Error fetching metadata branding:", e);
  }

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
