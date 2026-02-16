import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import {
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Success Stories | LogiVox Case Studies",
  description:
    "See how 500+ warehouses reduced picking errors by 95%, tripled fulfillment speed, and saved $52M+ with LogiVox warehouse management.",
  keywords: [
    "warehouse management case studies",
    "WMS success stories",
    "inventory management ROI",
  ],
};

const caseStudies = [
  {
    company: "MedSupply Corp",
    industry: "Healthcare",
    size: "180 employees",
    challenge:
      "Manual inventory tracking causing 15% picking errors and compliance issues",
    solution: "Voice-enabled picking + real-time tracking + quality workflows",
    results: [
      {
        metric: "94%",
        label: "Reduction in Picking Errors",
        icon: CheckCircle,
      },
      {
        metric: "4 hours",
        label: "Fulfillment Time (from 2 days)",
        icon: Clock,
      },
      { metric: "$890K", label: "Annual Savings", icon: DollarSign },
      { metric: "100%", label: "HIPAA Compliance", icon: CheckCircle },
    ],
    quote:
      "LogiVox transformed our warehouse operations. Voice commands eliminated errors and our team loves how easy it is to use.",
    author: "Michael Harrison, Operations Director",
    timeframe: "6 months",
    badge: "Featured",
  },
  {
    company: "TechFlow Manufacturing",
    industry: "Manufacturing",
    size: "450 employees",
    challenge:
      "$2.3M annual inventory shrinkage due to poor tracking and manual processes",
    solution:
      "AI-powered forecasting + automated reordering + digital twin tracking",
    results: [
      { metric: "890%", label: "ROI in First Year", icon: TrendingUp },
      { metric: "$2.3M", label: "Shrinkage Eliminated", icon: DollarSign },
      { metric: "3x", label: "Faster Cycle Counting", icon: Clock },
      { metric: "99.7%", label: "Inventory Accuracy", icon: CheckCircle },
    ],
    quote:
      "We eliminated $2.3M in shrinkage with LogiVox's real-time tracking. The ROI was incredible.",
    author: "Sarah Lopez, VP Operations",
    timeframe: "4 months",
    badge: "ROI Leader",
  },
  {
    company: "RetailMax Distribution",
    industry: "Retail",
    size: "85 employees",
    challenge:
      "Peak season chaos with 40% fulfillment delays and stressed workforce",
    solution: "Wave optimization + labor management + voice-directed tasks",
    results: [
      { metric: "97%", label: "On-Time Delivery", icon: CheckCircle },
      { metric: "60%", label: "Labor Productivity Increase", icon: TrendingUp },
      { metric: "4x", label: "Peak Season Capacity", icon: Clock },
      { metric: "$1.2M", label: "Additional Revenue", icon: DollarSign },
    ],
    quote:
      "LogiVox helped us handle 4x our normal volume during Black Friday with the same team size.",
    author: "David Chen, Warehouse Manager",
    timeframe: "3 months",
    badge: "Scale Success",
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container-enterprise">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="secondary" className="mb-4">
                🏆 Real Customer Results
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Success Stories from
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  500+ Warehouses
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See how companies across healthcare, manufacturing, and retail
                eliminated picking errors, tripled fulfillment speed, and saved
                millions with LogiVox.
              </p>
            </div>

            {/* Case Studies Grid */}
            <div className="space-y-16">
              {caseStudies.map((study, index) => (
                <Card
                  key={study.company}
                  className="overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Company Info */}
                    <CardHeader className="bg-muted/30 p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="mb-3">{study.badge}</Badge>
                          <CardTitle className="text-2xl mb-2">
                            {study.company}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{study.industry}</span>
                            <span>•</span>
                            <span>{study.size}</span>
                            <span>•</span>
                            <span>{study.timeframe} implementation</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Challenge</h3>
                          <p className="text-sm text-muted-foreground">
                            {study.challenge}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">Solution</h3>
                          <p className="text-sm text-muted-foreground">
                            {study.solution}
                          </p>
                        </div>

                        <div className="bg-card/50 rounded-lg p-4">
                          <blockquote className="text-sm italic mb-3">
                            "{study.quote}"
                          </blockquote>
                          <cite className="text-xs text-muted-foreground">
                            — {study.author}
                          </cite>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Results */}
                    <CardContent className="p-8">
                      <h3 className="font-bold text-xl mb-6">
                        Measurable Results
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        {study.results.map((result) => (
                          <div
                            key={result.label}
                            className="text-center space-y-2"
                          >
                            <div className="flex items-center justify-center mb-2">
                              <result.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-primary">
                              {result.metric}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full mt-8" asChild>
                        <Link href="/demo">
                          Get Similar Results
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16 space-y-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-12">
              <h2 className="text-3xl font-bold">
                Ready to Join These Success Stories?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get the same results these companies achieved. Start your 30-day
                free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Schedule Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
