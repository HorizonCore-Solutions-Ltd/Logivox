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
  ClipboardCheck,
  Package,
  Scan,
  Box,
  Truck,
  CheckCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  MapPin,
  PackageCheck,
  Boxes,
  ShoppingCart,
} from "lucide-react";

export default function FulfillmentPage() {
  const features = [
    {
      icon: ClipboardCheck,
      title: "Wave Planning",
      description:
        "Intelligent batching and wave creation based on priority, destination, and item characteristics.",
    },
    {
      icon: Scan,
      title: "Multi-Modal Picking",
      description:
        "Support for discrete, batch, zone, and wave picking strategies with RF-directed workflows.",
    },
    {
      icon: Package,
      title: "Smart Packing",
      description:
        "Automated cartonization, packing instructions, and multi-package order handling.",
    },
    {
      icon: Truck,
      title: "Shipping Integration",
      description:
        "Rate shopping, label generation, and carrier integration for all major shipping providers.",
    },
    {
      icon: CheckCircle,
      title: "Quality Control",
      description:
        "Built-in verification steps to ensure 99.9% order accuracy before shipment.",
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description:
        "Real-time productivity metrics, KPIs, and performance dashboards for continuous improvement.",
    },
  ];

  const pickingMethods = [
    {
      title: "Discrete Picking",
      description:
        "One order at a time for high-priority or specialized fulfillment",
      icon: ShoppingCart,
      benefits: [
        "Highest order accuracy (99.9%)",
        "Ideal for urgent or VIP orders",
        "Simple training requirements",
        "Best for low-volume operations",
        "Flexible for variable order sizes",
        "Easy exception handling",
      ],
    },
    {
      title: "Batch Picking",
      description: "Multiple orders picked simultaneously for efficiency",
      icon: Boxes,
      benefits: [
        "40% increase in pick rates",
        "Reduced travel time per order",
        "Optimized for similar items",
        "Ideal for e-commerce fulfillment",
        "Sorting and consolidation support",
        "Put-to-light integration",
      ],
    },
    {
      title: "Zone Picking",
      description: "Warehouse divided into zones with dedicated pickers",
      icon: MapPin,
      benefits: [
        "Picker specialization by zone",
        "Reduced congestion in aisles",
        "Faster pick times per zone",
        "Conveyor integration support",
        "Scalable for high volume",
        "Parallel processing capability",
      ],
    },
    {
      title: "Wave Picking",
      description: "Orders grouped into waves for optimized execution",
      icon: ClipboardCheck,
      benefits: [
        "Maximum warehouse efficiency",
        "Scheduled pick windows",
        "Load balancing across workforce",
        "Carrier cutoff optimization",
        "Priority-based wave creation",
        "Resource optimization",
      ],
    },
  ];

  const packingFeatures = [
    {
      title: "Automated Cartonization",
      description:
        "Intelligent box selection based on item dimensions and weight",
    },
    {
      title: "Packing Instructions",
      description: "Visual guides for optimal item placement and protection",
    },
    {
      title: "Multi-Package Orders",
      description: "Automatic order splitting across multiple boxes",
    },
    {
      title: "Gift Wrapping",
      description: "Special handling instructions and gift message support",
    },
    {
      title: "Fragile Item Handling",
      description: "Special packaging requirements and cushioning alerts",
    },
    {
      title: "Packing Verification",
      description: "Scan verification to prevent shipping errors",
    },
  ];

  const workflow = [
    {
      step: "Order Import",
      description:
        "Orders automatically imported from e-commerce, ERP, or marketplace",
      icon: ShoppingCart,
    },
    {
      step: "Wave Planning",
      description:
        "System creates optimized pick waves based on priority and capacity",
      icon: ClipboardCheck,
    },
    {
      step: "Pick Execution",
      description:
        "RF-directed picking with barcode verification at each location",
      icon: Scan,
    },
    {
      step: "Quality Check",
      description: "Optional QC inspection for high-value or flagged orders",
      icon: CheckCircle,
    },
    {
      step: "Packing Station",
      description: "Cartonization, packing, and shipping label generation",
      icon: Package,
    },
    {
      step: "Shipment",
      description: "Carrier pickup with tracking information sent to customer",
      icon: Truck,
    },
  ];

  const benefits = [
    {
      metric: "99.9%",
      description: "Order accuracy with verification steps",
    },
    {
      metric: "60%",
      description: "Faster order processing times",
    },
    {
      metric: "40%",
      description: "Increase in picking productivity",
    },
    {
      metric: "50%",
      description: "Reduction in shipping costs via rate shopping",
    },
    {
      metric: "35%",
      description: "Decrease in labor costs per order",
    },
    {
      metric: "Same-Day",
      description: "Fulfillment capability for urgent orders",
    },
  ];

  const carriers = [
    "FedEx (Ground, Express, International)",
    "UPS (Ground, Air, Worldwide)",
    "USPS (Priority, First Class, International)",
    "DHL (Express, eCommerce)",
    "Amazon Shipping",
    "Regional carriers (OnTrac, Lasership)",
    "Freight carriers (LTL, FTL)",
    "Custom carrier API integration",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Advanced Order Fulfillment
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Streamlined Picking, Packing, and Shipping Operations
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Optimize your entire fulfillment process with intelligent wave
              planning, multi-modal picking strategies, and automated shipping
              integration. Achieve 99.9% accuracy and 60% faster processing
              times.
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
              Complete Fulfillment Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for efficient order processing
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

      {/* Picking Methods */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Multi-Modal Picking Strategies
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the right picking method for your operation
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {pickingMethods.map((method, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <method.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{method.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {method.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {method.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Fulfillment Workflow
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              End-to-end order processing from import to shipment
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {workflow.map((item, index) => (
                <div
                  key={index}
                  className="relative mb-8 flex items-start space-x-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                      <item.icon className="h-6 w-6" />
                    </div>
                    {index < workflow.length - 1 && (
                      <div className="mt-2 h-16 w-0.5 bg-primary/20" />
                    )}
                  </div>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold">{item.step}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packing Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Smart Packing Station Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Intelligent packing for optimal shipping efficiency
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packingFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <PackageCheck className="h-8 w-8 text-primary mb-3" />
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
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Fulfillment Performance Metrics
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Proven improvements in order fulfillment efficiency
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

      {/* Carrier Integration */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Carrier Integration & Rate Shopping
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with all major shipping carriers
            </p>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {carriers.map((carrier, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-sm">{carrier}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t bg-green-50 dark:bg-green-950/20 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Results from Real E-Commerce Leaders
            </h2>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-8 pb-6">
              <p className="text-lg italic mb-6">
                "We're now fulfilling 8,000+ orders daily with 99.9% accuracy.
                Our pick rates jumped from 45/hour to 61/hour (+35%). Same-day
                shipping rate increased from 65% to 92%. LogiVox made all the
                difference."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Jennifer Martinez</p>
                  <p className="text-sm text-muted-foreground">
                    VP Operations, RetailFlow Inc
                  </p>
                </div>
                <Badge className="bg-green-600">61 Orders/Hour</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container-enterprise">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Optimize Your Order Fulfillment
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join companies achieving 99.9% accuracy and same-day shipping with
              LogiVox
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
