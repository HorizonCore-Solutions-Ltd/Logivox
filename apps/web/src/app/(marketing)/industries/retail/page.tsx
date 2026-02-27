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
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function RetailPage() {
  const challenges = [
    {
      icon: TrendingUp,
      title: "Peak Season Chaos",
      description:
        "500% order volume spikes during holidays overwhelm manual systems",
      solution:
        "Automated wave picking and AI-powered capacity planning handle any volume",
    },
    {
      icon: AlertCircle,
      title: "Multi-Channel Complexity",
      description:
        "Orders from Amazon, website, stores, social media create fragmented fulfillment",
      solution:
        "Unified inventory visibility across all channels with automatic routing",
    },
    {
      icon: Truck,
      title: "Returns Processing",
      description:
        "Managing 25-35% return rates across multiple carriers is expensive",
      solution:
        "Automated returns workflow reduces processing cost 40%, maximizes sellable inventory",
    },
    {
      icon: BarChart3,
      title: "Inventory Accuracy",
      description:
        "Shrinkage rates of 1-2% cost $100K+ annually for mid-size retailers",
      solution:
        "99.9% accuracy with cycle counting eliminates mystery shrinkage",
    },
  ];

  const solutions = [
    {
      name: "Omnichannel Fulfillment",
      description: "Unified order management across all sales channels",
      benefits: [
        "Ship from store",
        "Buy Online Pickup In Store (BOPIS)",
        "Auto order routing",
        "Cross-location fulfillment",
      ],
      roi: "30% faster fulfillment, 25% reduced shipping costs",
    },
    {
      name: "Real-Time Inventory",
      description: "Know exactly what you have across all locations",
      benefits: [
        "Live SKU visibility",
        "Inventory reserves",
        "Transfer management",
        "Auto-replenishment",
      ],
      roi: "35% less overstock, 40% fewer stockouts",
    },
    {
      name: "Voice-Enabled Picking",
      description: "Hands-free order fulfillment with 99.2% accuracy",
      benefits: [
        "Pick accuracy 99.2%",
        "No scanning errors",
        "Pickers work faster",
        "Zero training",
      ],
      roi: "$847K annual savings, 35% speed increase",
    },
    {
      name: "Returns Management",
      description: "Automated processing of online returns",
      benefits: [
        "RMA automation",
        "Quality inspection",
        "Auto-restocking",
        "Refund processing",
      ],
      roi: "40% cost reduction, 90% faster processing",
    },
  ];

  const metrics = [
    {
      label: "Order Volume",
      before: "1,000/day",
      after: "5,000/day",
      improvement: "Peak-proof",
    },
    {
      label: "Fulfillment Speed",
      before: "24hrs",
      after: "4hrs",
      improvement: "85% faster",
    },
    {
      label: "Accuracy",
      before: "87%",
      after: "99.2%",
      improvement: "-87% returns",
    },
    {
      label: "Returns Processing",
      before: "5 days",
      after: "1 day",
      improvement: "-80%",
    },
    {
      label: "Inventory Accuracy",
      before: "92%",
      after: "99.9%",
      improvement: "99.9% accurate",
    },
    {
      label: "Shrinkage Cost",
      before: "$150K/yr",
      after: "$20K/yr",
      improvement: "-87%",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <ShoppingCart className="h-4 w-4 mr-2 inline" />
              Retail/E-Commerce
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Dominate Peak Season
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Without Hiring More Pickers
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              LogiVox handles 5x order volume during holidays, reduces returns
              processing by 40%, and keeps inventory accurate across all
              channels. Ship faster, make customers happier, sell more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" asChild>
                <Link href="/contact?type=demo">
                  Schedule Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Retail's Biggest Challenges
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The retail landscape is brutal. Here's how LogiVox solves your
              worst problems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {challenges.map((challenge) => (
              <Card
                key={challenge.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <challenge.icon className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-1">
                      The Problem:
                    </p>
                    <p className="text-sm">{challenge.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-600 mb-1">
                      LogiVox Solution:
                    </p>
                    <p className="text-sm">{challenge.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Purpose-Built for Retail
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Features optimized for the unique demands of retail fulfillment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution) => (
              <Card key={solution.name}>
                <CardHeader>
                  <CardTitle>{solution.name}</CardTitle>
                  <CardDescription>{solution.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Key Features:</p>
                    <ul className="space-y-1">
                      {solution.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-3">
                    <p className="text-sm font-semibold text-green-600 mb-1">
                      Impact:
                    </p>
                    <p className="text-sm">{solution.roi}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Real Results from Retail
            </h2>
            <p className="text-muted-foreground">
              See how retail companies are using LogiVox to ship faster and
              happier customers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {metric.label}
                  </p>
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="text-lg line-through text-muted-foreground">
                      {metric.before}
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {metric.after}
                    </span>
                  </div>
                  <Badge className="bg-green-600">{metric.improvement}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <Card className="border-2 border-primary">
            <CardContent className="pt-12">
              <blockquote className="space-y-6 text-center">
                <p className="text-xl font-semibold italic">
                  "Black Friday we did 8,000 orders. Last year our system
                  crashed at 2,000. With LogiVox we hit peak volume, no
                  problems. Pick accuracy is 99.2% - customer returns are down
                  87%. This is a game changer for retail."
                </p>
                <div>
                  <p className="font-bold">Jennifer Martinez</p>
                  <p className="text-muted-foreground">
                    VP Operations, RetailFlow Inc
                  </p>
                  <p className="text-sm font-semibold text-green-600 pt-2">
                    8K orders/day • 99.2% accuracy • $847K savings
                  </p>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Ship & Smile?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how LogiVox can handle your peak season without stretching your
            team. Most retail customers see ROI in 30 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact?type=demo">
                Schedule Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-studies">See Case Studies</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
