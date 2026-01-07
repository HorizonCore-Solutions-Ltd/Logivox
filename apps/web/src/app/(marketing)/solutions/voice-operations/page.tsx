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
  Mic,
  Volume2,
  Headphones,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Package,
  ClipboardCheck,
  Scan,
  MapPin,
  Users,
  BarChart3,
} from "lucide-react";

export default function VoiceOperationsPage() {
  const features = [
    {
      icon: Mic,
      title: "Voice-Directed Picking",
      description:
        "Hands-free picking operations with voice commands for maximum efficiency and accuracy.",
    },
    {
      icon: Volume2,
      title: "Real-Time Voice Feedback",
      description:
        "Instant audio confirmation and guidance for every warehouse task and operation.",
    },
    {
      icon: Headphones,
      title: "Noise-Canceling Technology",
      description:
        "Crystal-clear voice recognition even in loud warehouse environments.",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description:
        "Support for 30+ languages with natural language processing and local accents.",
    },
    {
      icon: Zap,
      title: "Instant Task Switching",
      description:
        "Seamlessly switch between picking, putaway, cycle counting, and other tasks via voice.",
    },
    {
      icon: Shield,
      title: "Voice Authentication",
      description:
        "Secure user identification through voiceprint biometrics and authentication.",
    },
  ];

  const operations = [
    {
      title: "Voice-Directed Picking",
      description:
        "Transform picking operations with hands-free voice commands",
      icon: Package,
      benefits: [
        "40% faster picking rates compared to paper-based systems",
        "99.9% picking accuracy with voice verification",
        "Reduced training time from days to hours",
        "Hands and eyes free for safer operations",
        "Real-time inventory updates and confirmations",
        "Dynamic pick path optimization via voice guidance",
      ],
    },
    {
      title: "Voice-Enabled Receiving",
      description: "Streamline inbound operations with voice-guided workflows",
      icon: ClipboardCheck,
      benefits: [
        "Faster receiving and putaway processes",
        "Real-time quality checks via voice prompts",
        "Automatic ASN matching and confirmation",
        "Voice-guided optimal putaway location selection",
        "Exception handling through natural conversation",
        "Integration with mobile scanning devices",
      ],
    },
    {
      title: "Voice Cycle Counting",
      description: "Simplify inventory accuracy with voice-directed counting",
      icon: Scan,
      benefits: [
        "Continuous cycle counting without disrupting operations",
        "Voice prompts guide counters to locations",
        "Instant discrepancy alerts and resolution",
        "Blind counting support for maximum accuracy",
        "Multi-location counting in single session",
        "Real-time inventory adjustments",
      ],
    },
    {
      title: "Voice Replenishment",
      description: "Optimize inventory replenishment with voice guidance",
      icon: MapPin,
      benefits: [
        "Automated min/max replenishment alerts",
        "Voice-directed optimal pick and put locations",
        "Priority-based task sequencing",
        "Real-time slot availability confirmation",
        "Cross-aisle replenishment coordination",
        "Bulk replenishment task batching",
      ],
    },
  ];

  const metrics = [
    {
      metric: "40%",
      description: "Increase in picking productivity",
    },
    {
      metric: "99.9%",
      description: "Order accuracy rate achieved",
    },
    {
      metric: "70%",
      description: "Reduction in training time for new workers",
    },
    {
      metric: "35%",
      description: "Decrease in picking errors",
    },
    {
      metric: "25%",
      description: "Improvement in employee satisfaction",
    },
    {
      metric: "50%",
      description: "Faster task completion times",
    },
  ];

  const workflowExample = [
    {
      step: 1,
      action: "System assigns pick task",
      voice: '"Navigate to aisle 12, bin B4"',
    },
    {
      step: 2,
      action: "Worker arrives at location",
      voice: '"Arriving aisle 12, bin B4"',
    },
    {
      step: 3,
      action: "System confirms location",
      voice: '"Pick 15 units of SKU 45789"',
    },
    { step: 4, action: "Worker picks items", voice: '"Picked 15"' },
    {
      step: 5,
      action: "System verifies quantity",
      voice: '"Confirmed. Next location: aisle 14, bin C2"',
    },
    {
      step: 6,
      action: "Process repeats",
      voice: "Hands-free, seamless workflow",
    },
  ];

  const languages = [
    "English (US, UK, AU)",
    "Spanish (Spain, Mexico)",
    "French",
    "German",
    "Italian",
    "Portuguese (Brazil)",
    "Mandarin Chinese",
    "Japanese",
    "Korean",
    "Hindi",
    "Arabic",
    "Russian",
    "Polish",
    "Dutch",
    "Swedish",
    "Danish",
    "Norwegian",
    "Finnish",
    "Czech",
    "Thai",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Voice-Enabled WMS Technology
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Hands-Free Warehouse Operations with Voice Commands
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transform your warehouse productivity with voice-directed
              workflows. Increase accuracy by 99.9%, boost picking rates by 40%,
              and empower your workforce with intuitive, hands-free operations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Voice Technology Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Advanced voice recognition built for warehouse environments
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Operations */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Voice-Enabled Warehouse Operations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete voice support across all warehouse functions
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {operations.map((operation, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <operation.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {operation.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {operation.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {operation.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Example */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Voice Picking Workflow Example
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See how voice technology streamlines warehouse operations
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {workflowExample.map((item, index) => (
              <Card key={index}>
                <CardContent className="flex items-start space-x-4 pt-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.action}</div>
                    <div className="mt-1 flex items-center space-x-2 text-sm text-muted-foreground">
                      <Volume2 className="h-4 w-4" />
                      <span className="italic">{item.voice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Proven Performance Improvements
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real results from voice-enabled warehouse operations
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary">
                    {metric.metric}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Language Support */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Global Language Support
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Support for diverse, multilingual warehouse teams
            </p>
          </div>
          <Card className="mx-auto max-w-4xl">
            <CardContent className="pt-6">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {languages.map((language, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                    <span>{language}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container-enterprise">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Experience the Future of Warehouse Operations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join forward-thinking companies using voice technology to
              revolutionize their warehouses
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Request Voice Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
