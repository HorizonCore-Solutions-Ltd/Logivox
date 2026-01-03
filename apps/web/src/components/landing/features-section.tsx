"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield,
  Zap,
  Building2,
  BarChart3,
  Users,
  Lock,
  Globe,
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Activity,
  Settings,
  Package,
  Truck,
  ClipboardCheck,
  Boxes,
  LayoutGrid,
  ScanBarcode
} from "lucide-react"

export function FeaturesSection() {
  const primaryFeatures = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Complete inventory control with multi-warehouse tracking, lot/serial numbers, cycle counting, and automated reorder alerts.",
      features: [
        "Multi-warehouse tracking",
        "Lot & serial number management",
        "Cycle counting & audits",
        "Automated reorder points"
      ],
      badge: "Core WMS",
      color: "from-blue-500/20 to-blue-600/20"
    },
    {
      icon: Boxes,
      title: "Order Fulfillment",
      description: "Streamlined order processing with wave picking, batch operations, packing workflows, and shipping integrations.",
      features: [
        "Wave & batch picking",
        "Pick-pack-ship workflows",
        "Carrier integrations",
        "Returns (RMA) processing"
      ],
      badge: "Operations",
      color: "from-green-500/20 to-green-600/20"
    },
    {
      icon: LayoutGrid,
      title: "Warehouse Operations",
      description: "Complete WMS features including receiving, putaway, location management, cross-docking, and task automation.",
      features: [
        "Receiving & putaway",
        "Location management",
        "Cross-docking support",
        "Task automation"
      ],
      badge: "Warehouse",
      color: "from-purple-500/20 to-purple-600/20"
    },
    {
      icon: ClipboardCheck,
      title: "Quality Control",
      description: "Built-in QC workflows with inspection templates, checkpoints, approvals, and compliance tracking.",
      features: [
        "Inspection templates",
        "QC checkpoints",
        "Approval workflows",
        "Compliance reporting"
      ],
      badge: "Quality",
      color: "from-orange-500/20 to-orange-600/20"
    }
  ]

  const additionalFeatures = [
    {
      icon: Activity,
      title: "AI Assistant (Public & Logged-In)",
      description: "Intelligent AI assistant available on all public pages (no internet required) and tenant-aware AI for logged-in users."
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "AES-256 encryption, zero-trust architecture, SOC 2 Type II, ISO 27001, and continuous security monitoring."
    },
    {
      icon: Clock,
      title: "Advanced Business Continuity",
      description: "99.99% uptime SLA, automated failover, disaster recovery, real-time backups, and multi-region redundancy."
    },
    {
      icon: ScanBarcode,
      title: "Mobile Scanning",
      description: "iOS & Android apps with barcode scanning for receiving, picking, counting, and transfers."
    },
    {
      icon: Settings,
      title: "Assembly & Kitting",
      description: "BOM management, component tracking, assembly orders, and production workflows."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards, inventory turnover, demand forecasting, and custom reports."
    },
    {
      icon: Truck,
      title: "Shipping Integration",
      description: "Integrated carrier management for FedEx, UPS, USPS with rate shopping and tracking."
    },
    {
      icon: Database,
      title: "E-commerce Sync",
      description: "Real-time integration with Shopify, WooCommerce, Magento, and custom platforms."
    },
    {
      icon: Lock,
      title: "Zero-Trust Security",
      description: "Never trust, always verify. End-to-end encryption, MFA, biometric auth, and complete audit trails."
    }
  ]

  return (
    <section className="py-24 bg-background">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Complete WMS features for
            <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              modern warehouses
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            LogiVox delivers a comprehensive warehouse management system with inventory control, 
            order fulfillment, quality management, and powerful integrations.
          </p>
        </div>

        {/* Primary features grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {primaryFeatures.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden border-2 hover:border-primary/20 transition-colors">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-50`} />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {feature.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed mt-4">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {additionalFeatures.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Integration showcase */}
        <div className="text-center space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Connect with your e-commerce and business tools
            </h3>
            <p className="text-muted-foreground mb-8">
              Seamless integrations with leading platforms to power your warehouse operations
            </p>
          </div>

          {/* Integration logos/icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {[
              { name: "Shopify", icon: Database },
              { name: "WooCommerce", icon: Building2 },
              { name: "QuickBooks", icon: Globe },
              { name: "FedEx", icon: Truck },
              { name: "Stripe", icon: Settings },
              { name: "REST API", icon: Activity },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <integration.icon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{integration.name}</span>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <Button size="lg" variant="outline" asChild>
              <Link href="/integrations">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}