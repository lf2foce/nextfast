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


export const metadata: Metadata = {
  title: "IELTS Writing Evaluation - AI Feedback",
  description: "Get instant AI-powered feedback on your IELTS writing.",
  openGraph: {
    title: "IELTS Writing Evaluation - AI Feedback",
    description: "Improve your IELTS writing with AI-powered evaluation and feedback.",
    url: "https://ielts.thietkeai.com/",
    siteName: "IELTS Assessment",
    images: [
      {
        url: "https://ielts.thietkeai.com/og-image.png", // ✅ Replace with your image URL
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
    images: ["https://ielts.thietkeai.com/og-image.png"], // ✅ Replace with your image URL
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
