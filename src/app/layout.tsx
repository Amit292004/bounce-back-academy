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
  themeColor: "#0a0a0a",
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
      "@id": "https://bouncebackacademy.vercel.app/#website",
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
      "@id": "https://bouncebackacademy.vercel.app/#organization",
      "name": "Bounce Back Academy",
      "alternateName": ["Bounce Back", "BBA"],
      "url": "https://bouncebackacademy.vercel.app/",
      "logo": "https://bouncebackacademy.vercel.app/logo.png",
      "image": "https://bouncebackacademy.vercel.app/logo.png",
      "description": "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures by Amit Sharma.",
      "founder": {
        "@id": "https://bouncebackacademy.vercel.app/#founder"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "bouncebackacademy.edu@gmail.com",
        "telephone": "+91-7628024274",
        "availableLanguage": ["English", "Hindi"]
      },
      "sameAs": [
        "https://wa.me/917628024274",
        "https://www.instagram.com/bouncebackacdemy",
        "https://www.youtube.com/@BounceBackAcademy",
        "https://www.linkedin.com/in/amit-sharma-142a26359/",
        "https://t.me/amit292004"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://bouncebackacademy.vercel.app/#founder",
      "name": "Amit Sharma",
      "givenName": "Amit",
      "familyName": "Sharma",
      "jobTitle": "Founder & Educator",
      "image": "https://bouncebackacademy.vercel.app/amit-sharma.jpg",
      "telephone": "+91-7628024274",
      "email": "bouncebackacademy.edu@gmail.com",
      "url": "https://bouncebackacademy.vercel.app/contact",
      "worksFor": {
        "@id": "https://bouncebackacademy.vercel.app/#organization"
      },
      "sameAs": [
        "https://wa.me/917628024274",
        "https://www.instagram.com/bouncebackacdemy",
        "https://www.youtube.com/@BounceBackAcademy",
        "https://www.linkedin.com/in/amit-sharma-142a26359/",
        "https://t.me/amit292004"
      ]
    }
  ]);

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head />
      <body>
        {/* Theme init: runs before hydration to avoid flash of wrong colour scheme */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bba-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light')}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light')}}catch(e){}})();`,
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
