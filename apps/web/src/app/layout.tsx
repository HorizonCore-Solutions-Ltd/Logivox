import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CookieBanner } from '@/components/cookie-banner'
import { SkipLinks } from '@/components/accessibility/skip-links'
import { KeyboardShortcutsHelp } from '@/components/accessibility/keyboard-shortcuts-help'
import { ScreenReaderAnnouncer } from '@/components/accessibility/screen-reader-announcer'
import { VisualAccessibilityProvider } from '@/components/providers/visual-accessibility-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FlowStock - Enterprise Stock Booking Platform',
    template: '%s | FlowStock',
  },
  description: 'Enterprise-grade stock booking and inventory management platform with zero-trust security, real-time synchronization, and seamless ERP integrations.',
  keywords: [
    'stock booking',
    'inventory management',
    'ERP integration',
    'enterprise platform',
    'multi-tenant',
    'zero-trust security',
    'real-time sync',
    'Oracle integration',
    'SAP integration',
    'NetSuite integration'
  ],
  authors: [
    {
      name: 'FlowStock Team',
      url: 'https://flowstock.com',
    },
  ],
  creator: 'FlowStock',
  publisher: 'FlowStock',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flowstock.com'),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlowStock',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flowstock.com',
    title: 'FlowStock - Enterprise Stock Booking Platform',
    description: 'Enterprise-grade stock booking and inventory management platform with zero-trust security and real-time synchronization.',
    siteName: 'FlowStock',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FlowStock Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowStock - Enterprise Stock Booking Platform',
    description: 'Enterprise-grade stock booking and inventory management platform with zero-trust security and real-time synchronization.',
    creator: '@flowstock',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FlowStock" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SkipLinks />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <VisualAccessibilityProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster />
                <CookieBanner />
                <KeyboardShortcutsHelp />
                <ScreenReaderAnnouncer />
              </AuthProvider>
            </QueryProvider>
          </VisualAccessibilityProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}