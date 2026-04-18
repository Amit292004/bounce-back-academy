import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Bounce Back Academy – Free NBSE Study Material for Classes 8–12",
    template: "%s | Bounce Back Academy",
  },
  description:
    "Free NBSE study material for Classes 8 to 12, CUET, JEE & NEET. Download question papers, notes, and watch video lectures by Amit Sharma. Best online coaching in Nagaland.",
  keywords: [
    "NBSE study material",
    "NBSE question papers",
    "NBSE notes",
    "free study material Nagaland",
    "Class 8 notes NBSE",
    "Class 9 notes NBSE",
    "Class 10 notes NBSE",
    "Class 11 notes NBSE",
    "Class 12 notes NBSE",
    "CUET preparation",
    "JEE preparation",
    "NEET preparation",
    "Bounce Back Academy",
    "online classes Nagaland",
    "Maths Science online class",
    "Amit Sharma teacher Nagaland",
  ],
  authors: [{ name: "Amit Sharma", url: "https://bounce-back-academy.vercel.app" }],
  creator: "Amit Sharma",
  publisher: "Bounce Back Academy",
  metadataBase: new URL("https://bounce-back-academy.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bounce Back Academy – Free NBSE Study Material",
    description:
      "Free NBSE study material for Classes 8–12, CUET, JEE & NEET. Question papers, notes and video lectures.",
    url: "https://bounce-back-academy.vercel.app",
    siteName: "Bounce Back Academy",
    images: [
      {
        url: "/logo.png",
        width: 400,
        height: 400,
        alt: "Bounce Back Academy Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bounce Back Academy – Free NBSE Study Material",
    description: "Free NBSE study material for Classes 8–12, CUET, JEE & NEET.",
    images: ["/logo.png"],
    creator: "@BounceBackAcademy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "81b24f821c3a739d",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <MainLayoutWrapper>{children}</MainLayoutWrapper>
      </body>
    </html>
  );
}
