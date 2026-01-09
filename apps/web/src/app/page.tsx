import {
  Navigation,
  HeroSection,
  FeaturesSection,
  TrustSection,
  CTASection,
} from "@/components/landing";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
