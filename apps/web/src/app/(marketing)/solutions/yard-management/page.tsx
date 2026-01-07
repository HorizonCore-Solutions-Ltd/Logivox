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
  MapPin,
  Truck,
  Clock,
  Navigation,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Package,
  Timer,
  MapPinned,
  ParkingCircle,
  Building,
} from "lucide-react";

export default function YardManagementPage() {
  const features = [
    {
      icon: MapPin,
      title: "Smart Parking Assignment",
      description:
        "AI-powered algorithms automatically assign optimal parking spots based on delivery priority and cargo type.",
    },
    {
      icon: Calendar,
      title: "Dock Scheduling",
      description:
        "Advanced appointment system prevents congestion and optimizes dock door utilization.",
    },
    {
      icon: Navigation,
      title: "Real-Time Vehicle Tracking",
      description:
        "GPS tracking and geofencing for complete visibility of all vehicles in your yard.",
    },
    {
      icon: Timer,
      title: "Dwell Time Management",
      description:
        "Monitor and minimize vehicle wait times with automated alerts and priority handling.",
    },
    {
      icon: ParkingCircle,
      title: "Yard Location Management",
      description:
        "Organize docks, staging areas, parking spots, and maintenance bays with precision.",
    },
    {
      icon: BarChart3,
      title: "Yard Analytics",
      description:
        "Comprehensive metrics on utilization, turnaround times, and operational efficiency.",
    },
  ];

  const yardTypes = [
    {
      title: "Loading Docks",
      description: "Optimize outbound shipment operations",
      icon: Truck,
      capabilities: [
        "Multiple trailer size accommodations",
        "Priority-based dock assignment",
        "Automated loading sequence planning",
        "Real-time dock availability tracking",
        "Cross-dock optimization",
        "Door sensor integration",
      ],
    },
    {
      title: "Receiving Docks",
      description: "Streamline inbound delivery processing",
      icon: Package,
      capabilities: [
        "Temperature-controlled dock zones",
        "ASN matching and verification",
        "Blind receiving support",
        "Quality inspection integration",
        "Putaway workflow coordination",
        "Carrier compliance tracking",
      ],
    },
    {
      title: "Staging Areas",
      description: "Temporary holding and overflow management",
      icon: MapPinned,
      capabilities: [
        "Dynamic capacity management",
        "Priority queue organization",
        "Quick turnaround optimization",
        "Overflow routing algorithms",
        "Trailer pool management",
        "Cross-dock staging coordination",
      ],
    },
    {
      title: "Long-Term Parking",
      description: "Efficient trailer and equipment storage",
      icon: ParkingCircle,
      capabilities: [
        "Chassis and trailer tracking",
        "Storage cost allocation",
        "Automated yard moves",
        "Equipment condition monitoring",
        "Retrieval time optimization",
        "Security patrol integration",
      ],
    },
  ];

  const workflow = [
    {
      step: "Gate Entry",
      description: "Security clears vehicle and captures documentation",
      time: "0 min",
      icon: Building,
    },
    {
      step: "Smart Assignment",
      description: "Algorithm assigns optimal parking or dock location",
      time: "< 1 min",
      icon: Zap,
    },
    {
      step: "Yard Navigation",
      description: "Driver receives directions to assigned location",
      time: "2-5 min",
      icon: Navigation,
    },
    {
      step: "Loading/Unloading",
      description: "Warehouse operations with real-time progress tracking",
      time: "30-90 min",
      icon: Package,
    },
    {
      step: "Departure",
      description: "Automated exit processing and gate clearance",
      time: "< 2 min",
      icon: CheckCircle2,
    },
  ];

  const benefits = [
    {
      metric: "45%",
      description: "Reduction in average dwell time",
    },
    {
      metric: "60%",
      description: "Improvement in dock utilization",
    },
    {
      metric: "35%",
      description: "Decrease in yard congestion",
    },
    {
      metric: "90%",
      description: "On-time appointment adherence",
    },
    {
      metric: "50%",
      description: "Faster check-in/check-out processing",
    },
    {
      metric: "99%",
      description: "Accurate vehicle location tracking",
    },
  ];

  const appointmentStatuses = [
    {
      status: "Scheduled",
      description: "Future appointment with confirmed time slot",
      color: "bg-blue-100 text-blue-800",
    },
    {
      status: "Confirmed",
      description: "Carrier acknowledged appointment details",
      color: "bg-green-100 text-green-800",
    },
    {
      status: "Checked In",
      description: "Vehicle arrived and cleared gate security",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      status: "In Progress",
      description: "Active loading or unloading operations",
      color: "bg-orange-100 text-orange-800",
    },
    {
      status: "Completed",
      description: "Operations finished, ready for departure",
      color: "bg-purple-100 text-purple-800",
    },
    {
      status: "Cancelled",
      description: "Appointment cancelled by carrier or facility",
      color: "bg-red-100 text-red-800",
    },
  ];

  const integrationPoints = [
    "Gate security system for seamless entry/exit",
    "WMS integration for receiving and shipping coordination",
    "TMS integration for carrier communication",
    "ERP synchronization for financial tracking",
    "GPS tracking for real-time vehicle location",
    "Security patrol checkpoints at yard locations",
    "Weather monitoring for outdoor operations",
    "Access control for restricted areas",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Intelligent Yard Management System
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Optimize Your Yard Operations with Smart Technology
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transform yard chaos into organized efficiency. Smart parking
              assignments, real-time tracking, and optimized dock scheduling
              reduce dwell times by 45% and maximize your facility throughput.
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
              Complete Yard Management Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to manage a high-volume yard operation
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

      {/* Yard Location Types */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Comprehensive Yard Zone Management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage every type of yard location with precision
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {yardTypes.map((type, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <type.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {type.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.capabilities.map((capability, idx) => (
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

      {/* Workflow Timeline */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Streamlined Yard Workflow
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From gate entry to departure in an optimized process
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

      {/* Appointment Statuses */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Appointment Status Tracking
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete visibility into appointment lifecycle
            </p>
          </div>
          <div className="mx-auto max-w-3xl grid gap-4 sm:grid-cols-2">
            {appointmentStatuses.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Badge className={item.color}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
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
              Measurable Operational Improvements
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real results from optimized yard management
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
              Yard management that connects with your entire operation
            </p>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {integrationPoints.map((point, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm">{point}</span>
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
              Ready to Optimize Your Yard?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join companies reducing dwell times and maximizing dock
              utilization with LogiVox
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
