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
  Package,
  Calendar,
  Clock,
  Users,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  Lock,
} from "lucide-react";

export default function StockBookingPage() {
  const features = [
    {
      icon: Calendar,
      title: "Real-Time Availability",
      description:
        "See accurate stock levels across all warehouses and locations instantly.",
    },
    {
      icon: Clock,
      title: "Instant Reservations",
      description:
        "Book inventory in seconds with automated confirmation and allocation.",
    },
    {
      icon: Shield,
      title: "Guaranteed Allocation",
      description:
        "Once booked, your stock is secured and protected from double-booking.",
    },
    {
      icon: Users,
      title: "Multi-Party Access",
      description:
        "Enable customers, partners, and teams to book inventory with role-based permissions.",
    },
    {
      icon: TrendingUp,
      title: "Demand Forecasting",
      description:
        "AI-powered insights help predict and optimize booking patterns.",
    },
    {
      icon: BarChart3,
      title: "Booking Analytics",
      description:
        "Track booking trends, customer behavior, and inventory utilization.",
    },
  ];

  const benefits = [
    "Reduce stock-outs by 65% with predictive booking",
    "Increase inventory turnover by 40%",
    "Eliminate double-booking and allocation errors",
    "Process bookings 10x faster than manual systems",
    "Real-time sync with ERP and warehouse systems",
    "Mobile-friendly booking interface",
    "Automated notifications and confirmations",
    "Complete audit trail for compliance",
  ];

  const useCases = [
    {
      title: "Wholesale Distribution",
      description:
        "Enable B2B customers to reserve inventory before delivery, reducing stockouts and improving cash flow.",
      icon: Package,
    },
    {
      title: "Manufacturing",
      description:
        "Book raw materials and components across multiple production facilities with real-time visibility.",
      icon: Zap,
    },
    {
      title: "Retail & E-commerce",
      description:
        "Synchronize online and in-store inventory with automated booking and reservation systems.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Solutions</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Stock Booking System
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Empower your customers and teams to reserve inventory in real-time
              with our intelligent booking platform. Eliminate errors, reduce
              stockouts, and accelerate order fulfillment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Powerful Booking Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage stock reservations at scale
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Transform Your Inventory Operations
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our stock booking system delivers measurable improvements across
                your entire supply chain.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Dashboard</CardTitle>
                  <CardDescription>
                    Manage all reservations from one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Package className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Interactive demo will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Your Industry</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible booking solutions for every business model
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title} className="text-center">
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{useCase.title}</CardTitle>
                    <CardDescription className="text-left">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Optimize Your Stock Bookings?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies using LogiVox to streamline inventory
            reservations
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
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
