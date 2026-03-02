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
  Brain,
  Bot,
  Wifi,
  Coins,
  ArrowRight,
  Zap,
  Cpu,
  LineChart,
} from "lucide-react";
import Image from "next/image";

export function NextGenSection() {
  const features = [
    {
      title: "Predictive AI Replenishment",
      description:
        "Stop reacting to stockouts. Our AI engine analyzes historical sales, seasonality, and market trends to predict demand spikes before they happen.",
      badge: "Beta 2.0",
      isCustomIcon: true,
      iconPath: "/logivox-logo.svg",
      icon: Brain,
      color: "from-purple-500/10 to-purple-600/10",
      iconColor: "text-purple-600",
      features: [
        "Seasonality detection",
        "Weather-impact analysis",
        "Auto-generated POs",
        "Look-ahead wave planning",
      ],
    },
    {
      title: "Robotics Orchestration",
      description:
        "Seamlessly dispatch Autonomous Mobile Robots (AMRs) for replenishment tasks. Supports multi-fleet coordination and traffic management.",
      badge: "New",
      isCustomIcon: false,
      iconPath: null,
      icon: Bot,
      color: "from-orange-500/10 to-orange-600/10",
      iconColor: "text-orange-600",
      features: [
        "Fleet interoperability",
        "Automated mission dispatch",
        "Battery management",
        "Path optimization",
      ],
    },
    {
      title: "IoT Smart Shelves",
      description:
        "Turn dumb racking into digital twins. Weight sensors detect inventory changes in real-time, triggering instant replenishment signals.",
      badge: "IoT",
      isCustomIcon: false,
      iconPath: null,
      icon: Wifi,
      color: "from-cyan-500/10 to-cyan-600/10",
      iconColor: "text-cyan-600",
      features: [
        "Weight-based triggers",
        "Real-time level monitoring",
        "Anomaly detection",
        "Dead-zone alerts",
      ],
    },
    {
      title: "Cost-Optimized Auto-Billing",
      description:
        "Slash labor costs by 30%. The system schedules labor-intensive replenishment tasks during off-peak hours automatically.",
      badge: "Finance",
      isCustomIcon: false,
      iconPath: null,
      icon: Coins,
      color: "from-green-500/10 to-green-600/10",
      iconColor: "text-green-600",
      features: [
        "Peak-hour avoidance",
        "Labor rate integration",
        "Energy usage optimization",
        "Cost-per-pick analytics",
      ],
    },
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <Badge
            variant="outline"
            className="h-6 px-3 text-sm border-primary/20 bg-primary/5 text-primary"
          >
            <Zap className="mr-2 h-3 w-3 fill-primary" />
            Just Released
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
            Next-Gen Replenishment
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Upgrade your warehouse to a fully autonomous digital twin. Leverage
            AI, Robotics, and IoT to eliminate manual planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${feature.color}`}
                  >
                    {feature.isCustomIcon ? (
                      <div className="h-6 w-6 relative">
                        <Image
                          src={feature.iconPath!}
                          alt={feature.title}
                          fill
                          className="object-contain logo-mark-filter"
                        />
                      </div>
                    ) : (
                      <feature.icon
                        className={`h-6 w-6 ${feature.iconColor}`}
                      />
                    )}
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl pt-2">{feature.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-2">
                  {feature.features.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center text-sm text-muted-foreground"
                    >
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/auth/register">
            <span className="inline-flex items-center justify-center h-10 px-8 text-sm font-medium text-primary-foreground transition-colors bg-primary rounded-md shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Try the Digital Twin
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
