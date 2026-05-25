import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "~/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "NoPain Marketing",
    template: "%s | NoPain Marketing",
  },
  description:
    "NoPain Marketing — AI-powered campaign generator. Drop any URL and get brand DNA extraction, campaign strategies, and ready-to-post social media creatives in seconds.",
  keywords: [
    "NoPain Marketing",
    "AI marketing",
    "campaign generator",
    "brand DNA",
    "social media creatives",
    "AI ad generator",
    "marketing automation",
    "creative director AI",
  ],
  authors: [{ name: "NoPain Marketing" }],
  creator: "NoPain Marketing",
  publisher: "NoPain Marketing",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nopainmarketing.com",
    siteName: "NoPain Marketing",
    title: "NoPain Marketing — URL to Campaign in Seconds",
    description:
      "AI-powered marketing suite. Extract brand DNA, generate campaign strategies, and create ready-to-post social media creatives from any URL.",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "NoPain Marketing — AI Campaign Generator",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "NoPain Marketing — URL to Campaign in Seconds",
    description:
      "AI-powered marketing suite. Extract brand DNA, generate strategies, and create ready-to-post creatives.",
    images: ["/og-banner.png"],
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0e17" />
      </head>
      <body className="bg-surface-950 text-surface-100 antialiased" suppressHydrationWarning>
        <SessionProvider>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
