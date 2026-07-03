import "~/styles/globals.css";

import { type Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "~/components/providers/SessionProvider";
import { SITE_URL } from "~/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Azziop",
    template: "%s | Azziop",
  },
  description:
    "Azziop is an AI-powered marketing platform to turn any website URL into brand DNA, campaign strategies, and ready-to-publish social media creatives.",
  keywords: [
    "Azziop",
    "azziop",
    "AI marketing",
    "campaign generator",
    "brand DNA",
    "social media creatives",
    "AI ad generator",
    "marketing automation",
    "creative director AI",
  ],
  authors: [{ name: "Azziop" }],
  creator: "Azziop",
  publisher: "Azziop",

  icons: {
    icon: "/logoazziop.png",
    shortcut: "/logoazziop.png",
    apple: "/logoazziop.png",
  },

  alternates: {
    canonical: "/",
  },

  verification: {
    google: "YhZNDuqCKZgj-80mjdRAjlmfru-1yj_6yy6S6y0wKuY",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Azziop",
    title: "Azziop — URL to Campaign in Seconds",
    description:
      "Azziop helps teams extract brand DNA, generate campaign strategies, and create ready-to-publish social creatives from any URL.",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Azziop — AI Campaign Generator",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Azziop — URL to Campaign in Seconds",
    description:
      "Azziop helps you extract brand DNA, generate strategies, and create ready-to-publish creatives with AI.",
    images: ["/og-banner.png"],
  },
};

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
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
