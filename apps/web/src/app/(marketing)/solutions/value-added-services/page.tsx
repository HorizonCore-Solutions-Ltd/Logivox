"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gift,
  Tag,
  Package,
  Palette,
  FileText,
  Box,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp,
  Award
} from "lucide-react"

export default function ValueAddedServicesPage() {
  const services = [
    {
      icon: Tag,
      title: "Labeling & Tagging",
      description: "Custom labels, price tags, RFID tags, and compliance labeling (GS1, UPC, etc.)."
    },
    {
      icon: Package,
      title: "Kitting & Bundling",
      description: "Product bundling, promotional kits, subscription boxes, and gift sets."
    },
    {
      icon: Palette,
      title: "Custom Packaging",
      description: "Branded packaging, gift wrapping, inserts, and marketing materials."
    },
    {
      icon: FileText,
      title: "Documentation Services",
      description: "Packing slips, invoices, manuals, warranty cards, and custom inserts."
    },
    {
      icon: Box,
      title: "Assembly & Manufacturing",
      description: "Light assembly, product customization, engraving, and embroidery."
    },
    {
      icon: CheckCircle2,
      title: "Quality Inspection",
      description: "Pre-shipment inspection, testing, photography, and condition reporting."
    }
  ]

  const vasTypes = [
    {
      category: "Labeling Services",
      examples: ["Price tag application", "Custom product labels", "RFID tag insertion", "Compliance labels", "Multi-language labels"],
      pricing: "$0.25 - $2.00 per unit"
    },
    {
      category: "Kitting & Bundling",
      examples: ["Promotional bundles", "Subscription boxes", "Gift sets", "Multi-pack creation", "Display-ready pallets"],
      pricing: "$1.50 - $8.00 per kit"
    },
    {
      category: "Custom Packaging",
      examples: ["Gift wrapping", "Branded boxes", "Poly bagging", "Shrink wrapping", "Marketing inserts"],
      pricing: "$0.50 - $5.00 per item"
    },
    {
      category: "Assembly Services",
      examples: ["Product assembly", "Display building", "POP displays", "Hardware kits", "Instructional materials"],
      pricing: "$2.00 - $15.00 per unit"
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-enterprise relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">Value-Added Services</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Transform Products
              <span className="block text-primary mt-2">Generate Revenue</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Labeling, kitting, custom packaging, assembly, and quality inspection services. 
              Turn your warehouse into a profit center with value-added services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?solution=vas">Request Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { label: "Revenue Per Unit", value: "+$3.50" },
                { label: "Service Types", value: "25+" },
                { label: "Accuracy Rate", value: "99.8%" },
                { label: "ROI Increase", value: "+42%" }
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
            <h2 className="text-3xl font-bold mb-4">Complete VAS Portfolio</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional value-added services for every industry
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all">
                <CardHeader>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                      <service.icon className="h-5 w-5" />
                    </div>
                    {service.title}
                  </h3>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Service Categories & Pricing</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {vasTypes.map((vas, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{vas.category}</CardTitle>
                    <Badge variant="secondary">{vas.pricing}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {vas.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{example}</span>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Add Revenue Streams?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Turn your warehouse into a profit center with value-added services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact?solution=vas">Schedule Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
