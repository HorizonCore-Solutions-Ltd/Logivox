import { Navigation } from '@/components/landing'
import { Footer } from '@/components/layout/footer'
import { PricingSection } from '@/components/landing'

export const metadata = {
  title: 'Pricing - LogiVox',
  description: 'Simple, transparent pricing for enterprise inventory management. Start with a free trial.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
