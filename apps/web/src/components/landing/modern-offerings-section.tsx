"use client";

// ModernOfferingsSection: highlights new differentiated capabilities with deep dives and demo CTAs.

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Brain, Activity, Truck, GitMerge } from "lucide-react";

const offerings = [
  {
    title: "Predictive Ops & Anomaly Defense",
    description:
      "Catch bad signals before they hit customers with burn alerts, rollbacks, and SLO dashboards tuned for pick/pack/ship.",
    icon: Activity,
    href: "/features",
    pill: "Production",
  },
  {
    title: "Offline Voice & Edge Resilience",
    description:
      "Keep voice + scans working when Wi-Fi drops. Queue changes and sync cleanly when you’re back online.",
    icon: Zap,
    href: "/features",
    pill: "Live",
  },
  {
    title: "Copilot Over Your SOPs",
    description:
      "Tenant-aware RAG that surfaces your SOPs inline with citations, so teams execute perfectly the first time.",
    icon: Brain,
    href: "/features",
    pill: "AI",
  },
  {
    title: "Zero-Trust, Reliable Webhooks",
    description:
      "Per-warehouse scopes, signed webhooks, retries + dead letters, and SIEM-friendly audit streaming.",
    icon: Shield,
    href: "/features",
    pill: "Security",
  },
  {
    title: "Marshalling & Yard Add-On",
    description:
      "Yard slots, dock scheduling, and load marshalling — with 1-tap mobile quick actions for marshallers. Activated per-tenant; invisible to users who don't have the licence.",
    icon: GitMerge,
    href: "/solutions/yard-management",
    pill: "Add-On",
  },
  {
    title: "Last Mile Delivery Add-On",
    description:
      "Driver dispatch, route management, and proof-of-delivery — surfaced as quick actions directly on delivery list cards. Separately licensed for fleets.",
    icon: Truck,
    href: "/features",
    pill: "Add-On",
  },
];

export function ModernOfferingsSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container-enterprise space-y-6">
        <div className="space-y-2 text-center">
          <Badge variant="secondary">Enterprise Capabilities</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Next-Generation Features in Production
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Advanced capabilities fully deployed and battle-tested - voice
            operations, AI optimization, IoT integration, and enterprise
            security all live and operational.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offerings.map((item) => (
            <Card
              key={item.title}
              className="group h-full border-2 border-transparent hover:border-primary/40 transition"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                {item.pill && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    {item.pill}
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    Explore feature details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    Request demo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
