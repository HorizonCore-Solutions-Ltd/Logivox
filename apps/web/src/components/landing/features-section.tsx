"use client";

import * as React from "react";
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
} from "lucide-react";

export function FeaturesSection() {
  const problems = [
    {
      problem: "Picking the wrong items",
      solution: "Guided picking with barcode verification",
      impact: "95% fewer errors",
      icon: Package,
      color: "from-blue-500/10 to-blue-600/10",
    },
    {
      problem: "Slow order fulfillment",
      solution: "Smart wave picking & batch processing",
      impact: "3x faster shipping",
      icon: Boxes,
      color: "from-green-500/10 to-green-600/10",
    },
    {
      problem: "High labor costs",
      solution: "Optimized workflows & productivity tracking",
      impact: "40% cost reduction",
      icon: Users,
      color: "from-purple-500/10 to-purple-600/10",
    },
    {
      problem: "Quality control issues",
      solution: "Automated inspection workflows",
      impact: "Zero defects shipped",
      icon: ClipboardCheck,
      color: "from-orange-500/10 to-orange-600/10",
    },
  ];

  const capabilities = [
    {
      title: "Receive & Store",
      description:
        "Get inventory in fast with guided putaway and smart location suggestions.",
      benefits: [
        "Barcode scanning",
        "Quality checks",
        "Auto-location assignment",
        "Batch receiving",
      ],
    },
    {
      title: "Pick & Pack",
      description:
        "Eliminate errors with guided picking paths and intelligent packing recommendations.",
      benefits: [
        "4 picking modes",
        "Route optimization",
        "Smart cartonization",
        "Pack verification",
      ],
    },
    {
      title: "Ship & Track",
      description:
        "Compare carrier rates automatically and provide customers with real-time tracking.",
      benefits: [
        "Rate shopping",
        "Auto-label generation",
        "Multi-carrier support",
        "Tracking updates",
      ],
    },
    {
      title: "Manage & Grow",
      description:
        "See exactly what's working with real-time dashboards and actionable insights.",
      benefits: [
        "Live inventory view",
        "Performance metrics",
        "Demand forecasting",
        "ABC analysis",
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-2">
            What You Get
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need to run
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              a professional warehouse
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stop juggling spreadsheets and manual processes. LogiVox gives you
            complete control over your warehouse operations—from the moment
            inventory arrives to the second it ships.
          </p>
        </div>

        {/* Problem-solution cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {problems.map((item) => (
            <Card
              key={item.problem}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.color}`}
              />
              <CardHeader className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  <span className="line-through text-muted-foreground text-sm block mb-1">
                    {item.problem}
                  </span>
                  <span className="text-foreground">{item.solution}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {item.impact}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {capabilities.map((capability) => (
            <Card
              key={capability.title}
              className="border-2 hover:border-primary/20 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{capability.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {capability.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-3">
                  {capability.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional value props */}
        <div className="bg-card border-2 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                <ScanBarcode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Mobile-First Design</h3>
              <p className="text-sm text-muted-foreground">
                Your team works on their phones. So does LogiVox—with full
                barcode scanning support.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Built-In Shipping</h3>
              <p className="text-sm text-muted-foreground">
                Compare rates and print labels without leaving the platform.
                Save on every shipment.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Know Your Numbers</h3>
              <p className="text-sm text-muted-foreground">
                Real-time insights into inventory levels, order status, and team
                productivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
