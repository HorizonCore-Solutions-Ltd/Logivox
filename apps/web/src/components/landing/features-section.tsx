"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Truck,
  ClipboardCheck,
  Users,
  BarChart3,
  Boxes,
  ScanBarcode,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export function FeaturesSection() {
  const coreModules = [
    {
      title: "Quality Management",
      description:
        "Never ship defective products again. Track issues from detection to resolution with automated workflows and root cause analysis.",
      badge: "Complete System",
      icon: ClipboardCheck,
      color: "from-blue-500/10 to-blue-600/10",
      features: [
        "Catch defects early",
        "Track financial impact",
        "Automated workflows",
        "Prevent repeat issues",
        "Smart suggestions",
        "Supplier scorecards",
      ],
    },
    {
      title: "Quality Control & Inspection",
      description:
        "Ensure every product meets your standards. Automated inspections with computer vision and real-time defect tracking.",
      badge: "Industry-Leading",
      icon: ScanBarcode,
      color: "from-green-500/10 to-green-600/10",
      features: [
        "Computer vision inspection",
        "Statistical process control",
        "Real-time defect tracking",
        "Custom inspection rules",
        "Automated workflows",
        "Compliance reporting",
      ],
    },
    {
      title: "Returns Processing",
      description:
        "Turn returns into opportunities. Automated grading, instant restocking, and seamless customer refunds.",
      badge: "Comprehensive",
      icon: Package,
      color: "from-purple-500/10 to-purple-600/10",
      features: [
        "Smart return tracking",
        "Automatic grading",
        "Fast restocking",
        "Instant refunds",
        "Return analytics",
        "Customer portal",
      ],
    },
    {
      title: "Receiving & Putaway",
      description:
        "Get inventory in fast and organized. Smart location suggestions and quality checks as products arrive.",
      badge: "Advanced",
      icon: Truck,
      color: "from-orange-500/10 to-orange-600/10",
      features: [
        "Fast receiving",
        "Cross-docking",
        "Quality inspections",
        "Smart putaway",
        "Batch processing",
        "Label printing",
      ],
    },
    {
      title: "Inventory Management",
      description:
        "Always know what you have and where it is. Real-time tracking with automatic reordering when stock runs low.",
      badge: "Real-Time",
      icon: Boxes,
      color: "from-cyan-500/10 to-cyan-600/10",
      features: [
        "Live inventory tracking",
        "Cycle counting",
        "ABC analysis",
        "Auto-reordering",
        "Demand forecasting",
        "Multi-location support",
      ],
    },
    {
      title: "Smart Optimization",
      description:
        "Let AI do the heavy lifting. Automatically optimize routes, space, and workload for maximum efficiency.",
      badge: "AI-Powered",
      icon: BarChart3,
      color: "from-pink-500/10 to-pink-600/10",
      features: [
        "Load optimization",
        "Smart slotting",
        "Route planning",
        "Labor balancing",
        "Wave optimization",
        "Container optimization",
      ],
    },
  ];

  const advancedCapabilities = [
    {
      title: "Predictive Ops & Anomaly Defense",
      description:
        "Real-time anomaly detection on pick/pack/ship signals with auto-alerts and blast-radius rollback to keep SLAs safe.",
      icon: BarChart3,
      highlights: ["Auto-alerts", "Rollback guardrails", "SLO health"],
    },
    {
      title: "Offline & Edge Resilience",
      description:
        "Voice + scanning that keep working on the floor when Wi‑Fi drops, with smart sync once connectivity returns.",
      icon: Zap,
      highlights: ["Offline picks", "Edge sync", "Low-latency"],
    },
    {
      title: "Copilot for SOPs & Training",
      description:
        "Tenant-aware copilot that pulls your SOPs and work instructions inline so teams execute perfectly, first time.",
      icon: CheckCircle,
      highlights: ["RAG over SOPs", "In-line help", "Fewer errors"],
    },
    {
      title: "Zero-Trust Everywhere",
      description:
        "Strict role-based permissions across sites, unalterable activity logs, and reliable automated alerts to guarantee compliance and operational security.",
      icon: Shield,
      highlights: ["Fine-grain scopes", "Audit trails", "Automated compliance"],
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-muted/30 to-background"
    >
      <div className="container-enterprise">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="mb-4">
            🏆 Industry-Leading Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything Competitors Charge Extra For
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Included in Every Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Replace 5+ different tools with one complete platform. Voice
            operations, AI optimization, quality management, and security
            training—competitors charge $500-2,000+ extra for these.
          </p>
          <div className="mt-6 flex justify-center items-center gap-8 text-sm font-medium">
            <div className="text-green-600">
              ✅ Voice Commands (Usually $200/month)
            </div>
            <div className="text-green-600">
              ✅ Label Designer (Usually $150/month)
            </div>
            <div className="text-green-600">
              ✅ Security Training (Usually $40/user/month)
            </div>
          </div>
        </div>

        {/* Core modules grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Core Warehouse Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreModules.map((module) => (
              <Card
                key={module.title}
                className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${module.color}`}
                />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 gap-2">
                    {module.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-1.5 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced capabilities */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Advanced Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedCapabilities.map((capability) => (
              <Card
                key={capability.title}
                className="hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <capability.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{capability.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {capability.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {capability.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Built for your success */}
        <div className="mt-16 space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold">Built for Your Success</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise reliability with bank-level security and automation
              that keeps every shift moving.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: "99.99%",
                label: "Always Available",
                helper: "SLO-backed uptime",
              },
              {
                value: "Instant",
                label: "Lightning Fast",
                helper: "Global performance",
              },
              {
                value: "Secure",
                label: "Bank-Level",
                helper: "SOC 2 & ISO 27001",
              },
              {
                value: "24/7",
                label: "Support",
                helper: "Always here to help",
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {item.value}
                </div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  {item.helper}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/50 rounded-lg p-6">
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Bank-Level Security</h4>
              <p className="text-sm text-muted-foreground">
                Rate limiting, DDoS protection, SQL/XSS/CSRF prevention, IP
                controls, and automated threat detection.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Real-Time Insights</h4>
              <p className="text-sm text-muted-foreground">
                Live dashboards, predictive forecasting, AI-powered insights,
                and custom reporting across all modules.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Smart Automation</h4>
              <p className="text-sm text-muted-foreground">
                Automatic reordering, voice-guided picking, smart route
                planning, and predictive maintenance keep every shift on track.
              </p>
            </div>
          </div>
        </div>

        {/* Integration ecosystem */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Integrates with Everything
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect LogiVox to your existing systems through our comprehensive
            API and pre-built integrations
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Shopify",
              "WooCommerce",
              "SAP",
              "Oracle",
              "QuickBooks",
              "NetSuite",
              "FedEx",
              "UPS",
              "USPS",
              "DHL",
              "Salesforce",
              "Microsoft Dynamics",
            ].map((integration) => (
              <div
                key={integration}
                className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-sm">{integration}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/platform/integrations"
              className="inline-flex items-center text-primary hover:underline font-medium"
            >
              View all integrations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
