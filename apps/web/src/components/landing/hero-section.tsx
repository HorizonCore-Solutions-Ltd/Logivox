"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Play,
  Shield,
  Zap,
  Building2,
  CheckCircle,
  Users,
  BarChart3,
  Clock,
  Star
} from "lucide-react"

export function HeroSection() {
  const stats = [
    { label: "Enterprise Customers", value: "500+" },
    { label: "Stock Items Managed", value: "50M+" },
    { label: "Uptime SLA", value: "99.9%" },
    { label: "Countries Served", value: "40+" },
  ]

  const features = [
    { icon: Shield, label: "Zero-Trust Security" },
    { icon: Zap, label: "Real-time Sync" },
    { icon: Building2, label: "Multi-Tenant" },
    { icon: BarChart3, label: "Advanced Analytics" },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-small-black/[0.2] bg-grid-small-white/[0.2] dark:bg-grid-small-white/[0.2]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-gradient-to-r from-primary-500/20 to-primary-600/20 blur-3xl" />
      </div>

      <div className="container-enterprise relative">
        <div className="flex flex-col items-center text-center space-y-8 py-24 md:py-32">
          {/* Announcement badge */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              New: Advanced ERP Integrations
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Hero headline */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Enterprise
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {" "}Stock Booking{" "}
              </span>
              Platform
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Streamline your inventory management with zero-trust security, 
              real-time synchronization, and seamless ERP integrations. 
              Built for enterprise scale.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center space-x-2 bg-background/50 backdrop-blur-sm border rounded-full px-4 py-2"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="/demo">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Trusted by leading enterprises worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
              {/* Placeholder for company logos */}
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building2 className="h-6 w-6" />
                <span className="font-semibold">Fortune 500</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-6 w-6" />
                <span className="font-semibold">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 w-full max-w-4xl">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}