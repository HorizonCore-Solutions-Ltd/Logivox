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
  BadgeCheck,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  FileText,
  BarChart3,
  Shield,
  CheckCircle2,
  XCircle,
  Camera,
  Scan,
  ArrowRight,
  Zap,
  Award,
  Target,
} from "lucide-react";

export default function QualityControlPage() {
  const features = [
    {
      icon: ClipboardCheck,
      title: "Receiving Inspection",
      description:
        "Verify quality standards upon receipt with AQL sampling plans and automated workflows.",
    },
    {
      icon: Target,
      title: "AQL Sampling Plans",
      description:
        "Statistical sampling based on ANSI/ASQ Z1.4 standards with configurable inspection levels.",
    },
    {
      icon: AlertTriangle,
      title: "Defect Tracking",
      description:
        "Categorize and track defects by type, severity, and vendor with root cause analysis.",
    },
    {
      icon: BarChart3,
      title: "SPC Charts",
      description:
        "Statistical Process Control with real-time trend analysis and automated alerts.",
    },
    {
      icon: FileText,
      title: "CAPA Management",
      description:
        "Corrective and Preventive Actions tracking with workflow automation and documentation.",
    },
    {
      icon: Award,
      title: "Vendor Scorecards",
      description:
        "Track supplier quality metrics and performance trends for data-driven sourcing decisions.",
    },
  ];

  const inspectionTypes = [
    {
      type: "Receiving Inspection",
      icon: ClipboardCheck,
      description: "Quality verification at goods receipt",
      checks: [
        "Visual inspection for damage",
        "Quantity verification",
        "Dimensional checks",
        "Label/marking verification",
        "AQL sampling execution",
        "Certificate of Conformance review",
      ],
      metrics: [
        "Pass rate: 98.5%",
        "Inspection time: 12 min avg",
        "Reject rate: 1.5%",
      ],
    },
    {
      type: "In-Process Inspection",
      icon: BarChart3,
      description: "Quality control during operations",
      checks: [
        "Kitting accuracy verification",
        "Assembly quality checks",
        "Packaging integrity",
        "Label accuracy",
        "Serial number validation",
        "Weight/dimension verification",
      ],
      metrics: [
        "Pass rate: 99.2%",
        "Inspection time: 5 min avg",
        "Rework rate: 0.8%",
      ],
    },
    {
      type: "Final Inspection",
      icon: BadgeCheck,
      description: "Pre-shipment quality verification",
      checks: [
        "Order accuracy verification",
        "Packaging quality check",
        "Shipping label verification",
        "Product condition assessment",
        "Documentation completeness",
        "Compliance certification",
      ],
      metrics: [
        "Pass rate: 99.6%",
        "Inspection time: 8 min avg",
        "Hold rate: 0.4%",
      ],
    },
  ];

  const defectCategories = [
    {
      name: "Critical",
      color: "destructive",
      description: "Product safety or compliance issues",
      action: "Immediate hold",
    },
    {
      name: "Major",
      color: "warning",
      description: "Significant quality defects",
      action: "Hold & review",
    },
    {
      name: "Minor",
      color: "secondary",
      description: "Cosmetic or minor issues",
      action: "Accept with notes",
    },
  ];

  const complianceStandards = [
    "ISO 9001:2015 Quality Management",
    "ISO 13485 Medical Device QMS",
    "FDA 21 CFR Part 11 (Electronic Records)",
    "GMP (Good Manufacturing Practices)",
    "HACCP Food Safety",
    "ANSI/ASQ Z1.4 AQL Sampling",
  ];

  const capabilities = [
    {
      title: "Automated Sampling",
      icon: Scan,
      description:
        "System automatically calculates sample sizes based on lot size, inspection level, and AQL requirements.",
      benefits: [
        "ISO 2859 compliant",
        "Reduced human error",
        "Consistent quality",
        "Audit trail",
      ],
    },
    {
      title: "Visual AI Inspection",
      icon: Camera,
      description:
        "Computer vision for automated defect detection, damage assessment, and label verification.",
      benefits: [
        "99.5% accuracy",
        "3x faster inspection",
        "Objective results",
        "Pattern detection",
      ],
    },
    {
      title: "Real-Time Alerts",
      icon: AlertTriangle,
      description:
        "Instant notifications when quality metrics exceed thresholds or defect trends are detected.",
      benefits: [
        "Proactive quality management",
        "Trend detection",
        "Email/SMS alerts",
        "Escalation workflows",
      ],
    },
    {
      title: "Vendor Performance",
      icon: TrendingUp,
      description:
        "Track supplier quality over time with automated scorecards and performance dashboards.",
      benefits: [
        "Data-driven sourcing",
        "Quality trends",
        "Supplier comparison",
        "Cost of quality tracking",
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-enterprise relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Quality Control & Inspection • Industry-Leading
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Industry-Leading Quality Management
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mt-2">
                Comprehensive Quality Control
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              The most comprehensive quality control system in the industry. 86
              production-ready API endpoints covering AQL sampling, defect
              tracking, computer vision inspection, CAPA management, and
              real-time SPC charts. Ensure product quality at every touchpoint.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?solution=quality-control">
                  Request Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { label: "Quality Pass Rate", value: "99.2%" },
                { label: "Inspection Time", value: "-45%" },
                { label: "Defect Detection", value: "99.5%" },
                { label: "Cost Savings", value: "$280K" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Quality Management Suite
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to maintain quality standards and compliance
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all"
              >
                <CardHeader>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    {feature.title}
                  </h3>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Inspection Types */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Three-Level Inspection Process
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive quality checks at receiving, in-process, and final
              inspection
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {inspectionTypes.map((inspection, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <inspection.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {inspection.type}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {inspection.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm">
                      Quality Checks:
                    </h4>
                    <ul className="space-y-2">
                      {inspection.checks.map((check, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-sm">Performance:</h4>
                    <div className="space-y-1">
                      {inspection.metrics.map((metric, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-muted-foreground"
                        >
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Defect Management */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Defect Classification & Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Standardized defect categorization with automated workflows
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {defectCategories.map((category, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={category.color as any}
                          className="text-lg px-4 py-2"
                        >
                          {category.name}
                        </Badge>
                        <div>
                          <p className="font-medium">{category.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Action: {category.action}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <XCircle className="h-8 w-8 text-destructive" />
                      )}
                      {index === 1 && (
                        <AlertTriangle className="h-8 w-8 text-warning" />
                      )}
                      {index === 2 && (
                        <CheckCircle2 className="h-8 w-8 text-secondary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Advanced Quality Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Intelligent automation and AI-powered quality management
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {capabilities.map((capability, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <capability.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{capability.title}</CardTitle>
                  </div>
                  <CardDescription>{capability.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {capability.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Zap className="h-4 w-4 text-primary" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Compliance & Standards</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built-in support for international quality standards
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid gap-4 md:grid-cols-2">
              {complianceStandards.map((standard, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{standard}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-enterprise text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Improve Your Quality Standards?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join leading manufacturers and 3PLs using LogiVox to maintain
            zero-defect quality
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact?solution=quality-control">
                Schedule Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
