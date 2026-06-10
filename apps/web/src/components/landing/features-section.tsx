"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Truck,
  ClipboardCheck,
  Users,
  BarChart3,
  Boxes,
  ScanBarcode,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export function FeaturesSection() {
  const coreModules = [
    {
      title: "Core Operations",
      description:
        "Inventory, receiving, picking, packing, returns, and dock flow organized as one operational backbone.",
      badge: "Core",
      icon: ClipboardCheck,
      color: "from-blue-500/10 to-blue-600/10",
      features: [
        "Inventory control",
        "Receiving and putaway",
        "Picking and packing",
        "Returns and dock flow",
        "Yard and transfer coordination",
        "Single operational view",
      ],
    },
    {
      title: "Intelligence & Automation",
      description:
        "AI recommendations, forecasting, anomaly detection, workflow optimization, and decision support that keep the operation moving.",
      badge: "Intelligence",
      icon: ScanBarcode,
      color: "from-green-500/10 to-green-600/10",
      features: [
        "AI recommendations",
        "Forecasting",
        "Anomaly detection",
        "Workflow optimization",
        "Digital twin planning",
        "Decision insights",
      ],
    },
    {
      title: "Compliance & Quality",
      description:
        "CAPA, inspections, document control, audit trails, and recurrence prevention designed for regulated environments.",
      badge: "Compliance",
      icon: Package,
      color: "from-purple-500/10 to-purple-600/10",
      features: [
        "CAPA workflow",
        "Quality control",
        "Audit evidence",
        "Root cause tracking",
        "Document governance",
        "Prevention loops",
      ],
    },
    {
      title: "Voice & Workforce",
      description:
        "Voice OS, labor management, task orchestration, and skill-aware execution that adapts to the operator.",
      badge: "Voice",
      icon: Truck,
      color: "from-orange-500/10 to-orange-600/10",
      features: [
        "Voice-directed work",
        "Hybrid choice modes",
        "Task optimization",
        "Labor visibility",
        "Skill tracking",
        "Hands-free execution",
      ],
    },
    {
      title: "Integration & Ecosystem",
      description:
        "Certified enterprise connectors, API access, IoT, robotics, and ERP synchronization for the systems you already run.",
      badge: "Ecosystem",
      icon: Boxes,
      color: "from-cyan-500/10 to-cyan-600/10",
      features: [
        "ERP connectors",
        "IoT and devices",
        "Robotics readiness",
        "Schema validation",
        "Retry handling",
        "Mapping templates",
      ],
    },
  ];

  const advancedCapabilities = [
    {
      title: "System Control Center",
      description:
        "A central view for latency, workflow execution, queue health, replay, and the live event stream behind every action.",
      icon: BarChart3,
      highlights: ["Live system health", "Workflow replay", "Queue visibility"],
    },
    {
      title: "AI Decision Insights",
      description:
        "Show the input data, reasoning summary, and confidence behind each recommendation so teams can trust the output.",
      icon: Zap,
      highlights: ["Input data", "Reasoning summary", "Confidence level"],
    },
    {
      title: "Workflow Visualizer",
      description:
        "Make congestion, picking flow, and task routing visible so leaders can see where throughput stalls before it spreads.",
      icon: CheckCircle,
      highlights: ["Picking flow", "Congestion heatmaps", "Task routing"],
    },
    {
      title: "Resilience Engine",
      description:
        "Retry queues, circuit breakers, offline recovery, and safe rollback behavior for failed API calls, IoT signals, and voice commands.",
      icon: Shield,
      highlights: ["Retries", "Circuit breakers", "Offline recovery"],
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-muted/30 to-background"
    >
      <div className="container-enterprise">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="mb-4">
            🏆 Clear enterprise operating model
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Five domains, one platform
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              built for clarity and control
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Internally the system can keep growing. Externally the story stays
            simple: core operations, intelligence, compliance, workforce, and
            ecosystem.
          </p>
        </div>

        {/* Core modules grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Clear operating domains
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreModules.map((module) => (
              <Card
                key={module.title}
                className="relative overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${module.color}`}
                />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 gap-2">
                    {module.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-1.5 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced capabilities */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Trust and resilience layers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedCapabilities.map((capability) => (
              <Card
                key={capability.title}
                className="hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <capability.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{capability.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {capability.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {capability.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Built for your success */}
        <div className="mt-16 space-y-8">
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold">
              Built for enterprise confidence
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Production-ready execution with observability, auditability, and
              safe recovery built into the operating model.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: "Live",
                label: "System health",
                helper: "Latency, events, and queues",
              },
              {
                value: "Replay",
                label: "Workflow recovery",
                helper: "Retry and rollback visibility",
              },
              {
                value: "Trace",
                label: "Auditability",
                helper: "Action, user, timestamp, response",
              },
              {
                value: "Guide",
                label: "AI transparency",
                helper: "Inputs, reasoning, confidence",
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {item.value}
                </div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  {item.helper}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/50 rounded-lg p-6">
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Audit Traceability</h4>
              <p className="text-sm text-muted-foreground">
                Every action is tied to a user, timestamp, and system response.
                Voice commands can also store transcript, interpreted intent,
                and executed action.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <BarChart3 className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">System Control Center</h4>
              <p className="text-sm text-muted-foreground">
                Live dashboards for health, logs, workflow replay, queue
                visibility, and AI decision insights.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Resilience Engine</h4>
              <p className="text-sm text-muted-foreground">
                Intelligent retries, circuit breakers, offline recovery, and
                safe workflow rollback keep operations moving during failures.
              </p>
            </div>
          </div>
        </div>

        {/* Integration ecosystem */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Certified enterprise connectors
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Keep existing systems in place with validated mappings, schema
            checks, retry handling, and clear integration ownership.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Shopify",
              "WooCommerce",
              "SAP",
              "Oracle",
              "QuickBooks",
              "NetSuite",
              "FedEx",
              "UPS",
              "USPS",
              "DHL",
              "Salesforce",
              "Microsoft Dynamics",
            ].map((integration) => (
              <div
                key={integration}
                className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-sm">{integration}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/platform/integrations"
              className="inline-flex items-center text-primary hover:underline font-medium"
            >
              View all integrations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
