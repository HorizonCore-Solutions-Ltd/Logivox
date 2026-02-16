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
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Package,
  Timer,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function DockSchedulingPage() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Dock Scheduling",
      description:
        "Advanced appointment system prevents congestion and optimizes dock door utilization for inbound and outbound operations.",
    },
    {
      icon: Clock,
      title: "Time Slot Management",
      description:
        "Flexible scheduling with configurable time slots, buffer periods, and appointment types (inbound, outbound, cross-dock).",
    },
    {
      icon: Truck,
      title: "Carrier Coordination",
      description:
        "Seamless carrier check-in process with appointment verification and automatic dock assignment upon arrival.",
    },
    {
      icon: MapPin,
      title: "Dock Door Management",
      description:
        "Track dock door availability, capacity, and real-time status across all loading and unloading positions.",
    },
    {
      icon: Timer,
      title: "Dwell Time Monitoring",
      description:
        "Monitor truck turnaround times with automated alerts when vehicles exceed scheduled duration.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Live dashboard showing current dock status, upcoming appointments, and loading/unloading progress.",
    },
  ];

  const benefits = [
    {
      metric: "65%",
      label: "Reduction in Wait Times",
      description:
        "Trucks arrive at pre-scheduled times, eliminating congestion",
    },
    {
      metric: "40%",
      label: "More Throughput",
      description: "Optimized scheduling increases daily shipments processed",
    },
    {
      metric: "85%",
      label: "On-Time Arrivals",
      description: "Carrier coordination improves punctuality and planning",
    },
    {
      metric: "30%",
      label: "Labor Efficiency",
      description: "Receiving teams prepared for scheduled arrivals",
    },
  ];

  const workflow = [
    {
      step: "1. Book Appointment",
      description: "Carrier schedules dock appointment online or via API",
      icon: Calendar,
    },
    {
      step: "2. Arrival Notification",
      description: "Driver checks in at gate, system verifies appointment",
      icon: AlertCircle,
    },
    {
      step: "3. Dock Assignment",
      description:
        "System assigns optimal dock door based on cargo and schedule",
      icon: MapPin,
    },
    {
      step: "4. Loading/Unloading",
      description: "Warehouse team completes operations with progress tracking",
      icon: Package,
    },
    {
      step: "5. Departure",
      description: "Driver checks out, appointment automatically closed",
      icon: CheckCircle2,
    },
  ];

  const appointmentTypes = [
    {
      title: "Inbound Receiving",
      description: "Schedule deliveries from suppliers and carriers",
      features: [
        "ASN/PO matching",
        "Expected delivery time windows",
        "Carrier performance tracking",
        "Receiving team notifications",
      ],
    },
    {
      title: "Outbound Shipping",
      description: "Coordinate customer deliveries and transfers",
      features: [
        "Sales order fulfillment",
        "Loading sequence optimization",
        "Shipping label integration",
        "Carrier pickup scheduling",
      ],
    },
    {
      title: "Cross-Dock Operations",
      description: "Direct transfer without warehouse storage",
      features: [
        "Inbound-to-outbound matching",
        "Real-time shipment coordination",
        "Minimal handling workflows",
        "Fast turnaround optimization",
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            Dock Scheduling Solution
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Optimize Dock Operations with{" "}
            <span className="text-primary">Smart Scheduling</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Eliminate truck congestion, reduce wait times, and maximize dock
            utilization with our intelligent appointment-based scheduling
            system.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/contact">
                Schedule a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Measurable Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See real results from optimized dock scheduling
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {benefit.metric}
                  </div>
                  <CardTitle className="text-lg">{benefit.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Core Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need for efficient dock door management
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 5-step process from appointment to departure
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.step}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Types Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Appointment Types</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Support for all dock operations
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {appointmentTypes.map((type, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integration Note */}
      <section className="bg-primary/5 py-16">
        <div className="container">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Looking for Full Yard Management?</CardTitle>
              </div>
              <CardDescription>
                Our Dock Scheduling solution focuses on appointment-based dock
                door coordination for receiving and shipping operations. For
                comprehensive yard management including GPS tracking, autonomous
                spotters, trailer parking, and security patrols, please contact
                us about our Enterprise Yard Management System available as a
                separate solution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/contact">
                  Inquire About Enterprise Yard Management
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">
            Ready to Optimize Your Dock Operations?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of warehouses reducing wait times and improving
            efficiency with smart dock scheduling.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/contact">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/solutions/warehouse-management">
                Explore All WMS Solutions
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
