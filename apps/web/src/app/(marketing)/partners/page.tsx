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
  Handshake,
  Users,
  TrendingUp,
  Award,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Target,
  DollarSign,
  BarChart3,
} from "lucide-react";

export default function PartnersPage() {
  const partnerTypes = [
    {
      icon: Building2,
      title: "Technology Partners",
      description: "Integrate your solution with LogiVox WMS platform",
      benefits: [
        "Technical integration support",
        "Co-marketing opportunities",
        "Partner portal access",
        "Joint customer success",
      ],
    },
    {
      icon: Users,
      title: "Implementation Partners",
      description: "Deliver LogiVox implementations to customers",
      benefits: [
        "Implementation training",
        "Sales enablement resources",
        "Deal registration program",
        "Partner margin incentives",
      ],
    },
    {
      icon: TrendingUp,
      title: "Reseller Partners",
      description: "Resell LogiVox to your customer base",
      benefits: [
        "Competitive reseller margins",
        "Sales and technical training",
        "Marketing development funds",
        "Dedicated partner manager",
      ],
    },
    {
      icon: Globe,
      title: "Referral Partners",
      description: "Refer customers and earn commissions",
      benefits: [
        "Simple referral process",
        "Attractive commission structure",
        "No implementation required",
        "Partner dashboard tracking",
      ],
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Revenue Growth",
      description:
        "Expand your offerings and create new revenue streams with our platform",
    },
    {
      icon: Users,
      title: "Customer Value",
      description:
        "Deliver more value to your customers with integrated solutions",
    },
    {
      icon: Award,
      title: "Training & Certification",
      description:
        "Access comprehensive training programs and certification paths",
    },
    {
      icon: BarChart3,
      title: "Marketing Support",
      description:
        "Co-marketing opportunities, MDF, and sales enablement resources",
    },
    {
      icon: Target,
      title: "Deal Registration",
      description:
        "Protect your deals with our partner-friendly deal registration program",
    },
    {
      icon: Handshake,
      title: "Dedicated Support",
      description:
        "Work with a dedicated partner manager and technical support team",
    },
  ];

  const currentPartners = [
    {
      name: "ERP Integrations",
      partners: ["SAP", "Oracle NetSuite", "Microsoft Dynamics", "Infor"],
    },
    {
      name: "Shipping Carriers",
      partners: ["FedEx", "UPS", "DHL", "USPS"],
    },
    {
      name: "Hardware Vendors",
      partners: ["Zebra Technologies", "Honeywell", "Datalogic", "Advantech"],
    },
    {
      name: "Implementation Consultants",
      partners: ["15+ certified implementation partners globally"],
    },
  ];

  const process = [
    {
      step: "1",
      title: "Apply",
      description:
        "Submit your partner application with details about your business",
    },
    {
      step: "2",
      title: "Review",
      description:
        "Our team reviews your application and schedules a discovery call",
    },
    {
      step: "3",
      title: "Onboard",
      description:
        "Complete partner training and get access to our partner portal",
    },
    {
      step: "4",
      title: "Launch",
      description: "Start selling, implementing, or integrating with LogiVox",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Partner Program
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Grow Your Business with LogiVox
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Join our partner ecosystem and deliver enterprise warehouse
              management solutions to your customers. Access competitive
              margins, technical support, and co-marketing opportunities.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#apply">
                  Become a Partner <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Partnership Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Partner Program Types
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the partnership model that fits your business
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {partnerTypes.map((type, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                      <type.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
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

      {/* Partner Benefits */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Partner Benefits
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              What you get as a LogiVox partner
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </div>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Partner Ecosystem
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join a growing network of technology and service partners
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {currentPartners.map((category, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">{category.name}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {category.partners.map((partner, idx) => (
                      <li key={idx}>• {partner}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Process */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How to Become a Partner
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple process to get started
            </p>
          </div>
          <div className="mx-auto max-w-4xl grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="border-t py-20">
        <div className="container-enterprise">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Partner with Us?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join our partner ecosystem and grow your business with LogiVox
              enterprise solutions
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule a Call</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
