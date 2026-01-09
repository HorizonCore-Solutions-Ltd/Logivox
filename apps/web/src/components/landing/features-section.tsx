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
      title: "Voice Operations",
      description:
        "Hands-free warehouse operations with voice commands. Natural language processing, multi-language support, and real-time voice guidance.",
      icon: Users,
      highlights: ["Hands-free picking", "Voice-directed tasks", "Multi-language"],
    },
    {
      title: "Digital Twin & Computer Vision",
      description:
        "Real-time digital twin of your warehouse. Computer vision for quality control, space utilization, and predictive maintenance.",
      icon: ScanBarcode,
      highlights: ["Digital twin", "Computer vision", "Predictive analytics"],
    },
    {
      title: "Wave & Batch Picking",
      description:
        "Advanced wave management. Multiple picking modes (single, batch, zone, cluster), route optimization, and workload balancing.",
      icon: Package,
      highlights: ["4 picking modes", "Route optimization", "Workload balancing"],
    },
    {
      title: "Assembly & Kitting",
      description:
        "Complete assembly operations. Bill of materials, component tracking, assembly instructions, and quality verification.",
      icon: Boxes,
      highlights: ["BOM management", "Assembly tracking", "Quality checks"],
    },
    {
      title: "Transportation & Shipping",
      description:
        "Multi-carrier shipping with rate shopping. Load optimization, route planning, and real-time tracking integration.",
      icon: Truck,
      highlights: ["Multi-carrier", "Rate shopping", "Load optimization"],
    },
    {
      title: "Sustainability Tracking",
      description:
        "Carbon footprint monitoring, waste reduction analytics, and ESG reporting for compliance and sustainability goals.",
      icon: BarChart3,
      highlights: ["Carbon tracking", "Waste analytics", "ESG reporting"],
    },
    {
      title: "Labor Management",
      description:
        "Workforce optimization with time tracking, performance metrics, gamification, and automated task assignment.",
      icon: Users,
      highlights: ["Time tracking", "Performance metrics", "Gamification"],
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container-enterprise">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="mb-4">
            Everything You Need
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Complete Warehouse Management
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              In One Simple Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From voice-enabled picking to AI-powered optimization, LogiVox delivers
            every feature you need to run a world-class warehouse operation.
          </p>
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

        {/* PlBuilt for Your Success
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade reliability with bank-level security you can trust
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.99%</div>
              <div className="text-sm font-medium">Always Available</div>
              <div className="text-xs text-muted-foreground">Round-the-clock</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">Instant</div>
              <div className="text-sm font-medium">Lightning Fast</div>
              <div className="text-xs text-muted-foreground">Global performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">Secure</div>
              <div className="text-sm font-medium">Bank-Level</div>
              <div className="text-xs text-muted-foreground">SOC 2 & ISO 27001</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm font-medium">Support</div>
              <div className="text-xs text-muted-foreground">Always here to help</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-card/50 rounded-lg p-6">
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Bank-Level Security</h4>
              <p className="text-sm text-muted-foreground">
                Your data is protected with the same security standards used by financial institutions.
                Automatic threat detection keeps your warehouse safe 24/7.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Real-Time Insights</h4>
              <p className="text-sm text-muted-foreground">
                See exactly what's happening in your warehouse right now. Live dashboards,
                smart forecasting, and custom reports give you complete visibility.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Smart Automation</h4>
              <p className="text-sm text-muted-foreground">
                Let AI handle the boring stuff. Automatic reordering, voice-guided picking,
                smart route planning, and predictive maintenance keep everything running smoothly.
              </p>primary mb-3" />
              <h4 className="font-semibold mb-2">Military-Grade Security</h4>
              <p className="text-sm text-muted-foreground">
                Rate limiting, DDoS protection, SQL/XSS/CSRF prevention, IP blocklist,
                and automated threat detection
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Live dashboards, predictive forecasting, AI-powered insights,
                and custom reporting across all modules
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">AI & Automation</h4>
              <p className="text-sm text-muted-foreground">
                Autonomous reordering, predictive maintenance, voice operations,
                computer vision, and machine learning optimization
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
            Connect LogiVox to your existing systems through our comprehensive API
            and pre-built integrations
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
