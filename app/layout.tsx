import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://ielts.thietkeai.com";
const OG_IMAGE = process.env.NEXT_PUBLIC_OG_IMAGE || `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: "IELTS Writing Evaluation - AI Feedback",
  description: "Get instant AI-powered feedback on your IELTS writing.",
  openGraph: {
    title: "IELTS Writing Evaluation - AI Feedback",
    description: "Improve your IELTS writing with AI-powered evaluation and feedback.",
    url: SITE_URL,
    siteName: "IELTS Assessment",
    images: [
      {
        url: OG_IMAGE, // ✅ Replace with your image URL
        width: 1200,
        height: 630,
        alt: "IELTS Writing Evaluation Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IELTS Writing Evaluation - AI Feedback",
    description: "Improve your IELTS writing with AI-powered evaluation and feedback.",
    images: [OG_IMAGE], // ✅ Replace with your image URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics/>
        <SpeedInsights/>
      </body>
    </html>
  );
}
