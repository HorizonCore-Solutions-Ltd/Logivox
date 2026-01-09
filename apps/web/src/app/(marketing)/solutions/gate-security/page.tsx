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
  ShieldCheck,
  Truck,
  Users,
  ClipboardCheck,
  Camera,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  QrCode,
  Scale,
} from "lucide-react";

export default function GateCheckInPage() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Gate Entry Management",
      description:
        "Streamline truck check-ins with automated verification, documentation capture, and dock assignment.",
    },
    {
      icon: Users,
      title: "Visitor Management",
      description:
        "Complete visitor tracking with pre-registration, badge printing, and host notifications.",
    },
    {
      icon: Truck,
      title: "Carrier Documentation",
      description:
        "Digital capture of BOL, manifests, driver licenses, and delivery documents with OCR.",
    },
    {
      icon: ClipboardCheck,
      title: "Compliance Verification",
      description:
        "Automated checks for appointment matching, hazmat compliance, and seal number validation.",
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      description:
        "Capture photos of vehicles, trailers, cargo damage, and driver identification.",
    },
    {
      icon: Scale,
      title: "Weigh Bridge Integration",
      description:
        "Automatic weight capture for inbound and outbound vehicles with discrepancy alerts.",
    },
  ];

  const gateOperations = [
    {
      title: "Truck Check-In",
      description: "Fast and efficient carrier processing",
      icon: Truck,
      capabilities: [
        "Appointment verification",
        "Driver ID and license scanning",
        "Manifest and BOL capture",
        "Seal number validation",
        "Automatic dock assignment",
        "Weight-in-motion integration",
        "Hazmat documentation verification",
        "Carrier performance tracking",
      ],
    },
    {
      title: "Visitor Management",
      description: "Professional visitor experience",
      icon: Users,
      capabilities: [
        "Online pre-registration portal",
        "Photo capture and badge printing",
        "Host notification system",
        "Parking pass issuance",
        "Automatic exit processing",
        "Visitor analytics and reporting",
        "Escort requirement tracking",
        "Access control integration",
      ],
    },
    {
      title: "Documentation & Compliance",
      description: "Digital records and audit trails",
      icon: FileText,
      capabilities: [
        "OCR document scanning",
        "Blockchain BOL verification",
        "Compliance report generation",
        "Audit trail with timestamps",
        "Photo evidence storage",
        "E-signature capture",
        "OSHA compliance reporting",
        "Export documentation",
      ],
    },
  ];

  const workflow = [
    {
      step: "1. Arrival",
      description: "Truck arrives at gate, license plate automatically scanned",
      icon: Truck,
    },
    {
      step: "2. Check-In",
      description: "Gate personnel verify appointment and capture documents",
      icon: ClipboardCheck,
    },
    {
      step: "3. Documentation",
      description: "BOL, manifest, and driver ID digitally captured with OCR",
      icon: Camera,
    },
    {
      step: "4. Dock Assignment",
      description: "System assigns optimal dock door based on appointment and cargo",
      icon: Package,
    },
    {
      step: "5. Entry",
      description: "Gate opens, driver receives directions to assigned dock",
      icon: CheckCircle2,
    },
  ];

  const benefits = [
    {
      metric: "5 min",
      label: "Average Check-In Time",
      description: "Fast processing keeps trucks moving",
    },
    {
      metric: "100%",
      label: "Digital Documentation",
      description: "Eliminate paper and manual data entry",
    },
    {
      metric: "98%",
      label: "Compliance Rate",
      description: "Automated verification ensures adherence",
    },
    {
      metric: "70%",
      label: "Reduced Wait Times",
      description: "Faster gate processing improves flow",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            Gate Check-In Solution
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Streamline Your{" "}
            <span className="text-primary">Gate Operations</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Fast, secure truck check-ins and visitor management with digital documentation,
            automated compliance, and seamless dock coordination.
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
            <h2 className="text-3xl font-bold mb-4">Measurable Results</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real improvements from optimized gate operations
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
            Everything you need for efficient gate management
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
            <h2 className="text-3xl font-bold mb-4">Check-In Workflow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 5-step process from arrival to dock assignment
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

      {/* Gate Operations Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Gate Management</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Handle all types of gate operations
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {gateOperations.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.capabilities.map((capability, cIndex) => (
                      <li key={cIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">
                  Seamless WMS Integration
                </CardTitle>
                <CardDescription>
                  Gate check-in flows directly into your warehouse operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Gate Check-In</h4>
                    <p className="text-sm text-muted-foreground">
                      Truck clears security with all documents verified
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Dock Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatic dock door assignment based on appointment
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Receiving Start</h4>
                    <p className="text-sm text-muted-foreground">
                      Warehouse team notified, unloading begins immediately
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">
            Ready to Modernize Your Gate Operations?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join warehouses reducing check-in times by 70% with digital gate management.
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
