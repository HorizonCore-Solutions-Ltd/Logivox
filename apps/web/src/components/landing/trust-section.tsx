"use client"

import * as React from "react"
import { 
  Building2,
  Shield,
  Clock,
  Award,
  Globe,
  TrendingUp,
  Users,
  Zap,
  CheckCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TrustSection() {
  const stats = [
    {
      value: "500+",
      label: "Enterprise Customers",
      icon: Building2,
      description: "Fortune 500 companies trust LogiVox"
    },
    {
      value: "50M+",
      label: "Stock Items Managed",
      icon: TrendingUp,
      description: "Billions of transactions processed"
    },
    {
      value: "99.9%",
      label: "Uptime SLA",
      icon: Zap,
      description: "Industry-leading reliability"
    },
    {
      value: "40+",
      label: "Countries Served",
      icon: Globe,
      description: "Global presence and support"
    }
  ]

  const certifications = [
    {
      name: "SOC 2 Type II",
      icon: Shield,
      description: "Security and availability controls"
    },
    {
      name: "ISO 27001",
      icon: Award,
      description: "Information security management"
    },
    {
      name: "GDPR Compliant",
      icon: CheckCircle,
      description: "Data privacy protection"
    },
    {
      name: "HIPAA Ready",
      icon: Shield,
      description: "Healthcare data security"
    }
  ]

  const customerLogos = [
    { name: "Acme Manufacturing", industry: "Manufacturing" },
    { name: "Global Retail Corp", industry: "Retail" },
    { name: "TechVentures Inc", industry: "Technology" },
    { name: "HealthCare Systems", industry: "Healthcare" },
    { name: "FinServe Solutions", industry: "Financial Services" },
    { name: "Logistics Masters", industry: "Logistics" }
  ]

  return (
    <section className="py-16 bg-muted/30 border-y">
      <div className="container-enterprise">
        {/* Trust headline */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Trusted by Industry Leaders
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Join thousands of companies worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From startups to Fortune 500 enterprises, LogiVox powers mission-critical 
            inventory operations across the globe.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium mb-2">{stat.label}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer logos */}
        <div className="mb-16">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted across industries
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {customerLogos.map((customer) => (
              <div
                key={customer.name}
                className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-2">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium text-center">
                  {customer.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {customer.industry}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">
              Security & Compliance Certifications
            </h3>
            <p className="text-muted-foreground text-sm">
              Enterprise-grade security and compliance standards
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex flex-col items-center text-center p-4 rounded-lg border bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <cert.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold mb-1">{cert.name}</div>
                <div className="text-xs text-muted-foreground">
                  {cert.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 24/7 Support callout */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">24/7 Expert Support</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Dedicated Success Manager</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Enterprise SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
