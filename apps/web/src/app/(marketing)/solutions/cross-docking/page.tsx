import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Zap,
  Clock,
  TrendingDown,
  ArrowRight,
  Check,
  Package,
  MapPin,
  RefreshCw,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cross-Docking Operations | Dock-to-Dock Logistics - LogiVox",
  description:
    "Eliminate storage with direct dock-to-dock transfers. Reduce handling costs by 40-60%, cut dwell time to under 4 hours, and accelerate order fulfillment.",
  keywords: [
    "cross-docking",
    "dock to dock",
    "flow-through distribution",
    "transshipment",
    "just-in-time logistics",
  ],
};

export default function CrossDockingPage() {
  const features = [
    {
      icon: Zap,
      title: "Pre-Planned Cross-Docking",
      description:
        "Match inbound ASNs to outbound orders before arrival. Automatic allocation and dock door assignment.",
      metrics: "< 2 hours dwell time",
    },
    {
      icon: RefreshCw,
      title: "Opportunistic Matching",
      description:
        "Real-time AI matching of received goods to open orders. Identify cross-dock opportunities on the fly.",
      metrics: "85% match rate",
    },
    {
      icon: MapPin,
      title: "Flow-Through Sorting",
      description:
        "Voice-guided sorting direct from receiving to outbound staging. No intermediate storage required.",
      metrics: "95% first-time accuracy",
    },
    {
      icon: Clock,
      title: "Dwell Time Monitoring",
      description:
        "Real-time tracking of product dwell time. Automatic alerts when approaching time limits.",
      metrics: "Max 4 hours",
    },
    {
      icon: Truck,
      title: "Dock Door Management",
      description:
        "Smart dock door allocation based on carrier, destination, and capacity. Minimize travel distance.",
      metrics: "30% faster loading",
    },
    {
      icon: BarChart3,
      title: "Cross-Dock Analytics",
      description:
        "Performance dashboards showing throughput, dwell time, cost savings, and efficiency metrics.",
      metrics: "Real-time KPIs",
    },
  ];

  const capabilities = [
    {
      title: "Inbound Operations",
      items: [
        "ASN pre-advice processing",
        "Dock appointment scheduling",
        "Real-time receiving",
        "Automatic quality checks",
        "Lot/serial tracking",
        "Exception handling",
      ],
    },
    {
      title: "Matching & Allocation",
      items: [
        "AI-powered order matching",
        "Multi-order consolidation",
        "Customer-specific routing",
        "Carrier-based grouping",
        "Zone-based sorting",
        "Priority handling",
      ],
    },
    {
      title: "Sorting & Staging",
      items: [
        "Voice-guided sorting",
        "Barcode verification",
        "Staging lane assignment",
        "Load building optimization",
        "Pallet/carton tracking",
        "Completion validation",
      ],
    },
    {
      title: "Outbound Operations",
      items: [
        "Load sheet generation",
        "BOL documentation",
        "Carrier integration",
        "Real-time tracking",
        "Departure management",
        "Performance metrics",
      ],
    },
  ];

  const benefits = [
    { metric: "40-60%", description: "Reduction in handling costs" },
    { metric: "< 4 hrs", description: "Average dwell time" },
    { metric: "85%", description: "Order match rate" },
    { metric: "30%", description: "Faster order fulfillment" },
    { metric: "70%", description: "Less storage space needed" },
    { metric: "99%", description: "Inventory accuracy" },
  ];

  const crossDockTypes = [
    {
      type: "Pre-Planned",
      description:
        "Inbound shipments matched to outbound orders before arrival",
      useCase: "LTL consolidation, retail distribution",
    },
    {
      type: "Opportunistic",
      description: "Real-time matching of received goods to immediate demand",
      useCase: "E-commerce fulfillment, drop shipping",
    },
    {
      type: "Flow-Through",
      description: "Direct transfer without quality inspection or repackaging",
      useCase: "Time-sensitive goods, pre-sorted products",
    },
    {
      type: "Merge-in-Transit",
      description: "Combine multiple inbound shipments into single outbound",
      useCase: "Multi-vendor orders, consolidated shipping",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 border-b">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container-enterprise py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm mb-6 shadow-sm">
              <Truck className="mr-2 h-4 w-4 text-primary" />
              Cross-Docking Operations
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 drop-shadow-sm">
              Eliminate Storage
              <span className="text-primary-600 block mt-2">
                With Dock-to-Dock Flow
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Transfer goods directly from receiving to shipping without
              storage. Reduce handling costs by 40-60%, cut dwell time to under
              4 hours, and accelerate order fulfillment by 30%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg shadow-xl hover:scale-105 transition-transform font-bold"
                asChild
              >
                <Link href="/contact">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg shadow-md hover:scale-105 transition-transform font-semibold"
                asChild
              >
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-md border-2 hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {benefit.metric}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {benefit.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Cross-Dock Solution
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              End-to-end dock-to-dock operations with AI-powered matching and
              real-time visibility
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

      {/* Cross-Dock Types */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Cross-Docking Strategies
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Multiple approaches to fit your operation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {crossDockTypes.map((type, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3 font-bold">
                    {index + 1}
                  </div>
                  {type.type}
                </h3>
                <p className="text-muted-foreground mb-3">{type.description}</p>
                <div className="text-sm text-primary-600 font-semibold">
                  Use Case: {type.useCase}
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
              Complete workflow from receiving dock to shipping dock
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow"
              >
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

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seamless flow from inbound to outbound in hours, not days
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200 hidden md:block" />

              {/* Steps */}
              <div className="space-y-8">
                {[
                  {
                    icon: Package,
                    title: "ASN Pre-Advice",
                    description:
                      "System receives advance shipment notification (ASN). AI matches inbound products to open outbound orders.",
                  },
                  {
                    icon: Truck,
                    title: "Dock Receiving",
                    description:
                      "Carrier arrives at assigned receiving dock. Products scanned and verified against ASN. Quality checks performed.",
                  },
                  {
                    icon: RefreshCw,
                    title: "Real-Time Sorting",
                    description:
                      "Voice-guided sorting to staging lanes. Products grouped by customer, route, or carrier. No storage required.",
                  },
                  {
                    icon: MapPin,
                    title: "Staging & Consolidation",
                    description:
                      "Products staged at outbound dock doors. Multiple inbound shipments consolidated for single outbound load.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Load Verification",
                    description:
                      "Final verification scan before loading. BOL generation and carrier documentation. Load sheet confirmation.",
                  },
                  {
                    icon: Zap,
                    title: "Immediate Departure",
                    description:
                      "Outbound carrier loaded and departed. Total dwell time under 4 hours. Real-time tracking enabled.",
                  },
                ].map((step, index) => (
                  <div key={index} className="relative flex gap-6 md:gap-8">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg z-10">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Measurable Business Impact
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Proven cost savings and efficiency gains
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center shadow-md border-2 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="text-5xl font-bold text-primary-600 mb-3">
                  {benefit.metric}
                </div>
                <div className="text-muted-foreground font-medium">
                  {benefit.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto text-center">
            <TrendingDown className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Reduce Handling Costs by 40-60%
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Eliminate storage and streamline operations with dock-to-dock
              cross-docking. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50 text-lg shadow-xl hover:scale-105 transition-transform font-bold"
                asChild
              >
                <Link href="/contact">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg shadow-md hover:scale-105 transition-transform font-semibold"
                asChild
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
