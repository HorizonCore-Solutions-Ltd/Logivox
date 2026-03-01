import {
  Navigation,
  HeroSection,
  FeaturesSection,
  TrustSection,
  CTASection,
  PricingSection,
  ModernOfferingsSection,
  FAQSection,
} from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "LogiVox - Enterprise Voice-Native Warehouse Management System | Production Ready",
  description:
    "Production-ready enterprise WMS with 489 API endpoints, 42 specialized dashboards, and complete Next-Gen capabilities. Voice-directed operations, AI optimization, IoT integration, and robotics orchestration.",
  keywords: [
    "enterprise warehouse management",
    "voice-native WMS",
    "production inventory management",
    "AI warehouse optimization",
    "enterprise warehouse automation",
    "voice-directed warehouse",
    "real-time inventory tracking",
    "warehouse robotics integration",
  ],
  openGraph: {
    title: "LogiVox - Enterprise Voice-Native Warehouse Management",
    description:
      "Production-ready WMS with 489 APIs, voice operations, AI optimization, and complete Next-Gen features.",
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
  description:
    "Enterprise voice-native warehouse management system with 489 production API endpoints and complete Next-Gen capabilities",
  operatingSystem: "Web, Cloud",
  offers: {
    "@type": "Offer",
    description: "Enterprise licensing - contact for pricing",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "USD",
      price: "Contact for quote",
    },
  },
  featureList: [
    "Voice-directed warehouse operations",
    "489 production API endpoints",
    "42 specialized dashboards",
    "Real-time IoT sensor integration",
    "AI-powered optimization",
    "Robotics and automation orchestration",
    "Multi-warehouse management",
    "Enterprise security (ISO 27001, SOC 2)",
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
        <ModernOfferingsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
