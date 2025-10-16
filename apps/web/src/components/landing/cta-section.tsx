"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight,
  Play,
  CheckCircle,
  Calendar,
  Sparkles,
  Rocket
} from "lucide-react"

export function CTASection() {
  const benefits = [
    "No credit card required",
    "14-day free trial",
    "Cancel anytime",
    "Setup in minutes"
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-primary-500/5 to-background" />
      <div className="absolute inset-0 bg-grid-small-black/[0.2] dark:bg-grid-small-white/[0.2]" />

      <div className="container-enterprise relative">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Card */}
          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-12 shadow-xl backdrop-blur-sm">
            <div className="text-center space-y-6">
              {/* Badge */}
              <div className="flex justify-center">
                <Badge className="px-4 py-2 text-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Start Your Free Trial Today
                </Badge>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Ready to transform your
                  <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    inventory management?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join hundreds of enterprises who have streamlined their operations 
                  with FlowStock. Experience the power of enterprise-grade inventory 
                  management today.
                </p>
              </div>

              {/* Benefits list */}
              <div className="flex flex-wrap justify-center gap-6 py-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow" asChild>
                  <Link href="/sign-up">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2" 
                  asChild
                >
                  <Link href="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2" 
                  asChild
                >
                  <Link href="/contact">
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Call
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="pt-8 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Join 500+ enterprises already using FlowStock
                </p>
                <div className="flex justify-center items-center space-x-8 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>SOC 2 Certified</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>GDPR Compliant</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
              <div className="text-2xl font-bold mb-2">500+</div>
              <div className="text-sm text-muted-foreground">
                Enterprise customers worldwide
              </div>
            </div>
            <div className="text-center p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
              <div className="text-2xl font-bold mb-2">50M+</div>
              <div className="text-sm text-muted-foreground">
                Stock items managed daily
              </div>
            </div>
            <div className="text-center p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
              <div className="text-2xl font-bold mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">
                Expert support available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </section>
  )
}
