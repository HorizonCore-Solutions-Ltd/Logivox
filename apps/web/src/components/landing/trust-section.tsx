"use client";

// TrustSection: social proof, ROI stats, guarantees, and testimonial cues to reduce buyer risk perception.

import * as React from "react";
import {
  Shield,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrustSection() {
  const stats = [
    {
      value: "Hours",
      label: "To go live",
      description: "With setup and validation scripts",
      icon: DollarSign,
      color: "from-green-500/10 to-green-600/10",
    },
    {
      value: "Trace",
      label: "Every action",
      description: "User, timestamp, response, and voice intent",
      icon: TrendingDown,
      color: "from-blue-500/10 to-blue-600/10",
    },
    {
      value: "Replay",
      label: "Failure recovery",
      description: "Retries, rollback, and offline sync visibility",
      icon: Zap,
      color: "from-purple-500/10 to-purple-600/10",
    },
    {
      value: "Live",
      label: "System observability",
      description: "Health, latency, queues, and workflow logs",
      icon: Shield,
      color: "from-orange-500/10 to-orange-600/10",
    },
  ];

  const guarantees = [
    {
      title: "Data Governance & Isolation",
      description:
        "Tenant boundaries, encryption, backup/restore, and export controls are explicit and visible to buyers.",
      icon: Shield,
    },
    {
      title: "Deployment Simplicity",
      description:
        "One-command setup, environment validation, and health checks reduce the risk of a difficult rollout.",
      icon: CheckCircle,
    },
    {
      title: "Resilience by Design",
      description:
        "Failed API calls, IoT signals, and voice commands can retry safely without losing operational continuity.",
      icon: Clock,
    },
  ];

  return (
    <section
      id="trust"
      className="py-20 md:py-28 border-y bg-gradient-to-br from-muted/30 to-muted/10"
    >
      <div className="container-enterprise">
        {/* Logo band */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground/80">Trusted by</span>
          <span className="px-3 py-1 rounded-full bg-muted/80">
            Aurora Logistics
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/80">
            NorthPeak Retail
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/80">
            MedChain Health
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/80">
            Titan Manufacturing
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/80">Swift 3PL</span>
        </div>
        {/* Stats Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              ✅ Enterprise trust signals
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Enterprise confidence comes from
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                visibility and control
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Prospective customers need clear proof of observability,
              traceability, resilience, and safe deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="relative overflow-hidden hover:shadow-xl transition-all hover:scale-105"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color}`}
                />
                <CardContent className="pt-8 pb-8 relative text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-lg mb-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Non-negotiable enterprise requirements
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed for mission-critical teams that need governance, audit,
              resilience, and deployment confidence before anything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guarantees.map((item) => (
              <Card
                key={item.title}
                className="hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Highlights */}
        <div className="mt-20 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">Core</div>
              <div className="text-sm font-semibold mb-1">Five domains</div>
              <div className="text-xs text-muted-foreground">
                Operations, intelligence, compliance, workforce, ecosystem
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">Control</div>
              <div className="text-sm font-semibold mb-1">Observability</div>
              <div className="text-xs text-muted-foreground">
                Health, logs, replay, and AI decision visibility
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">Trust</div>
              <div className="text-sm font-semibold mb-1">
                Traceable by design
              </div>
              <div className="text-xs text-muted-foreground">
                Every action, response, and recovery path recorded
              </div>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="mt-16 mb-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">MH</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    "LogiVox reduced our picking errors by 94% and cut
                    fulfillment time from 2 days to 4 hours. The voice commands
                    are game-changing for our busy warehouse floor."
                  </p>
                  <div>
                    <p className="font-semibold text-sm">Michael Harrison</p>
                    <p className="text-xs text-muted-foreground">
                      Operations Director, MedSupply Corp
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">SL</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    "We eliminated $2.3M in inventory shrinkage with LogiVox's
                    real-time tracking. ROI was 890% in first year alone."
                  </p>
                  <div>
                    <p className="font-semibold text-sm">Sarah Lopez</p>
                    <p className="text-xs text-muted-foreground">
                      VP Operations, TechFlow Manufacturing
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Enterprise-grade security trusted by Fortune 500 companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["SOC 2 Type II", "ISO 27001", "GDPR", "HIPAA", "CCPA"].map(
              (cert) => (
                <Badge
                  key={cert}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  <Shield className="h-3 w-3 mr-2 inline" />
                  {cert}
                </Badge>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
