"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AutomotivePage() {
  const challenges = [
    {
      icon: Truck,
      title: "JIT Supply Chain Synchronization",
      description: "Parts must arrive at exact time, not too early or too late",
      solution: "Real-time visibility into supplier inventory and transit status",
    },
    {
      icon: Gauge,
      title: "Complex Parts Hierarchy",
      description: "Thousands of SKUs with sub-assemblies, BOMs, and lot tracking",
      solution: "Multi-level BOM management and intelligent allocation rules",
    },
    {
      icon: AlertTriangle,
      title: "Quality & Compliance",
      description: "IATF 16949, ISO 9001, traceability back to raw materials",
      solution: "Complete lot tracking with test documentation and certificates",
    },
    {
      icon: Clock,
      title: "Production Line Stoppage",
      description: "One part late = entire line down = $50K+/hour loss",
      solution: "Predictive alerts and automatic supplier escalation",
    },
  ];

  const solutions = [
    {
      name: "Supplier Visibility & EDI Integration",
      description: "Real-time connection to supplier systems and inventory levels",
      benefits: ["Live supplier inventory", "Automated EDI orders", "Early warning alerts", "Supplier scorecards"],
      roi: "Eliminate line stoppages from part unavailability",
    },
    {
      name: "Intelligent JIT Scheduling",
      description: "Automatically schedule deliveries to exact time windows",
      benefits: ["Time window optimization", "Automatic replenishment", "Delivery scheduling", "Dock coordination"],
      roi: "Reduce inventory 30-40% while improving on-time delivery",
    },
    {
      name: "Quality & Traceability",
      description: "Complete genealogy from raw materials through assembly",
      benefits: ["Lot tracking", "Test documentation", "Certificates attached", "Quick recall execution"],
      roi: "Pass IATF audits first try, reduce quality costs",
    },
    {
      name: "Production Planning Integration",
      description: "Sync your MRP/ERP demand signals with warehouse operations",
      benefits: ["MRP integration", "Demand synchronization", "Capacity planning", "Waste reduction"],
      roi: "Optimized inventory levels, fewer expedites, lower costs",
    },
  ];

  const metrics = [
    { label: "On-Time Delivery", before: "92%", after: "98.5%", improvement: "+6.5 points" },
    { label: "Inventory Level", before: "45 days", after: "18 days", improvement: "-60%" },
    { label: "Line Stoppages", before: "8/year", after: "<1/year", improvement: "-88%" },
    { label: "Expedite Cost", before: "$180K/year", after: "$25K/year", improvement: "-86%" },
    { label: "Quality Audit Pass Rate", before: "85%", after: "100%", improvement: "Full compliance" },
    { label: "Supplier On-Time", before: "89%", after: "96%", improvement: "+7 points" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-background to-blue-600/10 py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Truck className="h-4 w-4 mr-2 inline" />
              Automotive
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              JIT Operations at Scale
              <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Zero Line Stoppages. Perfect On-Time Delivery.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Synchronize complex supply chains across multiple suppliers and production lines. 
              Real-time visibility, intelligent scheduling, and IATF compliance. 
              Reduce inventory 60% while improving on-time delivery to 98.5%.
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
            <h2 className="text-3xl font-bold mb-4">Automotive Supply Chain Challenges</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Legacy systems and spreadsheets cannot handle modern complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {challenges.map((challenge) => (
              <Card key={challenge.title} className="hover:shadow-lg transition-shadow">
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
                    <p className="text-sm font-semibold text-blue-600 mb-1">Automotive Requirement:</p>
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
            <h2 className="text-3xl font-bold mb-4">IATF-Certified for Automotive</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise WMS purpose-built for automotive manufacturing
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
                        <li key={benefit} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-3">
                    <p className="text-sm font-semibold text-green-600 mb-1">Business Impact:</p>
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
            <h2 className="text-3xl font-bold mb-4">Supply Chain Excellence</h2>
            <p className="text-muted-foreground">
              Results from major automotive suppliers using LogiVox
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="text-sm line-through text-muted-foreground">{metric.before}</span>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{metric.after}</span>
                  </div>
                  <Badge className="bg-blue-600">{metric.improvement}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-8">
              <div className="space-y-4">
                <p className="text-lg italic">
                  "LogiVox transformed our supply chain from chaotic to synchronized. 
                  We reduced inventory by 60% while hitting 98.5% on-time delivery. 
                  Line stoppages basically disappeared. IATF audits are effortless now."
                </p>
                <div>
                  <p className="font-semibold">Marcus Rodriguez</p>
                  <p className="text-sm text-muted-foreground">VP of Operations, Precision Automotive Supply</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl font-bold">Perfect JIT Execution</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time visibility. Intelligent scheduling. IATF compliance.
            98.5% on-time delivery with 60% lower inventory.
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
