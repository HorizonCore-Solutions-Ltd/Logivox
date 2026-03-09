import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  VoiceControl,
  VoiceControlAnnouncer,
} from "@/components/voice-control";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieBanner } from "@/components/cookie-banner";
import { SkipLinks } from "@/components/accessibility/skip-links";
import { KeyboardShortcutsHelp } from "@/components/accessibility/keyboard-shortcuts-help";
import { ScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer";
import { VisualAccessibilityProvider } from "@/components/providers/visual-accessibility-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LogiVox - Enterprise Warehouse Management System | WMS Software",
    template: "%s | LogiVox",
  },
  description:
    "Industry-leading Warehouse Management System (WMS) with intelligent automation, wave picking, quality control, and real-time analytics. Fully adaptable, mobile-enabled WMS software driving supply chain efficiency.",
  keywords: [
    // Core WMS
    "warehouse management system",
    "WMS software",
    "enterprise WMS",
    "cloud WMS",
    "warehouse automation software",
    "inventory management system",
    "wave picking software",
    "order fulfillment platform",
    "supply chain software",
    "warehouse operations platform",
    "multi-warehouse management",
    "real-time inventory tracking",
    "mobile WMS",
    "barcode scanning WMS",
    "RFID warehouse management",
    // Labor & Productivity
    "labor management system WMS",
    "warehouse labor optimization",
    "workforce productivity WMS",
    "floor heatmap analytics",
    "task interleaving warehouse",
    "wave interleaving software",
    "forklift utilization optimization",
    // Yard Management
    "yard management system",
    "YMS software",
    "dock scheduling software",
    "truck gate management",
    "shunter dispatch software",
    "trailer yard management",
    "detention fee elimination",
    "dock appointment scheduling",
    "gate log automation",
    "yard visibility software",
    // Robotics & Automation
    "AMR fleet management software",
    "autonomous mobile robot WMS",
    "AGV warehouse integration",
    "robotics warehouse automation",
    "sortation system software",
    "conveyor management system",
    "AS RS crane management",
    "cross belt sorter integration",
    "cobot warehouse integration",
    "warehouse robotics platform",
    "AI dispatch automation",
    "automated task assignment warehouse",
    // IoT & Sensors
    "warehouse IoT platform",
    "IoT sensor monitoring warehouse",
    "environmental monitoring warehouse",
    "cold chain compliance software",
    "temperature humidity monitoring warehouse",
    "RFID portal integration WMS",
    "weight scale telemetry warehouse",
    "warehouse sensor network",
    // AI & Intelligence
    "AI-powered WMS",
    "machine learning inventory optimization",
    "demand forecasting WMS",
    "predictive analytics warehouse",
    "computer vision warehouse",
    "warehouse digital twin",
    // Integrations & Platform
    "ERP integration WMS",
    "SAP WMS integration",
    "Shopify WMS integration",
    "QuickBooks inventory integration",
    "quality control WMS",
    "CAPA management warehouse",
    "compliance reporting WMS",
    "3PL management software",
    "cross-docking software",
    // Competitive
    "Oracle WMS alternative",
    "Manhattan WMS alternative",
    "SAP EWM alternative",
    "best warehouse management system 2026",
    "next generation WMS",
  ],
  authors: [
    {
      name: "LogiVox Team",
      url: "https://logivox.ai",
    },
  ],
  creator: "LogiVox",
  publisher: "LogiVox",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://logivox.ai"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LogiVox",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://logivox.ai",
    title: "LogiVox - Enterprise Stock Booking Platform",
    description:
      "Enterprise-grade stock booking and inventory management platform with zero-trust security and real-time synchronization.",
    siteName: "LogiVox",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LogiVox Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LogiVox - Enterprise Stock Booking Platform",
    description:
      "Enterprise-grade stock booking and inventory management platform with zero-trust security and real-time synchronization.",
    creator: "@logivox",
    images: ["/og-image.jpg"],
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
    google: "your-google-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LogiVox" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <VoiceControl />
              <VoiceControlAnnouncer />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
