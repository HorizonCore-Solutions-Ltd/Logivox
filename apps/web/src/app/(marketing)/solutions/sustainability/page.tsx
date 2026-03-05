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
  Leaf,
  Recycle,
  BarChart3,
  Zap,
  Truck,
  Globe,
  Wind,
  Droplets,
  Sun,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export default function SustainabilityPage() {
  const features = [
    {
      icon: Leaf,
      title: "Carbon Footprint Tracking",
      description:
        "Real-time monitoring of CO2 emissions across all warehouse operations and logistics.",
    },
    {
      icon: Zap,
      title: "Energy Management",
      description:
        "Smart metering integration to optimize power consumption during peak and off-peak hours.",
    },
    {
      icon: Recycle,
      title: "Waste Reduction",
      description:
        "Digital workflows to minimize paper usage and optimize packaging materials.",
    },
    {
      icon: Truck,
      title: "Green Logistics",
      description:
        "Route optimization to reduce fuel consumption and vehicle emissions.",
    },
    {
      icon: Sun,
      title: "Renewable Integration",
      description:
        "Monitor solar and wind inputs, battery storage levels, and grid dependency.",
    },
    {
      icon: Globe,
      title: "ESG Reporting",
      description:
        "Automated generation of environmental impact reports for compliance and stakeholders.",
    },
  ];

  const metrics = [
    {
      category: "Emission Reductions",
      icon: Wind,
      kpis: [
        {
          name: "CO2 Saved",
          value: "1,240T",
          benchmark: "Annual Target",
          status: "good",
        },
        {
          name: "Energy Efficiency",
          value: "+18%",
          benchmark: "YoY growth",
          status: "good",
        },
        {
          name: "Paper Saved",
          value: "450k",
          benchmark: "Sheets/Month",
          status: "good",
        },
      ],
    },
    {
      category: "Resource Management",
      icon: Droplets,
      kpis: [
        {
          name: "Water Usage",
          value: "-12%",
          benchmark: "vs Last Year",
          status: "good",
        },
        {
          name: "Recycling Rate",
          value: "85%",
          benchmark: "Target: 80%",
          status: "good",
        },
        {
          name: "Plastic Reduction",
          value: "2.5T",
          benchmark: "Quarterly",
          status: "good",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 overflow-hidden border-b bg-muted/40">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="w-fit mb-2 border-green-500/30 text-green-700 bg-green-500/10">
              <Leaf className="mr-2 h-3 w-3" />
              Sustainability & ESG
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Green Warehousing
            </h1>
            <p className="text-xl text-muted-foreground">
              Drive environmental impact reduction with enterprise-grade sustainability tracking. Monitor carbon footprints, optimize energy usage, and automate ESG reporting.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                <Link href="/demo">
                  Start Your Green Journey <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to an Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Comprehensive ESG Modules
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our sustainability suite integrates directly with your warehouse operations to provide actionable insights into your environmental impact.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="h-full border-muted hover:border-green-500/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                Measure What Matters
              </h2>
              <p className="text-lg text-muted-foreground">
                Track your progress towards Net Zero with real-time dashboards dedicated to environmental metrics. Ensure compliance with global sustainability standards.
              </p>
              <ul className="space-y-3">
                {[
                  "Automated Carbon Accounting",
                  "Energy Intensity Monitoring",
                  "Waste Stream Analytics",
                  "Supply Chain Sustainability Scoring"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full grid gap-4">
              {metrics.map((metric, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{metric.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {metric.kpis.map((kpi, j) => (
                        <div key={j} className="text-center p-2 rounded-lg bg-muted/50">
                          <div className={`text-xl font-bold ${kpi.status === 'good' ? 'text-green-600' : ''}`}>
                            {kpi.value}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-1">
                            {kpi.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {kpi.benchmark}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-900 via-emerald-900 to-slate-900 text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">
            Ready to Build a Sustainable Future?
          </h2>
          <p className="text-green-100 max-w-2xl mx-auto mb-8 text-lg">
            Join leading enterprises using LogiVox to reduce costs and environmental impact simultaneously.
          </p>
          <Button size="lg" className="bg-white text-green-900 hover:bg-green-50" asChild>
            <Link href="/demo">
              Schedule a Sustainability Audit
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
