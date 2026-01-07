import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Package,
  QrCode,
  ShieldCheck,
  Zap,
  Globe,
  Leaf,
  DollarSign,
  ArrowRight,
  Check,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  ShoppingBag,
  Truck,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Returns Management | Advanced RMA & Reverse Logistics - LogiVox",
  description:
    "Streamline returns processing with instant refunds, QR-based returns, return aggregation, serial tracking, and fraud prevention. Reduce return costs by 15-30%.",
  keywords: [
    "returns management",
    "RMA processing",
    "reverse logistics",
    "instant refunds",
    "QR returns",
    "return fraud prevention",
  ],
};

export default function ReturnsManagementPage() {
  const features = [
    {
      icon: Zap,
      title: "Instant Refunds",
      description:
        "Process refunds in under 60 seconds with automatic Stripe integration. Build customer trust with fast, seamless refunds.",
      metrics: "< 60 sec processing",
    },
    {
      icon: QrCode,
      title: "QR Code Returns",
      description:
        "Scan-to-return functionality with encrypted QR codes. Automatic label generation and mobile-optimized customer portal.",
      metrics: "90% faster processing",
    },
    {
      icon: Package,
      title: "Return Aggregation",
      description:
        "Consolidate multiple returns into single shipments. Optimize carrier selection and reduce shipping costs.",
      metrics: "15-30% cost savings",
    },
    {
      icon: ShieldCheck,
      title: "Serial Tracking",
      description:
        "Prevent serial number swaps and fraud. Validate warranties and track items at the serial level with full genealogy.",
      metrics: "99.9% accuracy",
    },
    {
      icon: DollarSign,
      title: "Vendor Chargebacks",
      description:
        "Automated chargeback calculation and dispute management. Track supplier quality and recover costs efficiently.",
      metrics: "Auto-calculated",
    },
    {
      icon: Leaf,
      title: "Sustainability Tracking",
      description:
        "Carbon footprint calculation, circularity scoring, and ESG compliance reporting for environmentally conscious operations.",
      metrics: "ESG compliant",
    },
    {
      icon: Globe,
      title: "Cross-Border Returns",
      description:
        "International return routing with customs automation, duty/VAT refunds, and multi-currency support.",
      metrics: "180+ countries",
    },
    {
      icon: AlertTriangle,
      title: "Risk Prediction",
      description:
        "ML-based fraud detection with pre-shipment risk scoring. Identify patterns and prevent fraudulent returns.",
      metrics: "95% fraud detection",
    },
  ];

  const capabilities = [
    {
      title: "Return Authorization",
      items: [
        "Self-service RMA portal",
        "Automated approval workflows",
        "Return reason categorization",
        "Conditional approval rules",
        "Multi-channel return initiation",
        "Email & SMS notifications",
      ],
    },
    {
      title: "Inspection & Processing",
      items: [
        "QC inspection workflows",
        "Disposition routing (resell, refurbish, scrap)",
        "Photo documentation",
        "Defect tracking and analysis",
        "Restocking automation",
        "Root cause analysis",
      ],
    },
    {
      title: "Refund & Credit",
      items: [
        "Instant refund processing",
        "Store credit automation",
        "Partial refund handling",
        "Restocking fee calculation",
        "Multi-payment method support",
        "Chargeback protection",
      ],
    },
    {
      title: "Analytics & Optimization",
      items: [
        "Return rate dashboards",
        "Product return analysis",
        "Customer returner profiles",
        "Cost impact reporting",
        "Trend identification",
        "Predictive analytics",
      ],
    },
  ];

  const benefits = [
    { metric: "< 60 sec", description: "Average refund processing time" },
    { metric: "15-30%", description: "Reduction in return shipping costs" },
    { metric: "95%", description: "Fraud detection accuracy" },
    { metric: "90%", description: "Faster return processing" },
    { metric: "99.9%", description: "Serial tracking accuracy" },
    { metric: "24/7", description: "Self-service return portal" },
  ];

  const integrations = [
    "Stripe (instant refunds)",
    "PayPal & payment gateways",
    "Shipping carriers (UPS, FedEx, USPS)",
    "E-commerce platforms (Shopify, Magento)",
    "ERP systems (SAP, Oracle, NetSuite)",
    "Customer service (Zendesk, Freshdesk)",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 border-b">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container-enterprise py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm mb-6 shadow-sm">
              <RefreshCw className="mr-2 h-4 w-4 text-primary" />
              Advanced Returns Management
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 drop-shadow-sm">
              Turn Returns Into a
              <span className="text-primary-600 block mt-2">
                Competitive Advantage
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Process returns in under 60 seconds with instant refunds, QR-based
              returns, fraud prevention, and return aggregation. Reduce costs by
              15-30% while building customer trust.
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
              Complete Returns Ecosystem
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Eight advanced modules working together to streamline returns
              processing from initiation to resolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Capabilities Grid */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              End-to-End Returns Capabilities
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive workflows covering every aspect of reverse logistics
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow"
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
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Streamlined returns process from customer initiation to final
              disposition
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
                    icon: ShoppingBag,
                    title: "Customer Initiates Return",
                    description:
                      "Customer scans QR code or visits self-service portal. System validates eligibility and generates RMA instantly.",
                  },
                  {
                    icon: QrCode,
                    title: "Label Generation",
                    description:
                      "Pre-paid shipping label generated automatically. QR code embedded for tracking. Customer receives email with instructions.",
                  },
                  {
                    icon: Truck,
                    title: "Return Aggregation",
                    description:
                      "System identifies consolidation opportunities. Multiple returns combined into single shipment to reduce costs by 15-30%.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Inspection & Validation",
                    description:
                      "Serial number verification and QC inspection. Fraud detection checks. Photo documentation for disputes.",
                  },
                  {
                    icon: RefreshCw,
                    title: "Disposition Routing",
                    description:
                      "Automated routing based on condition: resell, refurbish, liquidate, or scrap. Restocking rules applied.",
                  },
                  {
                    icon: Zap,
                    title: "Instant Refund",
                    description:
                      "Refund processed in under 60 seconds via Stripe. Customer receives confirmation. Inventory updated in real-time.",
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
              Real metrics from real customers
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

      {/* Integrations */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Seamless Integrations</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with the tools you already use
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-slate-50 rounded-lg p-4 border hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <span className="font-medium">{integration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto text-center">
            <Clock className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Reduce Return Costs by 15-30%
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Join hundreds of warehouses processing returns faster, cheaper,
              and with less fraud. Start your free trial today.
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
