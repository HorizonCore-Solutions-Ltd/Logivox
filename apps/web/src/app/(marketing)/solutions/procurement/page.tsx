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
  BarChart3,
  TrendingUp,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Brain,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileText,
  Database,
} from "lucide-react";

export default function SupplierB2BProcurementPage() {
  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Dashboards",
      description:
        "Monitor inventory performance with live metrics and customizable KPI tracking.",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Machine learning algorithms detect patterns and predict future trends automatically.",
    },
    {
      icon: TrendingUp,
      title: "Demand Optimization",
      description:
        "Predict future demand with 95% accuracy using historical data and market trends.",
    },
    {
      icon: Target,
      title: "Performance Analytics",
      description:
        "Track turnover rates, stock velocity, and operational efficiency metrics.",
    },
    {
      icon: AlertTriangle,
      title: "Smart Alerts",
      description:
        "Receive proactive notifications for anomalies, trends, and critical thresholds.",
    },
    {
      icon: FileText,
      title: "Custom Reports",
      description:
        "Generate detailed reports with drill-down capabilities and export options.",
    },
  ];

  const analyticsModules = [
    {
      title: "Inventory Analytics",
      description:
        "Stock levels, turnover rates, aging analysis, and valuation metrics",
      icon: Database,
      metrics: [
        "ABC Analysis",
        "Stock Velocity",
        "Carrying Costs",
        "Dead Stock Identification",
      ],
    },
    {
      title: "Sales Analytics",
      description:
        "Revenue trends, customer behavior, and product performance insights",
      icon: TrendingUp,
      metrics: [
        "Revenue by Product",
        "Customer Segmentation",
        "Sales Trends",
        "Margin Analysis",
      ],
    },
    {
      title: "Operational Analytics",
      description:
        "Warehouse efficiency, fulfillment rates, and process optimization",
      icon: Activity,
      metrics: [
        "Pick Accuracy",
        "Cycle Time",
        "Labor Productivity",
        "Space Utilization",
      ],
    },
    {
      title: "Predictive Analytics",
      description:
        "AI-driven forecasts for demand, supply chain, and business planning",
      icon: Brain,
      metrics: [
        "Demand Forecast",
        "Reorder Point Optimization",
        "Seasonality Detection",
        "Risk Assessment",
      ],
    },
  ];

  const benefits = [
    "Reduce excess inventory by 35% with demand forecasting",
    "Improve stock turnover by 45%",
    "Decrease stockouts by 60% through predictive alerts",
    "Save 15+ hours weekly on manual reporting",
    "Identify cost-saving opportunities worth 20% of inventory value",
    "Real-time visibility across all locations and channels",
    "Mobile-responsive dashboards for on-the-go insights",
    "Automated anomaly detection and root cause analysis",
  ];

  const visualizationTypes = [
    {
      name: "Line Charts",
      icon: LineChart,
      description: "Trend analysis over time",
    },
    {
      name: "Bar Charts",
      icon: BarChart3,
      description: "Compare categories and segments",
    },
    {
      name: "Pie Charts",
      icon: PieChart,
      description: "Composition and distribution",
    },
    {
      name: "Heat Maps",
      icon: Activity,
      description: "Pattern recognition and density",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Solutions</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Procurement & Supplier Portals
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Unified Inbound Sourcing. Bring your suppliers into the same zero-latency loop as your warehouse. LogiVox offers dedicated vendor portals, automated reorder triggers, and transparent three-way matching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">See Supplier B2B Procurement Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Powerful Analytics Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and optimize your inventory
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

      {/* Supplier B2B Procurement Modules */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Comprehensive Supplier B2B Procurement Modules
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deep insights across every aspect of your business
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {analyticsModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{module.title}</CardTitle>
                        <CardDescription className="mb-4">
                          {module.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2">
                          {module.metrics.map((metric) => (
                            <Badge
                              key={metric}
                              variant="secondary"
                              className="text-xs"
                            >
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visualization Types */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Rich Data Visualizations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple chart types for every analytical need
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visualizationTypes.map((viz) => {
              const Icon = viz.icon;
              return (
                <Card key={viz.name} className="text-center">
                  <CardHeader>
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{viz.name}</CardTitle>
                    <CardDescription>{viz.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Data-Driven Decision Making
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our Supplier B2B Procurement platform delivers measurable improvements across
                your business.
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
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Real-time insights at your fingertips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Interactive dashboard preview will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">AI-Powered</Badge>
            <h2 className="text-3xl font-bold mb-4">Intelligent Automation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let AI do the heavy lifting while you focus on strategy
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Anomaly Detection",
                description:
                  "Automatically identify unusual patterns and potential issues before they impact operations",
                icon: Eye,
              },
              {
                title: "Trend Prediction",
                description:
                  "Forecast future demand with machine learning models trained on your historical data",
                icon: TrendingUp,
              },
              {
                title: "Optimization Recommendations",
                description:
                  "Receive actionable suggestions to improve efficiency and reduce costs",
                icon: Zap,
              },
            ].map((capability) => {
              const Icon = capability.icon;
              return (
                <Card key={capability.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{capability.title}</CardTitle>
                    <CardDescription>{capability.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Unlock Your Data's Potential?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join leading companies using LogiVox Supplier B2B Procurement to drive growth
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
              <Link href="/contact">Request Analytics Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
