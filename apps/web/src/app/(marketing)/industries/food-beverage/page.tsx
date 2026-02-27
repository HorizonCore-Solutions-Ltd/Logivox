"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  AlertCircle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function FoodBeveragePage() {
  const challenges = [
    {
      icon: Calendar,
      title: "Expiration Date Management",
      description: "FEFO (First Expired, First Out) complex to manage manually - risk of recalls",
      solution: "Automatic expiration date tracking with FEFO prioritization prevents waste",
    },
    {
      icon: TrendingUp,
      title: "Temperature Control",
      description: "Maintain proper temps from receiving through delivery or product is ruined",
      solution: "Alerts and automated workflows ensure temperature-controlled logistics",
    },
    {
      icon: AlertCircle,
      title: "Regulatory Compliance",
      description: "FDA, GSMA, and local regulations require meticulous documentation",
      solution: "Audit trails and compliance reporting meet all regulatory requirements",
    },
    {
      icon: Lock,
      title: "Food Safety & Recalls",
      description: "Trace ingredients back to source; trace recalls to all locations",
      solution: "Complete traceability from lot number to customer instantly",
    },
  ];

  const solutions = [
    {
      name: "FEFO & Lot Tracking",
      description: "Never ship expired product again",
      benefits: ["Expiration date priority", "Lot number tracking", "Batch management", "Automatic hold lists"],
      roi: "Eliminate expired product waste, improve shelf life",
    },
    {
      name: "Food Safety Operations",
      description: "Temperature control and compliance built-in",
      benefits: ["Temperature alerts", "Compliance documentation", "Audit trails", "Recall ready"],
      roi: "30% reduction in waste, zero recalls",
    },
    {
      name: "Complete Traceability",
      description: "Track any ingredient from supplier to customer",
      benefits: ["Supplier-to-customer tracking", "Recall automation", "Quality documentation", "Certification proof"],
      roi: "Real-time recall execution, protect brand",
    },
    {
      name: "Quality Control",
      description: "Systematic inspection and testing",
      benefits: ["Incoming QC", "CAPA management", "Testing records", "Certification tracking"],
      roi: "Prevent recalls, reduce liability",
    },
  ];

  const metrics = [
    { label: "Product Waste", before: "8-12%", after: "1-2%", improvement: "-87% waste" },
    { label: "Expiration Misses", before: "0.5-1%", after: "<0.01%", improvement: "98% elimination" },
    { label: "Recall Time", before: "3-5 days", after: "2 hours", improvement: "99% faster" },
    { label: "Recall Scope", before: "All batches", after: "Specific lots", improvement: "90% smaller" },
    { label: "Compliance Audit", before: "Failed: 40%", after: "Pass: 100%", improvement: "Perfect score" },
    { label: "Customer Complaints", before: "15-20/mo", after: "<2/mo", improvement: "-90%" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Leaf className="h-4 w-4 mr-2 inline" />
              Food & Beverage
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Never Ship Expired Product Again
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Complete Food Safety & Traceability
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              LogiVox automates FEFO, tracks expiration dates, ensures temperature control, 
              and makes recalls instant. FDA/GSMA compliant. Execute recalls in 2 hours instead of 3 days.
              Zero recalls means zero liability.
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
            <h2 className="text-3xl font-bold mb-4">Food Safety Challenges</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              F&B operations have unique requirements around freshness, safety, and compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {challenges.map((challenge) => (
              <Card key={challenge.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <challenge.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-1">The Challenge:</p>
                    <p className="text-sm">{challenge.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-600 mb-1">LogiVox Solution:</p>
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
            <h2 className="text-3xl font-bold mb-4">Purpose-Built for F&B</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed for food safety and compliance
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
                    <p className="text-sm font-semibold mb-2">Features:</p>
                    <ul className="space-y-1">
                      {solution.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-3">
                    <p className="text-sm font-semibold text-green-600 mb-1">Impact:</p>
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
            <h2 className="text-3xl font-bold mb-4">Food Safety Results</h2>
            <p className="text-muted-foreground">
              Real improvements in waste reduction, compliance, and recall readiness
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="text-sm line-through text-muted-foreground">{metric.before}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">{metric.after}</span>
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
          <h2 className="text-3xl font-bold">Compliance Made Simple</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            FDA/GSMA compliant platform. Execute recalls in 2 hours.
            Zero recalls on your watch.
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
