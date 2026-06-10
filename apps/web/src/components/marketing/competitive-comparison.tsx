"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CloudCog,
  Clock,
  Globe2,
  Mic,
  Network,
  Shield,
  Smartphone,
  Truck,
  Wifi,
} from "lucide-react";

export function CompetitiveComparison() {
  const capabilityPillars = [
    {
      title: "Core Operations",
      icon: Truck,
      description:
        "Inventory, receiving, picking, packing, returns, and yard control in one operational flow.",
      bullets: [
        "Single task model",
        "Real-time visibility",
        "Live execution across sites",
      ],
    },
    {
      title: "Voice & Workforce",
      icon: Mic,
      description:
        "Voice-led work for fast execution, hybrid choice training, and hands-free floor productivity.",
      bullets: [
        "Primary operating interface",
        "Hybrid choice modes",
        "Operator guidance",
      ],
    },
    {
      title: "Intelligence & Automation",
      icon: Brain,
      description:
        "AI guidance, forecasting, and anomaly detection with enough context for teams to trust the recommendation.",
      bullets: ["Decision insights", "Forecasting", "Anomaly detection"],
    },
    {
      title: "Compliance & Quality",
      icon: Shield,
      description:
        "CAPA, inspections, audit trails, document governance, and recovery loops that keep operations accountable.",
      bullets: ["CAPA loop", "Audit readiness", "Traceable actions"],
    },
    {
      title: "Integration & Ecosystem",
      icon: Network,
      description:
        "ERP connectors, IoT devices, APIs, and validated schema mappings keep LogiVox aligned with existing systems.",
      bullets: ["ERP connections", "API access", "IoT support"],
    },
    {
      title: "Resilience Layer",
      icon: Wifi,
      description:
        "Retry queues, offline recovery, and workflow replay help teams keep working when systems or networks degrade.",
      bullets: ["Retry handling", "Offline sync", "Workflow replay"],
    },
  ];

  const proofPoints = [
    { value: "Live", label: "System health", icon: CloudCog },
    { value: "Trace", label: "Audit trail", icon: Shield },
    { value: "Guide", label: "AI transparency", icon: BarChart3 },
    { value: "Fast", label: "Deployment", icon: Clock },
    { value: "Mobile", label: "Floor access", icon: Smartphone },
    { value: "Connected", label: "Integrations", icon: Globe2 },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Badge className="mb-2">Enterprise platform pillars</Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything LogiVox is built to do
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          The platform is organized around the outcomes enterprise buyers care
          about most: control, visibility, recovery, and clean integration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {capabilityPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card
              key={pillar.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{pillar.title}</CardTitle>
                <CardDescription>{pillar.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pillar.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-8 pb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proofPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{point.value}</div>
                  <div className="text-sm font-semibold">{point.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>How the platform presents value</CardTitle>
            <CardDescription>
              Focused on operator speed, leader visibility, and technical trust.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              LogiVox is designed to help teams run the warehouse without
              cluttered messaging or feature overload.
            </p>
            <p>
              Public positioning should stay on outcomes: faster execution,
              fewer errors, stronger audit readiness, and smoother deployment.
            </p>
            <p>
              Technical depth belongs in documentation; the marketing layer
              should stay clear and buyer-friendly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>
              Move from browsing to a working session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/contact">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
