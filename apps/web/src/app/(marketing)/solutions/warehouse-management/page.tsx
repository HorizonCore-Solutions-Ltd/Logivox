"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Warehouse,
  Package,
  MapPin,
  BarChart3,
  Users,
  Truck,
  ClipboardCheck,
  Settings,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  Box,
  Scan,
  Database,
} from "lucide-react";

export default function WarehouseManagementPage() {
  const coreFeatures = [
    {
      icon: Package,
      title: "Inventory Control",
      description:
        "Real-time tracking of all stock with bin-level accuracy, serial number tracking, and batch management.",
    },
    {
      icon: MapPin,
      title: "Location Management",
      description:
        "Optimize warehouse space with zone-based storage, putaway strategies, and dynamic slotting.",
    },
    {
      icon: Scan,
      title: "Barcode Scanning",
      description:
        "Mobile barcode scanning for receiving, picking, packing, and cycle counting operations.",
    },
    {
      icon: ClipboardCheck,
      title: "Order Fulfillment",
      description:
        "Streamline picking, packing, and shipping with wave planning and batch processing.",
    },
    {
      icon: Users,
      title: "Labor Management",
      description:
        "Track productivity, manage shifts, and optimize workforce allocation across warehouse zones.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Live dashboards with KPIs, performance metrics, and actionable insights for continuous improvement.",
    },
  ];

  const modules = [
    {
      title: "Receiving Operations",
      description:
        "Streamline inbound logistics with advanced receiving workflows",
      icon: Truck,
      capabilities: [
        "ASN (Advanced Shipping Notice) integration",
        "Cross-docking automation",
        "Quality inspection checkpoints",
        "Putaway optimization algorithms",
        "Vendor compliance tracking",
        "Blind receiving support",
      ],
    },
    {
      title: "Inventory Management",
      description:
        "Complete visibility and control over all warehouse inventory",
      icon: Database,
      capabilities: [
        "Multi-location inventory tracking",
        "Lot and serial number management",
        "Expiration date (FEFO) tracking",
        "Cycle counting and physical inventory",
        "Min/max replenishment rules",
        "Inventory reservations and allocations",
      ],
    },
    {
      title: "Order Processing",
      description: "Efficient order fulfillment from receipt to shipment",
      icon: ClipboardCheck,
      capabilities: [
        "Wave planning and optimization",
        "Zone and batch picking strategies",
        "Pick-to-light and RF-directed picking",
        "Packing and cartonization",
        "Shipping label generation",
        "Rate shopping and carrier integration",
      ],
    },
    {
      title: "Warehouse Optimization",
      description: "Maximize efficiency and space utilization",
      icon: Settings,
      capabilities: [
        "Slotting optimization based on velocity",
        "Task interleaving for labor efficiency",
        "Route optimization for pickers",
        "Space utilization analytics",
        "ABC analysis for strategic placement",
        "Seasonal demand adjustment",
      ],
    },
  ];

  const benefits = [
    {
      metric: "99.9%",
      description: "Inventory accuracy with real-time tracking",
    },
    {
      metric: "40%",
      description: "Increase in picking productivity",
    },
    {
      metric: "60%",
      description: "Reduction in order processing time",
    },
    {
      metric: "35%",
      description: "Improvement in space utilization",
    },
    {
      metric: "50%",
      description: "Decrease in labor costs through optimization",
    },
    {
      metric: "95%",
      description: "On-time shipping performance",
    },
  ];

  const integrations = [
    "ERP Systems (SAP, Oracle, NetSuite, Microsoft Dynamics)",
    "E-commerce Platforms (Shopify, WooCommerce, Magento)",
    "Shipping Carriers (FedEx, UPS, DHL, USPS)",
    "3PL Provider Networks",
    "EDI and API Integrations",
    "Accounting Software (QuickBooks, Xero)",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Complete Warehouse Management System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Enterprise Warehouse Management Built for Scale
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transform your warehouse operations with our comprehensive WMS
              platform. Real-time inventory control, optimized workflows, and
              powerful analytics to maximize efficiency and reduce costs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Core Warehouse Management Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to run a modern, efficient warehouse operation
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Modules */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Warehouse Operations Suite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Integrated modules covering every aspect of warehouse management
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {modules.map((module, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {module.capabilities.map((capability, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Measurable Business Impact
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our customers see dramatic improvements in key warehouse metrics
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary">
                    {benefit.metric}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Seamless System Integration
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with your existing tools and platforms
            </p>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {integrations.map((integration, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm">{integration}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container-enterprise">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Warehouse?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join hundreds of companies optimizing their warehouse operations
              with LogiVox
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
