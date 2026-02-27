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
  Pill,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
  TrendingUp,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function PharmaceuticalPage() {
  const challenges = [
    {
      icon: Shield,
      title: "Anti-Counterfeiting & Serialization",
      description:
        "Track every serialized unit from manufacture to patient administration",
      solution:
        "Unique serial number tracking with tamper detection and batch tracking",
    },
    {
      icon: Lock,
      title: "Regulatory Compliance",
      description:
        "FDA, DEA, GxP compliance for controlled substances and all products",
      solution:
        "GCP-certified workflows with complete audit trails and compliance reporting",
    },
    {
      icon: AlertCircle,
      title: "Cold Chain & Storage",
      description:
        "Maintain exact temperature/humidity requirements for sensitive products",
      solution: "Real-time temp monitoring with alerts and documented history",
    },
    {
      icon: TrendingUp,
      title: "Recall Precision",
      description:
        "Find exact location of recalled batches across multiple countries",
      solution:
        "Complete traceability enables precision recalls within minutes",
    },
  ];

  const solutions = [
    {
      name: "Serialization & Track-and-Trace",
      description: "Meet EU/US regulations with unique unit tracking",
      benefits: [
        "Unique serial assignment",
        "Track to pharmacy/patient",
        "Anti-counterfeit",
        "Tamper detection",
      ],
      roi: "Eliminate counterfeits, meet SECURPHARM/DSCSA requirements",
    },
    {
      name: "Temperature & Humidity Control",
      description: "Maintain cold chain integrity throughout logistics",
      benefits: [
        "Real-time monitoring",
        "Automated alerts",
        "Temperature history",
        "Deviation reports",
      ],
      roi: "Zero product loss from temp deviation, protect efficacy",
    },
    {
      name: "GCP-Compliant Workflows",
      description: "Every process designed for regulatory compliance",
      benefits: [
        "Electronic records",
        "Digital signatures",
        "Audit trails",
        "Compliance reports",
      ],
      roi: "Pass inspections first try, reduce compliance audit costs",
    },
    {
      name: "Lot & Batch Management",
      description: "Complete traceability from raw materials to patient",
      benefits: [
        "Lot tracking",
        "Precision recalls",
        "Quality documentation",
        "Batch analytics",
      ],
      roi: "Execute recalls in hours, not weeks",
    },
  ];

  const metrics = [
    {
      label: "Recall Execution Time",
      before: "2-3 weeks",
      after: "2-4 hours",
      improvement: "99.7% faster",
    },
    {
      label: "Recall Scope",
      before: "Entire batches",
      after: "Exact serials",
      improvement: "98% more precise",
    },
    {
      label: "Compliance Pass Rate",
      before: "70%",
      after: "100%",
      improvement: "Perfect",
    },
    {
      label: "Cold Chain Failures",
      before: "1-2%",
      after: "<0.01%",
      improvement: "99.5% reduction",
    },
    {
      label: "Counterfeiting Risk",
      before: "High",
      after: "Zero",
      improvement: "Eliminated",
    },
    {
      label: "Audit Prep Time",
      before: "6 weeks",
      after: "1 day",
      improvement: "-99%",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Pill className="h-4 w-4 mr-2 inline" />
              Pharmaceutical
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Regulatory Compliance Built-In
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Serialization, Track-and-Trace, Cold Chain
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              GCP-certified platform with complete serialization, cold chain
              monitoring, and precision recall capability. Meet DSCSA,
              SECURPHARM, and all compliance requirements. Execute recalls in 2
              hours instead of 2 weeks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" asChild>
                <Link href="/contact?type=demo">
                  Schedule Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Pharmaceutical Challenges
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Protecting patients and brand requires more than standard WMS
              capability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {challenges.map((challenge) => (
              <Card
                key={challenge.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <challenge.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">
                      Requirement:
                    </p>
                    <p className="text-sm">{challenge.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-600 mb-1">
                      LogiVox Solution:
                    </p>
                    <p className="text-sm">{challenge.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              GCP-Certified for Pharma
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade WMS built for life-sciences compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution) => (
              <Card key={solution.name}>
                <CardHeader>
                  <CardTitle>{solution.name}</CardTitle>
                  <CardDescription>{solution.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Capabilities:</p>
                    <ul className="space-y-1">
                      {solution.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-3">
                    <p className="text-sm font-semibold text-green-600 mb-1">
                      Business Value:
                    </p>
                    <p className="text-sm">{solution.roi}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Compliance & Safety Results
            </h2>
            <p className="text-muted-foreground">
              Real measurements from pharmaceutical companies using LogiVox
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {metric.label}
                  </p>
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="text-sm line-through text-muted-foreground">
                      {metric.before}
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {metric.after}
                    </span>
                  </div>
                  <Badge className="bg-green-600">{metric.improvement}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl font-bold">Patient Safety Guaranteed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            GCP-certified compliance. Serialized supply chain. Cold chain
            integrity. Precision recalls when they matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact?type=demo">
                Schedule Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-studies">See Case Studies</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
