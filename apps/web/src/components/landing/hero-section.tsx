"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Play,
  TrendingDown,
  Zap,
  Target,
  CheckCircle
} from "lucide-react"

export function HeroSection() {
  const benefits = [
    { label: "Reduce Picking Errors by 95%" },
    { label: "Speed Up Order Fulfillment 3x" },
    { label: "Cut Labor Costs by 40%" },
    { label: "Scale Without Adding Staff" },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/10">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[700px] w-[700px] rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-transparent blur-3xl" />
      </div>

      <div className="container-enterprise relative">
        <div className="flex flex-col items-center text-center space-y-8 py-20 md:py-28 lg:py-32">
          {/* Announcement badge */}
          <Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold shadow-md border border-primary/20">
            🎯 Complete Warehouse Management • Pay Only $49/user
          </Badge>

          {/* Hero headline */}
          <div className="space-y-6 max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm">
              Stop Losing Money to
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent drop-shadow-lg">
                Warehouse Chaos
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
              LogiVox eliminates picking errors, speeds up fulfillment, and cuts labor costs—so you can grow 
              your business without drowning in operational complexity.
            </p>
          </div>

          {/* Problem-solving benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl pt-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="flex items-center justify-center space-x-2 bg-card border-2 border-primary/20 rounded-lg px-3 py-3 shadow-md hover:shadow-lg hover:border-primary/50 hover:scale-105 transition-all"
              >
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-left">{benefit.label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button size="lg" className="text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-105 transition-all font-bold" asChild>
              <Link href="/sign-up">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:scale-105 transition-all font-semibold" asChild>
              <Link href="/demo">
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Value props */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Setup in hours, not months</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="font-medium">Most affordable in the market</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">No long-term contracts</span>
            </div>
          </div>

          {/* Social proof */}
          <p className="text-sm text-muted-foreground pt-4">
            Join growing businesses who've eliminated warehouse chaos with LogiVox
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}