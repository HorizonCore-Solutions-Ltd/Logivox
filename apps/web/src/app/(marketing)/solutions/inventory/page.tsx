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
  Package,
  BarChart3,
  RefreshCcw,
  AlertCircle,
  Scan,
  Database,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Zap,
  Search,
  FileText,
  Calendar,
  Box,
} from "lucide-react";

export default function InventoryManagementPage() {
  const features = [
    {
      icon: Package,
      title: "Real-Time Tracking",
      description:
        "Live inventory visibility across all locations with instant updates on stock levels and movements.",
    },
    {
      icon: Scan,
      title: "Barcode & RFID",
      description:
        "Support for barcode scanning, RFID tags, and serial number tracking for complete traceability.",
    },
    {
      icon: RefreshCcw,
      title: "Cycle Counting",
      description:
        "Continuous accuracy verification without disrupting operations, improving inventory precision to 99.9%.",
    },
    {
      icon: AlertCircle,
      title: "Low Stock Alerts",
      description:
        "Automated notifications when inventory reaches reorder points with smart replenishment suggestions.",
    },
    {
      icon: Database,
      title: "Multi-Location Management",
      description:
        "Track inventory across warehouses, stores, and distribution centers with centralized control.",
    },
    {
      icon: BarChart3,
      title: "ABC Analysis",
      description:
        "Automatic classification of inventory by value and velocity for optimized storage and handling.",
    },
  ];

  const capabilities = [
    {
      title: "Stock Level Management",
      description: "Complete visibility and control over inventory quantities",
      icon: Package,
      features: [
        "Real-time stock updates across all locations",
        "Bin-level tracking and location management",
        "Lot and batch tracking with expiration dates",
        "Serial number management for unique items",
        "Min/max reorder point automation",
        "Safety stock calculations",
        "Reserved inventory and allocations",
        "Available-to-promise (ATP) calculations",
      ],
    },
    {
      title: "Cycle Counting & Physical Inventory",
      description: "Maintain accuracy through continuous verification",
      icon: RefreshCcw,
      features: [
        "Dynamic cycle count task generation",
        "ABC-based counting frequency",
        "Blind counting for unbiased verification",
        "Mobile app for count execution",
        "Variance analysis and investigation",
        "Automatic inventory adjustments",
        "Count history and audit trails",
        "Annual physical inventory support",
      ],
    },
    {
      title: "Inventory Valuation & Costing",
      description: "Accurate financial tracking and reporting",
      icon: FileText,
      features: [
        "FIFO, LIFO, and weighted average costing",
        "Landed cost allocation",
        "Inventory aging reports",
        "Dead stock identification",
        "Carrying cost calculations",
        "Write-off and obsolescence tracking",
        "Inventory turnover metrics",
        "Financial system integration",
      ],
    },
    {
      title: "Replenishment Automation",
      description: "Smart restocking to prevent stockouts",
      icon: TrendingDown,
      features: [
        "Automated reorder point calculations",
        "Demand-based replenishment",
        "Seasonal adjustment factors",
        "Lead time variability handling",
        "Multi-echelon inventory optimization",
        "Purchase order generation",
        "Vendor selection optimization",
        "Replenishment performance analytics",
      ],
    },
  ];

  const trackingFeatures = [
    {
      title: "Lot Tracking",
      description: "Complete traceability for lot-controlled items",
    },
    {
      title: "Serial Number Management",
      description: "Individual item tracking from receipt to sale",
    },
    {
      title: "Expiration Date (FEFO)",
      description: "First-Expired-First-Out for perishable goods",
    },
    {
      title: "Batch Management",
      description: "Production batch tracking and quality control",
    },
    {
      title: "Catch Weight",
      description: "Variable weight item management",
    },
    {
      title: "Kit & Bundle Tracking",
      description: "Assembled product component visibility",
    },
  ];

  const benefits = [
    {
      metric: "99.9%",
      description: "Inventory accuracy with cycle counting",
    },
    {
      metric: "35%",
      description: "Reduction in excess inventory",
    },
    {
      metric: "60%",
      description: "Decrease in stockout incidents",
    },
    {
      metric: "50%",
      description: "Faster stock reconciliation",
    },
    {
      metric: "25%",
      description: "Improvement in inventory turnover",
    },
    {
      metric: "Real-time",
      description: "Inventory visibility across all channels",
    },
  ];

  const integrations = [
    "ERP systems (SAP, Oracle, NetSuite)",
    "Accounting software (QuickBooks, Xero)",
    "E-commerce platforms (Shopify, WooCommerce)",
    "Point of Sale (POS) systems",
    "Supply chain management systems",
    "EDI for supplier communication",
    "Business intelligence tools",
    "Financial reporting systems",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Advanced Inventory Control
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Real-Time Inventory Management for Perfect Stock Control
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Achieve 99.9% inventory accuracy with real-time tracking,
              automated cycle counting, and smart replenishment. Reduce
              stockouts by 60% and excess inventory by 35% with our
              comprehensive inventory management system.
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
              Comprehensive Inventory Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for accurate, efficient inventory control
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
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

      {/* Detailed Capabilities */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Inventory Management Suite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              End-to-end capabilities for every inventory need
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {capabilities.map((capability, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <capability.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {capability.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {capability.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {capability.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking Features */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Advanced Tracking Capabilities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete traceability for all inventory types
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trackingFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Box className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Proven Inventory Improvements
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Measurable results from optimized inventory management
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
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Seamless System Integration
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with your existing business systems
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
              Ready for Perfect Inventory Control?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join companies achieving 99.9% accuracy and eliminating stockouts
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
