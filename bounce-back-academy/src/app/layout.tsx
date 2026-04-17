import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bounce Back Academy",
  description: "Free NBSE Study Material for Classes 8 to 12. Get Question Papers, Notes, and Video Lectures.",
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
