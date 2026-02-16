"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Play,
  TrendingDown,
  Zap,
  Target,
  CheckCircle,
} from "lucide-react";

export function HeroSection() {
  const benefits = [
    { label: "95% Reduction in Picking Errors" },
    { label: "3x Faster Order Fulfillment" },
    { label: "$52M+ Avg Annual Savings" },
    { label: "936% ROI in First Year" },
  ];

  const stats = [
    { value: "100%", label: "Automation", sublabel: "Eliminate Manual Work" },
    {
      value: "44+",
      label: "Powerful Features",
      sublabel: "Everything You Need",
    },
    { value: "99.99%", label: "Reliability", sublabel: "Always Available" },
    { value: "Zero", label: "IT Headaches", sublabel: "We Handle Everything" },
  ];

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
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-sm font-bold shadow-md border border-primary/20"
            role="status"
            aria-label="Product features announcement"
          >
            🚀 Trusted by 500+ Warehouses • Voice-Enabled • AI-Powered • SOC 2
            Certified
          </Badge>

          {/* Hero headline */}
          <div className="space-y-6 max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm">
              Run Your Warehouse
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent drop-shadow-lg">
                With Your Voice
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
              Join 500+ warehouses that eliminated picking errors and tripled
              fulfillment speed. Complete warehouse management with voice
              commands, AI optimization, and real-time visibility —proven by
              enterprises saving $52M+ annually.
            </p>
          </div>

          {/* Platform stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl pt-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center bg-card border-2 border-primary/20 rounded-lg px-4 py-5 shadow-md hover:shadow-xl hover:border-primary/50 hover:scale-105 transition-all"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-foreground mb-0.5">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>

          {/* ROI benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="flex items-center justify-center space-x-2 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg px-3 py-2.5 shadow-sm hover:shadow-md transition-all"
              >
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-left">
                  {benefit.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-105 transition-all font-bold relative"
              asChild
            >
              <Link href="/sign-up" aria-label="Start your free 30-day trial">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce">
                  No CC
                </span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 hover:scale-105 transition-all font-semibold"
              asChild
            >
              <Link href="/demo" aria-label="Schedule a personalized demo">
                <Play className="mr-2 h-5 w-5" />
                Watch 3-Min Demo
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
          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Trusted by Fortune 500 companies and growing SMBs
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>847 active warehouses today</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⭐ 4.9/5 (180+ reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🔒 SOC 2 & ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
