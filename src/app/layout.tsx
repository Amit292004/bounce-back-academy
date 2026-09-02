import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Bounce Back Academy – Free NBSE Study Material for Classes 8–12";
  const defaultDesc = "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures.";

  return {
    title: {
      default: defaultTitle,
      template: "%s | Bounce Back Academy",
    },
    description: defaultDesc,
    applicationName: 'Bounce Back Academy',
    metadataBase: new URL("https://bouncebackacademy.vercel.app"),
    alternates: {
      canonical: "https://bouncebackacademy.vercel.app",
    },
    openGraph: {
      title: "Bounce Back Academy",
      description: defaultDesc,
      url: "https://bouncebackacademy.vercel.app",
      siteName: "Bounce Back Academy",
      images: [{ url: "/logo.png" }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      images: ["/logo.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "RD88kClebuq3g0JxmGSaFloIen2rk_aCSH7ge3nSJwg",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Bounce Back Academy",
    },
  };
}

export const viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { ThemeProvider } from "@/components/ThemeProvider";
import PWARegistration from "@/components/PWARegistration";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Bounce Back Academy",
      "alternateName": ["Bounce Back", "BBA"],
      "url": "https://bouncebackacademy.vercel.app/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://bouncebackacademy.vercel.app/notes?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Bounce Back Academy",
      "url": "https://bouncebackacademy.vercel.app/",
      "logo": "https://bouncebackacademy.vercel.app/logo.png",
      "description": "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures by Amit Sharma.",
      "founder": {
        "@type": "Person",
        "name": "Amit Sharma",
        "jobTitle": "Founder & Educator",
        "url": "https://bouncebackacademy.vercel.app/",
        "sameAs": [
          "https://www.instagram.com/bouncebackacdemy",
          "https://www.linkedin.com/in/amit-sharma-142a26359/",
          "https://t.me/amit292004"
        ]
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "bouncebackacademy.edu@gmail.com",
        "telephone": "+91-7628024274",
        "availableLanguage": ["English", "Hindi"]
      },
      "sameAs": [
        "https://www.instagram.com/bouncebackacdemy",
        "https://www.youtube.com/@BounceBackAcademy",
        "https://www.linkedin.com/in/amit-sharma-142a26359/"
      ]
    }
  ]);

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body>
        {/* Theme init: runs before hydration to avoid flash of wrong colour scheme */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bba-theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
        {/* JSON-LD structured data */}
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <ThemeProvider>
          <PWARegistration />
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
