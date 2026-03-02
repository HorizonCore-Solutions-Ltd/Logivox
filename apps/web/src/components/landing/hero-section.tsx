"use client";

// HeroSection: top-of-funnel hero with proof, benefit stats, and guided paths for Ops, IT/Security, and Finance buyers.

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
  Phone,
  Shield,
} from "lucide-react";

export function HeroSection() {
  const benefits = [
    { label: "489 Production API Endpoints" },
    { label: "42 Specialized Dashboards" },
    { label: "201 Database Tables" },
    { label: "Replenishment v2.0 Beta Live" },
    { label: "AI · IoT · Robotics · Digital Twin" },
  ];

  const stats = [
    { value: "489", label: "API Endpoints", sublabel: "Production Ready" },
    {
      value: "42",
      label: "Dashboards",
      sublabel: "Enterprise Features",
    },
    { value: "99.99%", label: "Uptime SLA", sublabel: "Enterprise Grade" },
    { value: "201", label: "Database Tables", sublabel: "Complete Data Model" },
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/10"
    >
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
            🚀 New: Autonomous Replenishment 2.0 — AI · IoT · Robotics · Digital
            Twin
          </Badge>

          {/* Hero headline */}
          <div className="space-y-6 max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm">
              Enterprise Voice-Native
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent drop-shadow-lg">
                Warehouse Management
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
              Production-ready WMS with 489 API endpoints, 42 specialized
              dashboards, and complete Next-Gen capabilities. Voice-directed
              operations, AI optimization, IoT integration, and robotics
              orchestration — all fully implemented.
            </p>
            <div className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-semibold">
              Built for Fortune 500 companies requiring enterprise-grade
              reliability, security, and unlimited scale.
            </div>
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
              className="text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-105 transition-all font-bold"
              asChild
            >
              <Link href="/contact" aria-label="Request enterprise demo">
                Request Enterprise Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 hover:scale-105 transition-all font-semibold"
              asChild
            >
              <Link href="/contact" aria-label="Contact sales team">
                <Phone className="mr-2 h-5 w-5" />
                Contact Sales
              </Link>
            </Button>
          </div>

          {/* Value props */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">ISO 27001 & SOC 2 Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Production-Ready Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Enterprise Support & SLA</span>
            </div>
          </div>

          {/* Guided paths */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl pt-6">
            {[
              {
                title: "Operations Leader",
                desc: "Improve pick/pack/ship SLAs and reduce errors",
                href: "/demo",
              },
              {
                title: "IT / Security",
                desc: "Review zero-trust scopes, signing, and audits",
                href: "/platform/security",
              },
              {
                title: "Finance / Licensing",
                desc: "Enterprise licensing and deployment models",
                href: "/contact",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex flex-col items-start gap-1 rounded-xl border border-primary/20 bg-card/70 px-4 py-3 hover:border-primary/50 hover:shadow-md transition"
              >
                <span className="text-sm font-semibold text-primary">
                  {item.title}
                </span>
                <span className="text-sm text-foreground">{item.desc}</span>
              </Link>
            ))}
          </div>

          {/* Social proof */}
          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Enterprise proprietary software for Fortune 500 companies and
              global enterprises
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>100% Feature Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🚀 489 Production APIs</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🔒 ISO 27001 & SOC 2 Type II</span>
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
