import {
  Navigation,
  HeroSection,
  FeaturesSection,
  TrustSection,
  CTASection,
  PricingSection,
} from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "LogiVox - Voice-Enabled Warehouse Management System | Cut Picking Errors 95%",
  description:
    "Complete warehouse management with voice commands, AI optimization & real-time tracking. Reduce picking errors by 95%, increase fulfillment speed 3x. 30-day free trial.",
  keywords: [
    "warehouse management system",
    "voice-enabled WMS",
    "inventory management",
    "picking optimization",
    "warehouse automation",
    "order fulfillment",
    "real-time inventory tracking",
  ],
  openGraph: {
    title: "LogiVox - Voice-Enabled Warehouse Management",
    description:
      "Complete warehouse management with voice commands. Reduce errors by 95%, speed up fulfillment 3x.",
    url: "https://logivox.com",
    siteName: "LogiVox",
    locale: "en_US",
    type: "website",
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
  alternates: {
    canonical: "https://logivox.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LogiVox",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "RecurringPayment",
      billingDuration: "P1M",
      billingIncrement: 1,
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: 4.9,
    reviewCount: 847,
  },
  featureList: [
    "Voice-enabled operations",
    "Real-time inventory tracking",
    "AI-powered optimization",
    "Multi-warehouse management",
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
