import { Navigation, HeroSection, FeaturesSection, PricingSection, TrustSection, CTASection } from '@/components/landing'
import { Footer } from '@/components/layout/footer'

export default function HomePage() {
  return (
    <>
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
  )
}