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
  GitMerge,
  Cpu,
  Route,
  Timer,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  BarChart2,
  ListTodo,
} from "lucide-react";

export default function TaskInterleavingPage() {
  const features = [
    {
      icon: GitMerge,
      title: "Smart Interleaving",
      description:
        "Automatically combine put-away and picking tasks to eliminate deadheading and reduce travel time by up to 40%.",
    },
    {
      icon: Cpu,
      title: "AI-Driven Dispatch",
      description:
        "Assign tasks based on worker location, equipment type, and priority, ensuring the right person does the right job.",
    },
    {
      icon: Route,
      title: "Path Optimization",
      description:
        "Calculate the most efficient route through the warehouse for every batch of tasks to maximize throughput.",
    },
    {
      icon: Layers,
      title: "Multi-Zone Coordination",
      description:
        "Seamlessly hand off tasks between zones and equipment types (e.g., forklift to conveyor) without bottlenecks.",
    },
    {
      icon: ListTodo,
      title: "Dynamic Prioritization",
      description:
        "Real-time adjustments to task queues based on urgent orders, truck arrivals, or inventory levels.",
    },
    {
      icon: Timer,
      title: "Deadhead Reduction",
      description:
        "Ensure every trip counts. Workers never travel empty-handed with intelligent backhaul assignments.",
    },
  ];

  const metrics = [
    {
      category: "Efficiency Gains",
      icon: Zap,
      kpis: [
        {
          name: "Travel Reduction",
          value: "-35%",
          benchmark: "vs Standard",
          status: "good",
        },
        {
          name: "Tasks/Hour",
          value: "+42%",
          benchmark: "Peak Performance",
          status: "good",
        },
        {
          name: "Deadhead Trips",
          value: "< 5%",
          benchmark: "Best in Class",
          status: "good",
        },
      ],
    },
    {
      category: "Resource Utilization",
      icon: BarChart2,
      kpis: [
        {
          name: "Forklift Active",
          value: "92%",
          benchmark: "Shift Avg",
          status: "good",
        },
        {
          name: "Idle Time",
          value: "-18%",
          benchmark: "Reduction",
          status: "good",
        },
        {
          name: "Throughput",
          value: "1.5x",
          benchmark: "Volume",
          status: "good",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 overflow-hidden border-b bg-muted/40">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="w-fit mb-2 border-blue-500/30 text-blue-700 bg-blue-500/10">
              <GitMerge className="mr-2 h-3 w-3" />
              Advanced Orchestration
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Intelligent Task Interleaving
            </h1>
            <p className="text-xl text-muted-foreground">
              Maximize every movement in your warehouse. Combine tasks, optimize routes, and eliminate deadheading with AI-powered task orchestration.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link href="/demo">
                  Optimize Your Workflow <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Get a Tech Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Smarter Task Orchestration
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Move beyond simple FIFO queues. LogiVox analyzes thousands of variables in real-time to assign the most efficient next task to every worker.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="h-full border-muted hover:border-blue-500/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                Efficiency You Can Measure
              </h2>
              <p className="text-lg text-muted-foreground">
                Task interleaving transforms your operational data into tangible efficiency gains. Watch productivity soar as wasted motion disappears.
              </p>
              <ul className="space-y-3">
                {[
                  "Dual-Cycle Operations (Put + Pick)",
                  "Proximity-Based Assignments",
                  "Equipment-Specific Constraints",
                  "Real-Time Queue Rebalancing"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full grid gap-4">
              {metrics.map((metric, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{metric.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {metric.kpis.map((kpi, j) => (
                        <div key={j} className="text-center p-2 rounded-lg bg-muted/50">
                          <div className={`text-xl font-bold ${kpi.status === 'good' ? 'text-blue-600' : ''}`}>
                            {kpi.value}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-1">
                            {kpi.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {kpi.benchmark}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">
            Stop Paying for Empty Trips
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-lg">
            Activate task interleaving today and unlock hidden capacity in your existing workforce.
          </p>
          <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50" asChild>
            <Link href="/demo">
              Calculate Your Savings
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
