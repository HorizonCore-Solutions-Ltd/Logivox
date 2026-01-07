import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Code,
  Key,
  Shield,
  Zap,
  ArrowRight,
  Check,
  BookOpen,
  Terminal,
  Webhook,
  Database,
  Lock,
  FileCode,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "API Documentation | RESTful API Reference - LogiVox",
  description:
    "Complete API reference for LogiVox WMS. RESTful endpoints, authentication, webhooks, and integration guides for developers.",
  keywords: [
    "API documentation",
    "REST API",
    "WMS API",
    "API integration",
    "developer documentation",
  ],
};

export default function APIDocumentationPage() {
  const endpoints = [
    {
      category: "Inventory",
      count: 25,
      description: "Stock levels, locations, movements",
    },
    {
      category: "Orders",
      count: 18,
      description: "Order creation, fulfillment, status",
    },
    {
      category: "Receiving",
      count: 12,
      description: "GRN, putaway, ASN processing",
    },
    {
      category: "Shipping",
      count: 15,
      description: "Carriers, labels, tracking",
    },
    {
      category: "Wave Picking",
      count: 10,
      description: "Wave creation, allocation, execution",
    },
    {
      category: "Returns",
      count: 14,
      description: "RMA, refunds, disposition",
    },
    {
      category: "Reporting",
      count: 8,
      description: "KPIs, analytics, exports",
    },
    {
      category: "Yard Management",
      count: 9,
      description: "Appointments, gates, docks",
    },
  ];

  const features = [
    {
      icon: Code,
      title: "RESTful API",
      description:
        "Standard HTTP methods (GET, POST, PUT, DELETE) with JSON payloads for maximum compatibility.",
    },
    {
      icon: Key,
      title: "API Key Authentication",
      description:
        "Secure API keys with role-based permissions. Support for multiple keys per tenant.",
    },
    {
      icon: Webhook,
      title: "Webhooks",
      description:
        "Real-time event notifications for inventory changes, order updates, and shipments.",
    },
    {
      icon: Shield,
      title: "Rate Limiting",
      description:
        "1,000 requests/minute per key. Burst handling and automatic retry with exponential backoff.",
    },
    {
      icon: Database,
      title: "Batch Operations",
      description:
        "Process multiple records in a single request. Bulk inventory updates, order imports.",
    },
    {
      icon: FileCode,
      title: "OpenAPI Spec",
      description:
        "Complete OpenAPI 3.0 specification. Generate client libraries in any language.",
    },
  ];

  const quickstart = [
    {
      step: 1,
      title: "Get API Key",
      description: "Generate from Settings > Integrations",
    },
    {
      step: 2,
      title: "Make Request",
      description: "Include key in Authorization header",
    },
    {
      step: 3,
      title: "Handle Response",
      description: "Parse JSON response and handle errors",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-b">
        <div className="absolute inset-0 bg-grid-white/[0.05] -z-10" />
        <div className="container-enterprise py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm mb-6">
              <Terminal className="mr-2 h-4 w-4" />
              Developer Documentation
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Build Powerful Integrations
              <span className="text-primary-400 block mt-2">
                With Our REST API
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Complete API reference with 111 endpoints covering every aspect of
              warehouse management. Authentication, webhooks, batch operations,
              and real-time data access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg bg-white text-slate-900 hover:bg-slate-100"
                asChild
              >
                <Link href="/contact?subject=API Access">
                  Get API Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/docs">View Full Docs</Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">111</div>
                <div className="text-sm text-slate-300">API Endpoints</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-slate-300">API Uptime</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  &lt; 200ms
                </div>
                <div className="text-sm text-slate-300">Avg Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              API Endpoints by Category
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              111 endpoints covering all warehouse operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-6 border hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{endpoint.category}</h3>
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                    {endpoint.count}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">API Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enterprise-grade API with security, performance, and developer
              experience in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md border hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
                  <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Quick Start Guide</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get up and running in minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {quickstart.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Code Example */}
            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">
                  Example Request
                </span>
                <span className="text-slate-400 text-sm">cURL</span>
              </div>
              <pre className="text-sm text-slate-300 overflow-x-auto">
                <code>{`curl -X GET https://api.logivox.ai/v1/inventory \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">
                  Example Response
                </span>
                <span className="text-slate-400 text-sm">JSON</span>
              </div>
              <pre className="text-sm text-slate-300 overflow-x-auto">
                <code>{`{
  "data": [
    {
      "id": "inv_123",
      "sku": "WIDGET-001",
      "quantity": 1500,
      "location": "A-01-02",
      "warehouse": "WH-MAIN",
      "updated_at": "2026-01-06T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5420,
    "page": 1,
    "per_page": 50
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6 mb-12">
              <div className="p-4 rounded-lg bg-primary-100 text-primary-600">
                <Lock className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  Secure API access with Bearer token authentication
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Generate unlimited API keys per tenant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Role-based permissions (read-only, read-write, admin)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>IP whitelisting for enhanced security</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic key rotation and expiration</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="p-4 rounded-lg bg-primary-100 text-primary-600">
                <Globe className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">Webhooks</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  Real-time notifications for critical events
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Inventory level changes and stock alerts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Order status updates and fulfillment events</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Shipment tracking and delivery confirmations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic retry with exponential backoff</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Building?
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Get API access and start integrating with LogiVox WMS today. Full
              documentation, code examples, and developer support included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50 text-lg"
                asChild
              >
                <Link href="/contact?subject=API Access">
                  Request API Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg"
                asChild
              >
                <Link href="/docs">Browse Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
