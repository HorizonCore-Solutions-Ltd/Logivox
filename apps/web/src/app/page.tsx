import {
  Navigation,
  HeroSection,
  FeaturesSection,
  TrustSection,
  CTASection,
  ModernOfferingsSection,
  FAQSection,
  NextGenSection,
  HybridChoiceSection,
} from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "LogiVox - Enterprise Voice-Native Warehouse Management System | Production Ready",
  description:
    "Industry-leading capability: optimize labor, reduce logistics spend, and scale fulfillment with our comprehensive management software, and complete Next-Gen capabilities. Voice-directed operations, AI optimization, IoT integration, and robotics orchestration.",
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
      "Production-ready WMS with intelligent workflows, voice operations, AI optimization, and complete Next-Gen features.",
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
    "Enterprise voice-native warehouse management system with seamless enterprise integrations and complete Next-Gen capabilities",
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
    "seamless enterprise integrations",
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
        <HybridChoiceSection />
        <NextGenSection />
        <FeaturesSection />
        <ModernOfferingsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
