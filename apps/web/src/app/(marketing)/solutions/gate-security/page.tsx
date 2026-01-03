"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Radio,
  MapPin,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Truck,
  Camera,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  FileText,
  Shield,
  Navigation,
  Package
} from "lucide-react"

export default function GateSecurityPage() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Gate Entry Management",
      description: "Complete visitor, contractor, and delivery tracking with document verification and badge printing."
    },
    {
      icon: Radio,
      title: "Guard Management",
      description: "Digital patrol routes, panic buttons, GPS tracking, and shift handover for security personnel."
    },
    {
      icon: MapPin,
      title: "Real-Time GPS Tracking",
      description: "Live location monitoring of all security guards with geofencing and violation alerts."
    },
    {
      icon: AlertTriangle,
      title: "Panic Alert System",
      description: "Instant emergency response with auto-dispatch to 3 nearest guards and supervisor notification."
    },
    {
      icon: ClipboardCheck,
      title: "Digital Patrol Verification",
      description: "QR code, NFC, and GPS checkpoint verification with photo evidence and incident reporting."
    },
    {
      icon: Camera,
      title: "Incident Management",
      description: "Complete incident documentation with photos, videos, witness statements, and investigation tracking."
    }
  ]

  const gateOperations = [
    {
      title: "Visitor Management",
      description: "Complete visitor lifecycle from pre-registration to exit",
      icon: Users,
      capabilities: [
        "Online pre-registration portal",
        "Photo capture and badge printing",
        "Host notification system",
        "Background check integration",
        "Parking pass issuance",
        "Automatic exit processing",
        "Visitor analytics and reporting",
        "VIP visitor handling"
      ]
    },
    {
      title: "Delivery & Carrier Management",
      description: "Streamline inbound and outbound logistics",
      icon: Truck,
      capabilities: [
        "Truck manifest verification",
        "BOL and documentation scanning",
        "Seal number validation",
        "Weight ticket processing",
        "Hazmat documentation compliance",
        "Appointment matching and scheduling",
        "Carrier performance tracking",
        "Dwell time monitoring"
      ]
    },
    {
      title: "Security Patrols",
      description: "Comprehensive guard patrol management",
      icon: Navigation,
      capabilities: [
        "Custom patrol route creation",
        "QR/NFC checkpoint verification",
        "Photo evidence requirements",
        "Missed checkpoint alerts",
        "Patrol completion analytics",
        "Incident documentation",
        "Route optimization",
        "Historical patrol data"
      ]
    },
    {
      title: "Equipment & Asset Tracking",
      description: "Complete accountability for security equipment",
      icon: Package,
      capabilities: [
        "Check-out/check-in workflows",
        "Radios, flashlights, keys tracking",
        "Vehicle mileage monitoring",
        "Maintenance scheduling",
        "Condition assessments",
        "Replacement alerts",
        "Cost tracking",
        "Usage analytics"
      ]
    }
  ]

  const guardFeatures = [
    {
      title: "Patrol Routes",
      description: "Create routes with checkpoints, verification methods, and time requirements"
    },
    {
      title: "GPS Tracking",
      description: "Real-time location of all active guards with history playback"
    },
    {
      title: "Panic Button",
      description: "Emergency alert with auto-dispatch and audio recording"
    },
    {
      title: "Daily Reports",
      description: "End-of-shift activity summaries and incident documentation"
    },
    {
      title: "Equipment Management",
      description: "Asset tracking with maintenance schedules and check-out logs"
    },
    {
      title: "Shift Handover",
      description: "Digital handover notes between outgoing and incoming shifts"
    },
    {
      title: "Training & Certifications",
      description: "Track licenses, certifications, and expiration alerts"
    },
    {
      title: "Geofencing",
      description: "Virtual boundaries with entry/exit alerts and violation tracking"
    }
  ]

  const benefits = [
    {
      metric: "60%",
      description: "Faster gate processing times"
    },
    {
      metric: "100%",
      description: "Patrol completion verification"
    },
    {
      metric: "< 2 min",
      description: "Emergency response time with panic alerts"
    },
    {
      metric: "95%",
      description: "Reduction in manual paperwork"
    },
    {
      metric: "24/7",
      description: "Real-time guard location monitoring"
    },
    {
      metric: "Zero",
      description: "Lost or untracked security equipment"
    }
  ]

  const entryWorkflow = [
    {
      step: "Vehicle Arrival",
      description: "Driver presents documentation at gate",
      icon: Truck
    },
    {
      step: "Identity Verification",
      description: "Guard scans ID and validates credentials",
      icon: ShieldCheck
    },
    {
      step: "Document Capture",
      description: "BOL, manifest, and required docs photographed",
      icon: FileText
    },
    {
      step: "System Check",
      description: "Automated verification against appointments and watchlists",
      icon: CheckCircle2
    },
    {
      step: "Badge Issuance",
      description: "Temporary badge printed with photo and access level",
      icon: Users
    },
    {
      step: "Location Assignment",
      description: "Yard management assigns parking or dock",
      icon: MapPin
    }
  ]

  const complianceFeatures = [
    "Complete audit trail for all entries and exits",
    "OSHA compliance reporting for incidents",
    "Background check integration",
    "Hazmat documentation verification",
    "Insurance certificate validation",
    "DOT hours of service tracking",
    "Customizable compliance checklists",
    "Regulatory report generation"
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Complete Security Management Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Gate Entry & Security Guard Management System
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Comprehensive security solution combining gate operations, guard management, 
              and incident tracking. Real-time GPS monitoring, digital patrols, and instant 
              emergency response for complete facility protection.
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
              Integrated Security Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete security operations in one unified platform
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

      {/* Gate Operations */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Gate & Security Operations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage every aspect of facility access and security
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {gateOperations.map((operation, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <operation.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{operation.title}</CardTitle>
                      <CardDescription className="mt-1">{operation.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {operation.capabilities.map((capability, idx) => (
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

      {/* Entry Workflow */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Streamlined Gate Entry Process
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Fast, secure processing from arrival to facility access
            </p>
          </div>
          <div className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entryWorkflow.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-semibold">{item.step}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guard Management Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Advanced Guard Management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Digital tools for modern security personnel operations
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guardFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
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
              Security Performance Metrics
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Quantifiable improvements in security operations
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary">{benefit.metric}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Compliance & Audit Ready
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built-in compliance features for regulatory requirements
            </p>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {complianceFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
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
              Enhance Your Facility Security
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join organizations modernizing their security operations with LogiVox
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Security Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
