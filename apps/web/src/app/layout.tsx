import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header, Footer } from '@/components/layout'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
      <head />
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}