"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Shield,
  Users,
  DollarSign,
  BarChart3,
  Lock,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Zap,
  Database,
  Settings
} from "lucide-react"

export default function ThreePLPage() {
  const features = [
    {
      icon: Shield,
      title: "Complete Data Isolation",
      description: "Each client's data is completely segregated with no cross-contamination or visibility."
    },
    {
      icon: DollarSign,
      title: "Client-Specific Billing",
      description: "Flexible billing models: per unit, per pallet, per order, or custom fee structures."
    },
    {
      icon: Users,
      title: "Multi-Client Visibility",
      description: "Separate portals for each client with branded dashboards and custom reporting."
    },
    {
      icon: FileText,
      title: "SLA Management",
      description: "Track and enforce client-specific SLAs with automated alerts and performance reporting."
    },
    {
      icon: BarChart3,
      title: "Client Analytics",
      description: "Individual client dashboards with inventory, orders, and performance metrics."
    },
    {
      icon: Settings,
      title: "Custom Workflows",
      description: "Client-specific processes, rules, and quality standards within shared warehouse."
    }
  ]

  const capabilities = [
    {
      title: "Inventory Segregation",
      items: ["Physical location separation", "Logical data partitioning", "Client-specific SKUs", "Lot/serial isolation", "Zero mix risk"]
    },
    {
      title: "Billing Automation",
      items: ["Activity-based costing", "Storage charges", "Handling fees", "Value-added services", "Monthly invoicing"]
    },
    {
      title: "Client Portals",
      items: ["Real-time inventory", "Order tracking", "Custom reports", "Document library", "Performance metrics"]
    },
    {
      title: "SLA Enforcement",
      items: ["Inbound processing times", "Order fulfillment SLAs", "Accuracy targets", "On-time shipping", "Quality standards"]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-enterprise relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">3PL Multi-Client Operations</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Purpose-Built for 3PL
              <span className="block text-primary mt-2">Multi-Client Excellence</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Complete client segregation, flexible billing, branded portals, and SLA management. 
              Manage unlimited clients in one warehouse with enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?solution=3pl">Request Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { label: "Data Isolation", value: "100%" },
                { label: "Client Portals", value: "Branded" },
                { label: "Billing Models", value: "20+" },
                { label: "SLA Tracking", value: "Real-time" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete 3PL Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run a modern 3PL operation
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all">
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

      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">3PL-Specific Capabilities</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {capabilities.map((cap, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{cap.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {cap.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-enterprise text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Scale Your 3PL Business?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join leading 3PLs managing multiple clients with LogiVox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact?solution=3pl">Schedule Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
