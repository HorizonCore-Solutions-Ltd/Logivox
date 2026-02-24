"use client";

// ModernOfferingsSection: highlights new differentiated capabilities with deep dives and demo CTAs.

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Brain, Waves, Activity } from "lucide-react";

const offerings = [
  {
    title: "Predictive Ops & Anomaly Defense",
    description:
      "Catch bad signals before they hit customers with burn alerts, rollbacks, and SLO dashboards tuned for pick/pack/ship.",
    icon: Activity,
    href: "/blog/predictive-ops-anomaly-defense",
    pill: "New",
  },
  {
    title: "Offline Voice & Edge Resilience",
    description:
      "Keep voice + scans working when Wi-Fi drops. Queue changes and sync cleanly when you’re back online.",
    icon: Zap,
    href: "/blog/offline-voice-edge-warehouses",
    pill: "Floor-tested",
  },
  {
    title: "Copilot Over Your SOPs",
    description:
      "Tenant-aware RAG that surfaces your SOPs inline with citations, so teams execute perfectly the first time.",
    icon: Brain,
    href: "/blog/copilot-sops-rag",
    pill: "AI",
  },
  {
    title: "Zero-Trust, Reliable Webhooks",
    description:
      "Per-warehouse scopes, signed webhooks, retries + dead letters, and SIEM-friendly audit streaming.",
    icon: Shield,
    href: "/blog/zero-trust-warehouse-security",
    pill: "Security",
  },
];

export function ModernOfferingsSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container-enterprise space-y-6">
        <div className="space-y-2 text-center">
          <Badge variant="secondary">What’s New</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Modern Logistics Without the Risk
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Reliability, security, and speed baked into voice, automation, and
            integrations—ready for the floor and the boardroom.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                    Read the deep dive
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    Book a session
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
