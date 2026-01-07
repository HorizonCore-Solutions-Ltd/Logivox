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
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  Globe,
  Lock,
  Shield,
  ArrowRight,
  CheckCircle2,
  Brain,
  Cpu,
  Database,
  Cloud,
  WifiOff,
} from "lucide-react";

export default function AIAssistantPage() {
  const assistantFeatures = [
    {
      icon: WifiOff,
      title: "Works Without Internet (Public Pages)",
      description:
        "Public-facing AI assistant available on all marketing pages without requiring internet connection. Instant responses for pre-sales questions.",
      badge: "Public Access",
    },
    {
      icon: Users,
      title: "Tenant-Aware AI (Logged-In Users)",
      description:
        "Intelligent AI assistant that understands your organization's data, workflows, and context. Provides personalized help based on your tenant.",
      badge: "Enterprise",
    },
    {
      icon: Brain,
      title: "Context-Aware Intelligence",
      description:
        "AI understands your inventory, orders, warehouse layouts, and operations to provide relevant, actionable insights.",
      badge: "Smart",
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description:
        "All AI interactions are encrypted and tenant-isolated. Your data never leaves your secure environment.",
      badge: "Military-Grade",
    },
  ];

  const publicAssistantCapabilities = [
    "Answer product questions",
    "Explain features and pricing",
    "Help with navigation",
    "Provide technical documentation",
    "Schedule demos",
    "Connect with sales team",
  ];

  const enterpriseAssistantCapabilities = [
    "Search inventory across warehouses",
    "Track order status and shipments",
    "Generate custom reports",
    "Analyze trends and forecast demand",
    "Suggest optimal pick routes",
    "Alert on stock levels and anomalies",
    "Provide workflow guidance",
    "Answer policy questions",
    "Create cycle count tasks",
    "Optimize warehouse operations",
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: "Military-Grade Encryption",
      description: "All AI conversations encrypted with AES-256",
    },
    {
      icon: Database,
      title: "Tenant Isolation",
      description: "Complete data separation between organizations",
    },
    {
      icon: Lock,
      title: "Role-Based Access",
      description: "AI respects your user permissions and roles",
    },
    {
      icon: Cloud,
      title: "Private Deployment",
      description: "Option for on-premise or private cloud hosting",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">AI Assistant</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Intelligent AI Assistant
              <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mt-2">
                Public & Tenant-Aware
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get instant help with our AI assistant. Available on public pages
              without internet, and fully tenant-aware for logged-in users with
              access to your warehouse data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Try Enterprise AI
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  <Bot className="mr-2 h-4 w-4" />
                  See AI in Action
                </Link>
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
              Two Modes, One Intelligence
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Public assistant for visitors, enterprise assistant for your team
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {assistantFeatures.map((feature) => {
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
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Comparison */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Public Assistant */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Public Assistant</CardTitle>
                    <CardDescription>
                      Available to all visitors (no login required)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {publicAssistantCapabilities.map((capability) => (
                    <li key={capability} className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                    <WifiOff className="h-4 w-4" />
                    <span className="font-medium">
                      Works without internet connection
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Assistant */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Enterprise Assistant</CardTitle>
                    <CardDescription>
                      Tenant-aware for logged-in users
                    </CardDescription>
                  </div>
                </div>
                <Badge className="w-fit">Most Popular</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {enterpriseAssistantCapabilities.map((capability) => (
                    <li key={capability} className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">
                      Access to your complete warehouse data
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise Security & Privacy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Military-grade security with complete tenant isolation
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real-World Applications</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how teams use AI assistant daily
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Natural Language Queries</CardTitle>
                <CardDescription className="text-base">
                  "Show me all SKUs in warehouse A with less than 100 units" —
                  Get instant results
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Workflow Assistance</CardTitle>
                <CardDescription className="text-base">
                  "Walk me through the receiving process for hazmat items" —
                  Step-by-step guidance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Cpu className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription className="text-base">
                  "Which items are likely to stock out next week?" — AI-powered
                  forecasting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-500 text-white border-0">
            <CardContent className="p-12 text-center">
              <Bot className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Experience Intelligent Warehouse Management
              </h2>
              <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
                Start with our public AI assistant today, upgrade to enterprise
                features when ready.
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
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
