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
  Workflow,
  Zap,
  RefreshCw,
  Database,
  ArrowLeftRight,
  CheckCircle2,
  ArrowRight,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Network,
} from "lucide-react";

export default function ERPIntegrationPage() {
  const features = [
    {
      icon: ArrowLeftRight,
      title: "Bi-Directional Sync",
      description:
        "Seamless two-way data flow between LogiVox and your ERP system in real-time.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Instant synchronization ensures data accuracy across all systems.",
    },
    {
      icon: Database,
      title: "Data Mapping",
      description:
        "Intelligent field mapping automatically aligns data structures between systems.",
    },
    {
      icon: Shield,
      title: "Secure Connections",
      description:
        "Enterprise-grade encryption and authentication protect your business data.",
    },
    {
      icon: RefreshCw,
      title: "Automated Workflows",
      description:
        "Trigger actions across systems with customizable business rules.",
    },
    {
      icon: Clock,
      title: "Conflict Resolution",
      description:
        "Smart algorithms handle data conflicts and version control automatically.",
    },
  ];

  const supportedERPs = [
    { name: "SAP", category: "Enterprise" },
    { name: "Oracle NetSuite", category: "Cloud ERP" },
    { name: "Microsoft Dynamics 365", category: "Enterprise" },
    { name: "Infor", category: "Industry-Specific" },
    { name: "Epicor", category: "Manufacturing" },
    { name: "Sage", category: "SMB" },
    { name: "Acumatica", category: "Cloud ERP" },
    { name: "Odoo", category: "Open Source" },
    { name: "Custom APIs", category: "Enterprise" },
  ];

  const integrationCapabilities = [
    {
      title: "Inventory Synchronization",
      description:
        "Real-time stock levels, locations, and movements across all systems",
      icon: Database,
    },
    {
      title: "Order Management",
      description: "Seamless order processing from creation to fulfillment",
      icon: FileText,
    },
    {
      title: "Financial Reconciliation",
      description: "Automated accounting updates and transaction tracking",
      icon: TrendingUp,
    },
    {
      title: "Master Data Management",
      description: "Centralized product, customer, and vendor information",
      icon: Network,
    },
  ];

  const benefits = [
    "Eliminate manual data entry and reduce errors by 95%",
    "Reduce order processing time by 80%",
    "Real-time visibility across all business systems",
    "Automated reconciliation saves 20+ hours per week",
    "Scale integrations without additional IT resources",
    "Pre-built connectors reduce implementation time by 70%",
    "Monitor integration health with real-time dashboards",
    "Rollback capabilities for safe deployments",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Solutions</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              ERP Integration
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect LogiVox seamlessly with your existing ERP system.
              Eliminate data silos, automate workflows, and maintain a single
              source of truth across your enterprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Integration Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Supported ERPs */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Works With Your ERP</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pre-built connectors for leading ERP systems, plus custom API
              integration
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportedERPs.map((erp) => (
              <Card
                key={erp.name}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-3">
                    <Workflow className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{erp.name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto mt-2">
                    {erp.category}
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise Integration Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for reliability, security, and scalability
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Capabilities */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What We Integrate</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive data synchronization across business processes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {integrationCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <Card key={capability.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">
                          {capability.title}
                        </CardTitle>
                        <CardDescription>
                          {capability.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Accelerate Your Digital Transformation
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our ERP integration platform delivers immediate ROI and
                long-term scalability.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Architecture</CardTitle>
                  <CardDescription>
                    Secure, scalable, and reliable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Workflow className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Architecture diagram will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Implementation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get up and running in weeks, not months
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Discovery",
                description:
                  "We analyze your ERP setup and business requirements",
              },
              {
                step: "2",
                title: "Configuration",
                description: "Map data fields and configure sync rules",
              },
              {
                step: "3",
                title: "Testing",
                description: "Validate integration in staging environment",
              },
              {
                step: "4",
                title: "Go Live",
                description: "Deploy to production with full support",
              },
            ].map((phase) => (
              <Card key={phase.step}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-3">
                    {phase.step}
                  </div>
                  <CardTitle className="text-lg">{phase.title}</CardTitle>
                  <CardDescription>{phase.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect Your ERP?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Our integration experts will help you achieve seamless connectivity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Book Integration Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
