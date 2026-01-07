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
  Truck,
  Route,
  MapPin,
  DollarSign,
  BarChart3,
  Navigation,
  Package,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  Fuel,
  Calendar,
  Users,
} from "lucide-react";

export default function TransportationPage() {
  const features = [
    {
      icon: Route,
      title: "Load Planning",
      description:
        "3D load optimization considering weight, dimensions, and stacking constraints for maximum cube utilization.",
    },
    {
      icon: Navigation,
      title: "Route Optimization",
      description:
        "AI-powered routing that minimizes miles, fuel costs, and delivery time while meeting time windows.",
    },
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description:
        "GPS tracking of all shipments with ETA calculations and proactive delay notifications.",
    },
    {
      icon: DollarSign,
      title: "Freight Cost Management",
      description:
        "Rate shopping, carrier bidding, and freight audit to ensure lowest transportation costs.",
    },
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description:
        "Automated dock appointment booking and coordination with carriers and customers.",
    },
    {
      icon: BarChart3,
      title: "Transportation Analytics",
      description:
        "Comprehensive metrics on costs, on-time performance, carrier KPIs, and optimization opportunities.",
    },
  ];

  const capabilities = [
    {
      title: "Load Optimization",
      description: "Maximize trailer cube and weight utilization",
      icon: Package,
      features: [
        "3D bin packing algorithms",
        "Weight distribution calculations",
        "Fragile item protection rules",
        "Pallet stacking constraints",
        "Multi-stop load planning",
        "Consolidation opportunities",
        "Container load plans",
        "Visual load diagrams",
      ],
    },
    {
      title: "Route Planning",
      description: "Intelligent routing for efficient deliveries",
      icon: Route,
      features: [
        "Multi-stop route optimization",
        "Time window compliance",
        "Traffic pattern consideration",
        "Driver hours of service (HOS)",
        "Fuel efficiency routing",
        "Toll cost avoidance",
        "Delivery sequence optimization",
        "Dynamic route adjustment",
      ],
    },
    {
      title: "Carrier Management",
      description: "Complete carrier relationship and performance tracking",
      icon: Truck,
      features: [
        "Carrier scorecard and ratings",
        "Performance analytics (on-time, claims)",
        "Rate negotiation support",
        "Carrier capacity planning",
        "Automated load tendering",
        "Freight bill audit and payment",
        "Insurance verification",
        "Compliance tracking (DOT, safety)",
      ],
    },
    {
      title: "Freight Management",
      description: "End-to-end freight lifecycle management",
      icon: DollarSign,
      features: [
        "LTL, FTL, and parcel support",
        "Freight rate shopping",
        "Bill of lading generation",
        "Proof of delivery (POD)",
        "Claims management",
        "Accessorial charge validation",
        "Freight class determination",
        "Shipping document management",
      ],
    },
  ];

  const workflow = [
    {
      step: "Order Release",
      description:
        "Orders ready for shipment released to transportation planning",
      time: "Day 0",
      icon: Package,
    },
    {
      step: "Load Planning",
      description: "System optimizes load configuration and carrier selection",
      time: "+1 hour",
      icon: Route,
    },
    {
      step: "Carrier Assignment",
      description:
        "Automated tendering to selected carrier with acceptance tracking",
      time: "+2 hours",
      icon: Truck,
    },
    {
      step: "Pickup Execution",
      description: "Carrier picks up shipment with BOL and load photos",
      time: "Day 1",
      icon: CheckCircle2,
    },
    {
      step: "In-Transit Tracking",
      description:
        "Real-time GPS tracking with ETA updates and exception alerts",
      time: "Day 1-3",
      icon: Navigation,
    },
    {
      step: "Delivery & POD",
      description:
        "Delivery completion with proof of delivery and customer notification",
      time: "Day 3",
      icon: MapPin,
    },
  ];

  const benefits = [
    {
      metric: "25%",
      description: "Reduction in transportation costs",
    },
    {
      metric: "98%",
      description: "On-time delivery performance",
    },
    {
      metric: "35%",
      description: "Improvement in load utilization",
    },
    {
      metric: "40%",
      description: "Decrease in empty miles",
    },
    {
      metric: "50%",
      description: "Faster route planning time",
    },
    {
      metric: "Real-time",
      description: "Shipment visibility and tracking",
    },
  ];

  const modes = [
    {
      mode: "Truckload (FTL)",
      description: "Full trailer dedicated shipments",
      use: "Large volume, single destination",
    },
    {
      mode: "Less-Than-Truckload (LTL)",
      description: "Consolidated multi-customer shipments",
      use: "Smaller shipments, cost optimization",
    },
    {
      mode: "Parcel",
      description: "Small package shipping via FedEx, UPS, USPS",
      use: "E-commerce, small orders",
    },
    {
      mode: "Intermodal",
      description: "Rail and truck combination shipping",
      use: "Long distance, cost savings",
    },
    {
      mode: "Air Freight",
      description: "Expedited air shipping",
      use: "Time-sensitive, high-value items",
    },
    {
      mode: "Ocean Freight",
      description: "International container shipping",
      use: "Import/export, bulk quantities",
    },
  ];

  const integrations = [
    "ELD (Electronic Logging Device) systems",
    "GPS tracking providers (Geotab, Samsara)",
    "Carrier EDI (204/214 transactions)",
    "Load boards (DAT, Truckstop.com)",
    "Fuel card providers",
    "ERP systems for order data",
    "TMS marketplace integrations",
    "Telematics platforms",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Transportation Management System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Optimize Shipping with Intelligent Transportation Management
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Reduce transportation costs by 25% with smart load planning, route
              optimization, and carrier management. Achieve 98% on-time delivery
              with real-time tracking and proactive exception management.
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
              Complete Transportation Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to manage your transportation network
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
              Comprehensive TMS Capabilities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              End-to-end transportation management functionality
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

      {/* Workflow */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Transportation Workflow
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From planning to delivery in an optimized process
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
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{item.step}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Badge variant="secondary">{item.time}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transportation Modes */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Multi-Modal Transportation Support
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage all transportation modes in one system
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modes.map((mode, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Truck className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">{mode.mode}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode.description}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {mode.use}
                  </Badge>
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
              Transportation Performance Improvements
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Proven results from optimized transportation management
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
              Transportation Ecosystem Integration
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with carriers, tracking systems, and logistics providers
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
              Transform Your Transportation Operations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join companies reducing costs by 25% and achieving 98% on-time
              delivery with LogiVox
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
