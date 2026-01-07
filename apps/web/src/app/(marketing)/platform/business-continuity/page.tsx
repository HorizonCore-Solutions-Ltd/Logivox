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
  Shield,
  Clock,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  HardDrive,
  Cloud,
  Activity,
  RefreshCw,
  Lock,
  Globe,
} from "lucide-react";

export default function BusinessContinuityPage() {
  const continuityFeatures = [
    {
      icon: Clock,
      title: "99.99% Uptime SLA",
      description:
        "Industry-leading uptime guarantee with less than 4.38 hours of downtime per year. Redundant infrastructure ensures continuous operations.",
      badge: "Guaranteed",
    },
    {
      icon: RefreshCw,
      title: "Automated Failover",
      description:
        "Instant automatic failover to backup systems within seconds. Zero manual intervention required for seamless continuity.",
      badge: "Real-Time",
    },
    {
      icon: Database,
      title: "Real-Time Backups",
      description:
        "Continuous data replication with point-in-time recovery. Your data backed up every 5 minutes to multiple locations.",
      badge: "Continuous",
    },
    {
      icon: Globe,
      title: "Multi-Region Redundancy",
      description:
        "Data centers across multiple geographic regions. Active-active configuration ensures service availability even during regional outages.",
      badge: "Global",
    },
    {
      icon: HardDrive,
      title: "Disaster Recovery",
      description:
        "Comprehensive disaster recovery plan with 15-minute RPO and 1-hour RTO. Tested quarterly to ensure readiness.",
      badge: "Tested",
    },
    {
      icon: Activity,
      title: "Health Monitoring",
      description:
        "24/7 automated monitoring with proactive alerts. Issues detected and resolved before they impact your operations.",
      badge: "24/7",
    },
  ];

  const recoveryMetrics = [
    {
      metric: "RPO",
      value: "15 minutes",
      description:
        "Recovery Point Objective - Maximum data loss in disaster scenario",
      icon: Database,
    },
    {
      metric: "RTO",
      value: "1 hour",
      description: "Recovery Time Objective - Maximum time to restore service",
      icon: Clock,
    },
    {
      metric: "Uptime",
      value: "99.99%",
      description: "Service Level Agreement - Guaranteed availability",
      icon: CheckCircle2,
    },
    {
      metric: "MTTR",
      value: "< 30 min",
      description: "Mean Time To Repair - Average incident resolution time",
      icon: Zap,
    },
  ];

  const infrastructureFeatures = [
    {
      title: "Redundant Data Centers",
      description: "Multiple tier-4 data centers with N+1 redundancy",
      icon: Server,
    },
    {
      title: "Load Balancing",
      description: "Intelligent traffic distribution across regions",
      icon: Globe,
    },
    {
      title: "Database Clustering",
      description: "Multi-master database replication",
      icon: Database,
    },
    {
      title: "CDN Integration",
      description: "Global content delivery for optimal performance",
      icon: Zap,
    },
    {
      title: "Automated Scaling",
      description: "Auto-scale resources based on demand",
      icon: RefreshCw,
    },
    {
      title: "Security Hardening",
      description: "DDoS protection and intrusion prevention",
      icon: Shield,
    },
  ];

  const benefits = [
    "Never lose productivity to system downtime",
    "Protect critical warehouse operations 24/7",
    "Meet compliance requirements for data availability",
    "Ensure business continuity during disasters",
    "Maintain customer satisfaction with reliable service",
    "Reduce financial impact of system failures",
    "Peace of mind with enterprise-grade reliability",
    "Comprehensive insurance for your operations",
  ];

  const incidentResponse = [
    {
      step: "1. Detection",
      description: "Automated monitoring detects anomaly within seconds",
      time: "< 30 seconds",
    },
    {
      step: "2. Alert",
      description: "On-call team notified immediately via multiple channels",
      time: "< 1 minute",
    },
    {
      step: "3. Diagnosis",
      description: "AI-powered analysis identifies root cause",
      time: "< 5 minutes",
    },
    {
      step: "4. Failover",
      description: "Automatic failover to backup systems initiated",
      time: "< 3 minutes",
    },
    {
      step: "5. Recovery",
      description: "Primary systems restored and validated",
      time: "< 1 hour",
    },
    {
      step: "6. Post-Mortem",
      description: "Incident analysis and preventive measures implemented",
      time: "< 24 hours",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Advanced Business Continuity
              <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mt-2">
                99.99% Uptime Guaranteed
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Enterprise-grade reliability with automated failover, real-time
              backups, multi-region redundancy, and comprehensive disaster
              recovery. Your warehouse never stops.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Reliability Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise-Grade Reliability
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple layers of protection ensure your operations never stop
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {continuityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">{feature.badge}</Badge>
                  </div>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recovery Metrics */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recovery Guarantees</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Industry-leading metrics for business continuity
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recoveryMetrics.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.metric} className="text-center">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mb-2">
                      {item.metric}
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {item.value}
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Redundant Infrastructure
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple layers of redundancy at every level
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {infrastructureFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Incident Response Protocol
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From detection to resolution in under 1 hour
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {incidentResponse.map((step, index) => (
                <Card key={step.step} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-600 to-primary-500" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {step.step}
                            </CardTitle>
                            <CardDescription>
                              {step.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{step.time}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge className="mb-4">Why It Matters</Badge>
              <h2 className="text-3xl font-bold mb-6">
                Protect Your Operations
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Business continuity isn't optional in modern warehousing.
                Downtime means lost orders, unhappy customers, and revenue
                impact. Our advanced business continuity ensures your operations
                never stop.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-red-600 mb-3" />
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Without Business Continuity
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-200">
                    Average cost of downtime: $5,600 per minute. A single hour
                    of downtime can cost $336,000 in lost revenue and
                    productivity.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
                  <CardTitle className="text-green-900 dark:text-green-100">
                    With LogiVox
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-200">
                    99.99% uptime means only 52 minutes of downtime per year.
                    Automated failover happens in seconds, minimizing any impact
                    to operations.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-500 text-white border-0">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Ensure Your Operations Never Stop
              </h2>
              <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
                Get enterprise-grade business continuity with 99.99% uptime SLA,
                automated failover, and comprehensive disaster recovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  asChild
                >
                  <Link href="/contact">Request Custom SLA</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
