import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Boxes, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Check,
  Wrench,
  ListChecks,
  BarChart3,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kitting & Assembly Operations | Build-to-Order Manufacturing - LogiVox',
  description: 'Assemble products, create promotional bundles, and manage complex kitting operations. Voice-guided assembly with 99.5% accuracy and 40-60% faster completion.',
  keywords: ['kitting operations', 'assembly management', 'product bundling', 'BOM management', 'work order assembly'],
}

export default function KittingAssemblyPage() {
  const features = [
    {
      icon: ListChecks,
      title: 'BOM Management',
      description: 'Multi-level bill of materials with component tracking, substitutions, and version control.',
      metrics: 'Unlimited levels',
    },
    {
      icon: Users,
      title: 'Assembly Workstations',
      description: 'Dedicated workstations with digital work instructions, real-time guidance, and quality checkpoints.',
      metrics: '99.5% accuracy',
    },
    {
      icon: Boxes,
      title: 'Voice-Guided Assembly',
      description: 'Hands-free voice instructions for component picking and assembly steps. Reduce errors and training time.',
      metrics: '40-60% faster',
    },
    {
      icon: CheckCircle2,
      title: 'Quality Verification',
      description: 'Built-in QC checkpoints at each assembly stage. Photo documentation and defect tracking included.',
      metrics: '99%+ quality rate',
    },
    {
      icon: Wrench,
      title: 'Component Management',
      description: 'Automatic component allocation, shortage alerts, and substitute management. Track lot/serial genealogy.',
      metrics: 'Real-time tracking',
    },
    {
      icon: BarChart3,
      title: 'Labor Tracking',
      description: 'Time tracking per assembly step, productivity metrics, and labor cost analysis per kit.',
      metrics: 'Step-level timing',
    },
  ]

  const kitTypes = [
    {
      type: 'Promotional Kits',
      description: 'Bundle products for marketing campaigns and special offers',
      examples: 'Holiday gift sets, seasonal bundles, promotional packages',
    },
    {
      type: 'Subscription Boxes',
      description: 'Recurring kit assembly for subscription-based businesses',
      examples: 'Monthly boxes, curated collections, membership perks',
    },
    {
      type: 'Custom Assemblies',
      description: 'Build-to-order products with customer-specific configurations',
      examples: 'Computer builds, custom tool kits, personalized sets',
    },
    {
      type: 'Manufacturing Kits',
      description: 'Pre-kit components for production line assembly',
      examples: 'Sub-assemblies, component staging, manufacturing work orders',
    },
  ]

  const capabilities = [
    {
      title: 'Kit Definition',
      items: [
        'Multi-level BOM creation',
        'Component specifications',
        'Assembly instructions',
        'Quality checkpoints',
        'Photo/video guides',
        'Version control',
      ]
    },
    {
      title: 'Work Order Management',
      items: [
        'Kit order creation',
        'Priority scheduling',
        'Workstation assignment',
        'Progress tracking',
        'Batch processing',
        'Status updates',
      ]
    },
    {
      title: 'Component Operations',
      items: [
        'Pick list generation',
        'Component staging',
        'Shortage management',
        'Substitute handling',
        'Lot/serial tracking',
        'Inventory deduction',
      ]
    },
    {
      title: 'Assembly Execution',
      items: [
        'Step-by-step guidance',
        'Voice instructions',
        'Barcode verification',
        'Photo documentation',
        'Quality checks',
        'Completion tracking',
      ]
    },
  ]

  const benefits = [
    { metric: '40-60%', description: 'Faster assembly time' },
    { metric: '99.5%', description: 'Assembly accuracy' },
    { metric: '70%', description: 'Less training time required' },
    { metric: '25%', description: 'Labor cost reduction' },
    { metric: '99%+', description: 'Quality pass rate' },
    { metric: '100%', description: 'Component traceability' },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 border-b">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container-enterprise py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm mb-6 shadow-sm">
              <Boxes className="mr-2 h-4 w-4 text-primary" />
              Kitting & Assembly Operations
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 drop-shadow-sm">
              Build Products Faster
              <span className="text-primary-600 block mt-2">With Voice-Guided Assembly</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Create promotional bundles, assemble custom products, and manage complex manufacturing kits. Voice guidance delivers 40-60% faster assembly with 99.5% accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg shadow-xl hover:scale-105 transition-transform font-bold" asChild>
                <Link href="/contact">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg shadow-md hover:scale-105 transition-transform font-semibold" asChild>
                <Link href="/docs">
                  View Documentation
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-md border-2 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-primary-600 mb-1">{benefit.metric}</div>
                  <div className="text-sm text-muted-foreground">{benefit.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Kitting Solution</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From BOM management to final assembly with quality verification
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white to-primary-50/30 rounded-xl p-6 border-2 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
                  <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {feature.description}
                </p>
                <div className="inline-flex items-center text-sm font-semibold text-primary-600">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {feature.metrics}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kit Types */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Kit Types We Support</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Flexible kitting for every business model
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {kitTypes.map((kit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold mb-3">{kit.type}</h3>
                <p className="text-muted-foreground mb-3">{kit.description}</p>
                <div className="text-sm text-primary-600 font-semibold">
                  Examples: {kit.examples}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">End-to-End Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete workflow from kit definition to final assembly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3 font-bold text-sm">
                    {index + 1}
                  </div>
                  {capability.title}
                </h3>
                <ul className="space-y-2">
                  {capability.items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Measurable Business Impact</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real results from voice-guided assembly
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center shadow-md border-2 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="text-5xl font-bold text-primary-600 mb-3">{benefit.metric}</div>
                <div className="text-muted-foreground font-medium">{benefit.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto text-center">
            <Zap className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Assemble 40-60% Faster
            </h2>
            <p className="text-xl mb-8 text-slate-300 max-w-2xl mx-auto">
              Voice-guided assembly with built-in quality checks. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg" asChild>
                <Link href="/contact">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
