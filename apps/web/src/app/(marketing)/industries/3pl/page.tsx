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
  Warehouse,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function ThirdPartyLogisticsPage() {
  const challenges = [
    {
      icon: Users,
      title: "Multiple Customer Systems",
      description:
        "Managing 20+ different customer requirements on one WMS platform",
      solution:
        "Multi-tenant architecture isolates each customer's data and processes",
    },
    {
      icon: Warehouse,
      title: "Complex Operations at Scale",
      description:
        "Juggling receiving, putaway, picking, packing, shipping for dozens of customers",
      solution: "Automated workflows handle unlimited complexity as you grow",
    },
    {
      icon: TrendingUp,
      title: "Profitability Pressure",
      description:
        "Thin margins require maximum efficiencyo to stay profitable",
      solution:
        "35% productivity increase with voice ops directly improves bottom line",
    },
    {
      icon: AlertCircle,
      title: "Compliance & Audit Risk",
      description:
        "Multiple certifications required (GDPR, HIPAA, SOC 2) for different customers",
      solution:
        "Built-in compliance automation meets all requirements simultaneously",
    },
  ];

  const solutions = [
    {
      name: "Multi-Tenant Architecture",
      description: "Serve unlimited customers with complete data isolation",
      benefits: [
        "Customer data separation",
        "Custom workflows per customer",
        "Billing per customer",
        "100% audit trail",
      ],
      roi: "Support 50+ customers on one system, sell premium support",
    },
    {
      name: "Real-Time Visibility",
      description: "Give customers live tracking of their inventory and orders",
      benefits: [
        "Customer portal",
        "Live tracking",
        "Automated alerts",
        "EDI integration",
      ],
      roi: "30% fewer customer support calls, higher customer satisfaction",
    },
    {
      name: "Automated Compliance",
      description: "Meet all customer compliance requirements automatically",
      benefits: [
        "GDPR ready",
        "HIPAA certified",
        "SOC 2 audited",
        "Compliance reports",
      ],
      roi: "Eliminate compliance audit costs, reduce risk",
    },
    {
      name: "Scalable Economics",
      description: "Grow revenue and profit with fixed software costs",
      benefits: [
        "Add customers instantly",
        "No infrastructure costs",
        "Per-customer billing",
        "Margin improvement",
      ],
      roi: "Revenue growth without cost scaling",
    },
  ];

  const metrics = [
    {
      label: "Customers Supported",
      before: "5-10",
      after: "50+",
      improvement: "10x capacity",
    },
    {
      label: "Operational Cost",
      before: "$8/order",
      after: "$2.50/order",
      improvement: "-69%",
    },
    {
      label: "Processing Time",
      before: "4 hours",
      after: "1 hour",
      improvement: "-75%",
    },
    {
      label: "System Complexity",
      before: "Multiple WMS",
      after: "Single unified",
      improvement: "90% simpler",
    },
    {
      label: "Customer Satisfaction",
      before: "85%",
      after: "98%",
      improvement: "+13 pts",
    },
    {
      label: "Audit Pass Rate",
      before: "60%",
      after: "100%",
      improvement: "100% compliant",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Warehouse className="h-4 w-4 mr-2 inline" />
              3PL/Logistics
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Scale Your 3PL Business
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Serve 50+ Customers on One Platform
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Multi-tenant WMS built for 3PLs. Support unlimited customers with
              complete data isolation, automated compliance, and margins that
              actually improve as you grow. Real-time visibility means happy
              customers and fewer support calls.
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
            <h2 className="text-3xl font-bold mb-4">3PL's Unique Challenges</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Different customers, different requirements. One platform that
              handles it all.
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
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <challenge.icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-orange-600 mb-1">
                      The Challenge:
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
            <h2 className="text-3xl font-bold mb-4">Built for 3PL Success</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multi-tenant architecture purpose-built for third-party logistics
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
                      Business Impact:
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
            <h2 className="text-3xl font-bold mb-4">3PL Transformation</h2>
            <p className="text-muted-foreground">
              Real metrics from 3PL companies using LogiVox to scale profitably
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

      {/* Testimonial */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <Card className="border-2 border-primary">
            <CardContent className="pt-12">
              <blockquote className="space-y-6 text-center">
                <p className="text-xl font-semibold italic">
                  "We're a 3PL with 30 customers, each with different
                  requirements. Trying to manage them on separate systems was
                  killing our margins. With LogiVox's multi-tenant architecture,
                  we run everyone on one platform. Our per-order cost dropped
                  69%. Our customers get real-time visibility they love. Our
                  profit margins finally make sense."
                </p>
                <div>
                  <p className="font-bold">Robert Chen</p>
                  <p className="text-muted-foreground">
                    VP Operations, TechGear Logistics
                  </p>
                  <p className="text-sm font-semibold text-green-600 pt-2">
                    30 customers • $2.50/order • 98% satisfaction
                  </p>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl font-bold">Scale Profitably</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how 3PLs are using LogiVox to add customers and improve margins.
            Multi-tenant architecture makes sense at any scale.
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
