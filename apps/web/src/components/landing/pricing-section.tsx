"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Check,
  ArrowRight,
  Star,
  Building2,
  Users,
  Zap,
  Shield,
  Crown,
  Phone,
  Mail,
  Clock
} from "lucide-react"

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      price: "$49",
      period: "per user/month",
      badge: null,
      features: [
        "Up to 10,000 stock items",
        "Basic reporting & analytics",
        "Standard integrations",
        "Email support",
        "Mobile app access",
        "Basic user management",
        "99.5% uptime SLA"
      ],
      cta: "Start Free Trial",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      description: "Advanced features for growing businesses",
      price: "$99",
      period: "per user/month",
      badge: "Most Popular",
      features: [
        "Up to 100,000 stock items",
        "Advanced analytics & forecasting",
        "Premium integrations (Oracle, SAP)",
        "Priority support (24/7)",
        "Custom workflows",
        "Advanced user management",
        "99.9% uptime SLA",
        "API access",
        "Custom branding"
      ],
      cta: "Start Free Trial",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      description: "Complete solution for large organizations",
      price: "Custom",
      period: "contact sales",
      badge: "Best Value",
      features: [
        "Unlimited stock items",
        "Enterprise analytics & AI insights",
        "All integrations + custom",
        "Dedicated success manager",
        "Custom development",
        "SSO & advanced security",
        "99.99% uptime SLA",
        "White-label solution",
        "On-premise deployment",
        "Compliance certifications"
      ],
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
      popular: false
    }
  ]

  const addOns = [
    {
      name: "Advanced Security",
      description: "Enhanced security features and compliance",
      price: "$25/user/month",
      features: [
        "Advanced threat protection",
        "Compliance reporting",
        "Enhanced audit logs",
        "Security consulting"
      ]
    },
    {
      name: "Premium Support",
      description: "Dedicated support and faster response times",
      price: "$15/user/month", 
      features: [
        "Dedicated support team",
        "1-hour response time",
        "Training sessions",
        "Implementation assistance"
      ]
    },
    {
      name: "Custom Integrations",
      description: "Build custom integrations for your workflows",
      price: "From $5,000",
      features: [
        "Custom API development",
        "Legacy system integration",
        "Data migration services",
        "Ongoing maintenance"
      ]
    }
  ]

  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle."
    },
    {
      question: "Is there a free trial?",
      answer: "We offer a 14-day free trial for all plans. No credit card required to get started."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, ACH transfers, and can arrange annual invoicing for enterprise customers."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, we offer a 20% discount when you pay annually. Enterprise customers can also qualify for volume discounts."
    }
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Simple, transparent
            <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              pricing for everyone
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your organization. Start with our free trial 
            and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                plan.popular 
                  ? "border-primary shadow-xl scale-105" 
                  : "hover:shadow-lg"
              } transition-all`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="pt-4">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.ctaVariant} 
                  className="w-full" 
                  size="lg"
                  asChild
                >
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
                    {plan.cta}
                    {plan.name !== "Enterprise" && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Add-ons & Services</h3>
            <p className="text-muted-foreground">
              Enhance your FlowStock experience with additional services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addOns.map((addon) => (
              <Card key={addon.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <Badge variant="outline">{addon.price}</Badge>
                  </div>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {addon.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2 text-sm">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
            <p className="text-muted-foreground">
              Have questions? We have answers.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16 p-8 border rounded-xl bg-card">
          <div className="max-w-2xl mx-auto space-y-4">
            <Crown className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Need something custom?</h3>
            <p className="text-muted-foreground">
              Our enterprise team can create a custom solution tailored to your 
              specific requirements, including on-premise deployment, custom integrations, 
              and dedicated support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Schedule a Call
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="mailto:enterprise@flowstock.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}