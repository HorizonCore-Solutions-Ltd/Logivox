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
  RefreshCw,
  TrendingUp,
  Bell,
  BarChart3,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Package,
  Calendar,
  ShieldCheck,
  LineChart,
  Target,
  AlertTriangle,
} from "lucide-react";

export default function ReplenishmentPage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Demand Forecasting",
      description:
        "AI-powered demand predictions using historical sales data, seasonality, trends, and external signals.",
    },
    {
      icon: RefreshCw,
      title: "Automated Reorder Triggers",
      description:
        "Set dynamic reorder points and quantities per SKU and warehouse. Orders trigger automatically when stock falls below threshold.",
    },
    {
      icon: Bell,
      title: "Smart Stock Alerts",
      description:
        "Proactive notifications for low stock, overstock, slow-movers, and expiry risks before they become problems.",
    },
    {
      icon: BarChart3,
      title: "Min/Max Replenishment",
      description:
        "Rule-based min/max inventory management with configurable safety stock levels per location.",
    },
    {
      icon: Globe,
      title: "Supplier Integration",
      description:
        "Connect directly to supplier portals to auto-generate and send purchase orders when replenishment triggers fire.",
    },
    {
      icon: Calendar,
      title: "Lead Time Management",
      description:
        "Factor in supplier lead times, order cycles, and transit times to ensure stock arrives exactly when needed.",
    },
    {
      icon: Target,
      title: "ABC/XYZ Analysis",
      description:
        "Classify products by value and demand variability to apply the right replenishment strategy to each SKU.",
    },
    {
      icon: LineChart,
      title: "Replenishment Analytics",
      description:
        "Track fill rates, reorder frequency, carrying costs, and supplier performance from a single dashboard.",
    },
    {
      icon: Zap,
      title: "Emergency Replenishment",
      description:
        "One-click emergency reorder workflow for critical stockouts with priority routing to your fastest supplier.",
    },
  ];

  const benefits = [
    { metric: "40%", label: "reduction in stockouts" },
    { metric: "25%", label: "lower carrying costs" },
    { metric: "99%+", label: "fill rate achieved" },
    { metric: "60%", label: "less manual ordering time" },
  ];

  const steps = [
    {
      step: "1",
      title: "Set Replenishment Rules",
      desc: "Configure min/max levels, safety stock, and lead times per SKU and warehouse.",
    },
    {
      step: "2",
      title: "AI Analyses Demand",
      desc: "Our engine continuously analyses sales velocity, seasonality, and trends to refine reorder points.",
    },
    {
      step: "3",
      title: "Trigger Fires Automatically",
      desc: "When stock hits the reorder point, a purchase order draft is created and sent to your supplier instantly.",
    },
    {
      step: "4",
      title: "Track & Optimise",
      desc: "Monitor every replenishment order, supplier performance, and inventory health from a single dashboard.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container-enterprise relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="text-sm px-4 py-1">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Replenishment & Demand Planning
            </Badge>
            <h1 className="text-5xl font-bold leading-tight">
              Never run out of stock — or overstock — again
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              LogiVox's replenishment engine combines AI demand forecasting with
              rule-based automation to keep every SKU at the perfect inventory
              level across all your warehouses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" asChild>
                <Link href="/demo">
                  Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container-enterprise">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {benefits.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="text-4xl font-bold text-primary">
                  {b.metric}
                </div>
                <div className="text-sm text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container-enterprise">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold">
              Everything you need for intelligent replenishment
            </h2>
            <p className="text-muted-foreground text-lg">
              From simple min/max rules to AI-driven demand forecasting —
              LogiVox scales with your operation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold">
              How automated replenishment works
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance / Trust */}
      <section className="py-16 border-t">
        <div className="container-enterprise">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-muted/50 rounded-2xl p-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="font-semibold">
                  Works with your existing suppliers
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                LogiVox integrates with leading procurement and ERP systems
                including SAP, QuickBooks, Xero, and custom supplier portals.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button asChild>
                <Link href="/demo">
                  Book Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Warning banner for common pain points */}
      <section className="py-16">
        <div className="container-enterprise max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Manual replenishment is costing you
          </div>
          <h2 className="text-3xl font-bold">
            The average warehouse loses 12% of revenue to stockouts and 8% to
            overstock annually
          </h2>
          <p className="text-muted-foreground text-lg">
            LogiVox's automated replenishment eliminates both problems
            simultaneously — with zero manual spreadsheet work.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Related */}
      <section className="py-16 border-t bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Often used alongside
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                href: "/solutions/inventory",
                icon: Package,
                label: "Inventory Management",
              },
              {
                href: "/solutions/analytics",
                icon: BarChart3,
                label: "AI Analytics & Forecasting",
              },
              {
                href: "/solutions/warehouse-management",
                icon: CheckCircle2,
                label: "Warehouse Management",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-accent transition-colors"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
