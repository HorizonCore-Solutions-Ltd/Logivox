"use client";

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
      value: "$52M+",
      label: "Average Savings Per Year",
      description: "For enterprise customers",
      icon: DollarSign,
      color: "from-green-500/10 to-green-600/10",
    },
    {
      value: "936%",
      label: "Return on Investment",
      description: "In your first year",
      icon: TrendingDown,
      color: "from-blue-500/10 to-blue-600/10",
    },
    {
      value: "99.99%",
      label: "Always Available",
      description: "Rock-solid reliability",
      icon: Zap,
      color: "from-purple-500/10 to-purple-600/10",
    },
    {
      value: "24/7",
      label: "Expert Support",
      description: "We're here when you need us",
      icon: Shield,
      color: "from-orange-500/10 to-orange-600/10",
    },
  ];

  const guarantees = [
    {
      title: "Bank-Level Security",
      description: "Your data is protected with the same security banks use. SOC 2 and ISO 27001 certified with automatic threat protection.",
      icon: Shield,
    },
    {
      title: "30-Day Free Trial",
      description: "Try everything with no commitments. No credit card required. Get full access to all features from day one.",
      icon: CheckCircle,
    },
    {
      title: "Setup in Hours, Not Months",
      description: "Start using LogiVox the same day. Pre-built workflows and smart setup get you running fast.",
      icon: Clock,
    },
  ];

  return (
    <section className="py-20 md:py-28 border-y bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="container-enterprise">
        {/* Stats Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Proven Results
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Real numbers from
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                real customers
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join enterprises saving millions with LogiVox's comprehensive platform
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
              Enterprise-Grade Guarantees
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for mission-critical operations with zero compromises on security, performance, or reliability
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
              <div className="text-3xl font-bold mb-2">Complete</div>
              <div className="text-sm font-semibold mb-1">Everything Included</div>
              <div className="text-xs text-muted-foreground">From receiving to shipping</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">44+</div>
              <div className="text-sm font-semibold mb-1">Powerful Features</div>
              <div className="text-xs text-muted-foreground">Quality, returns, optimization & more</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">Instant</div>
              <div className="text-sm font-semibold mb-1">Lightning Fast</div>
              <div className="text-xs text-muted-foreground">Global performance, no lag</div>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Trusted by enterprises worldwide. Certified and compliant.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["SOC 2 Type II", "ISO 27001", "GDPR", "HIPAA", "CCPA"].map((cert) => (
              <Badge key={cert} variant="outline" className="px-4 py-2 text-sm">
                <Shield className="h-3 w-3 mr-2 inline" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
