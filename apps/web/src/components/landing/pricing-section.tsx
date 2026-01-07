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
  Clock,
  X,
  Calendar,
  Video
} from "lucide-react"

export function PricingSection() {
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly")
  
  const getPrice = (monthlyPrice: string) => {
    if (monthlyPrice === "Custom") return "Custom"
    const price = parseInt(monthlyPrice.replace("$", ""))
    if (billingCycle === "annual") {
      const annualPrice = Math.floor(price * 0.8) // 20% discount
      return `$${annualPrice}`
    }
    return monthlyPrice
  }

  const plans = [
    {
      name: "Starter",
      description: "For small warehouses just getting started",
      monthlyPrice: "$49",
      period: "per user/month",
      badge: null,
      features: [
        "1 warehouse location",
        "Up to 10,000 SKUs",
        "Inventory tracking",
        "Order management",
        "Mobile app with barcode scanning",
        "Email support",
        "Basic reporting"
      ],
      cta: "Start Free 30-Day Trial",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      description: "For growing businesses that need more power",
      monthlyPrice: "$99",
      period: "per user/month",
      badge: "Most Popular",
      features: [
        "Up to 5 warehouses",
        "Unlimited SKUs",
        "Wave & batch picking (4 modes)",
        "Quality control workflows",
        "Built-in shipping (compare rates)",
        "E-commerce sync",
        "Advanced analytics",
        "Returns management",
        "24/7 priority support",
        "API access"
      ],
      cta: "Start Free 30-Day Trial",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      description: "For large operations with complex needs",
      monthlyPrice: "Custom",
      period: "contact sales",
      badge: "Best Value",
      features: [
        "Unlimited warehouses & SKUs",
        "Everything in Professional, plus:",
        "Assembly & kitting",
        "Cross-docking operations",
        "Yard & gate management",
        "Transportation management",
        "AI forecasting & demand planning",
        "Custom integrations",
        "Dedicated success manager",
        "Custom SLAs",
        "White-label solution",
        "99.99% uptime SLA",
        "Custom SLA agreements"
      ],
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
      popular: false
    }
  ]

  const comparisonFeatures = [
    {
      category: "Core Features",
      features: [
        { name: "Warehouse Locations", starter: "1", professional: "Up to 5", enterprise: "Unlimited" },
        { name: "SKU Limit", starter: "10,000", professional: "Unlimited", enterprise: "Unlimited" },
        { name: "Users", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited" },
        { name: "Mobile App", starter: true, professional: true, enterprise: true },
        { name: "Barcode Scanning", starter: true, professional: true, enterprise: true },
      ]
    },
    {
      category: "Warehouse Operations",
      features: [
        { name: "Basic Inventory Tracking", starter: true, professional: true, enterprise: true },
        { name: "Wave & Batch Picking", starter: false, professional: true, enterprise: true },
        { name: "Quality Control", starter: false, professional: true, enterprise: true },
        { name: "Returns Management", starter: false, professional: true, enterprise: true },
        { name: "Assembly & Kitting", starter: false, professional: false, enterprise: true },
        { name: "Cross-Docking", starter: false, professional: false, enterprise: true },
        { name: "Cycle Counting", starter: false, professional: true, enterprise: true },
      ]
    },
    {
      category: "Advanced Features",
      features: [
        { name: "Voice-Enabled Operations", starter: false, professional: true, enterprise: true },
        { name: "AI-Powered Forecasting", starter: false, professional: false, enterprise: true },
        { name: "Yard Management", starter: false, professional: false, enterprise: true },
        { name: "Gate & Security", starter: false, professional: false, enterprise: true },
        { name: "Transportation Management", starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: "Integrations",
      features: [
        { name: "E-commerce Platform Sync", starter: false, professional: true, enterprise: true },
        { name: "Built-in Carrier Integration", starter: false, professional: true, enterprise: true },
        { name: "ERP System Integration", starter: false, professional: false, enterprise: true },
        { name: "API Access", starter: false, professional: true, enterprise: true },
        { name: "Custom Integrations", starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: "Support & Security",
      features: [
        { name: "Email Support", starter: true, professional: true, enterprise: true },
        { name: "24/7 Priority Support", starter: false, professional: true, enterprise: true },
        { name: "Dedicated Success Manager", starter: false, professional: false, enterprise: true },
        { name: "SSO & Advanced Security", starter: false, professional: false, enterprise: true },
        { name: "99.99% Uptime SLA", starter: false, professional: false, enterprise: true },
      ]
    }
  ]

  const addOns = [
    {
      name: "Barcode Labels & Printing",
      description: "Professional barcode generation and label printing",
      price: "$20/user/month",
      features: [
        "Custom label templates",
        "Barcode generation",
        "Thermal printer support",
        "QR code support"
      ]
    },
    {
      name: "Advanced Analytics",
      description: "Demand forecasting and inventory optimization",
      price: "$30/user/month", 
      features: [
        "AI-powered forecasting",
        "ABC/XYZ analysis",
        "Inventory optimization",
        "Custom dashboards"
      ]
    },
    {
      name: "Professional Services",
      description: "Implementation and training services",
      price: "From $5,000",
      features: [
        "Warehouse setup assistance",
        "Data migration",
        "Staff training",
        "Process optimization"
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
    <section className="py-24">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center space-y-4 mb-12">
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
            Choose the perfect plan for your organization. Start with our 14-day free trial 
            and scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              variant={billingCycle === "monthly" ? "default" : "outline"}
              onClick={() => setBillingCycle("monthly")}
              size="lg"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "annual" ? "default" : "outline"}
              onClick={() => setBillingCycle("annual")}
              size="lg"
              className="relative"
            >
              Annual
              <Badge className="absolute -top-2 -right-2 bg-green-500">Save 20%</Badge>
            </Button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
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
                      {getPrice(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice !== "Custom" && (
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  {billingCycle === "annual" && plan.monthlyPrice !== "Custom" && (
                    <p className="text-sm text-green-600 mt-2">
                      Billed annually • Save 20%
                    </p>
                  )}
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

        {/* Feature Comparison Table */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Detailed Feature Comparison</h3>
            <p className="text-muted-foreground text-lg">
              Compare all features across our plans
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Starter</th>
                  <th className="text-center p-4 font-semibold bg-primary/5">Professional</th>
                  <th className="text-center p-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-muted/50">
                      <td colSpan={4} className="p-4 font-semibold text-sm uppercase tracking-wide">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">{feature.name}</td>
                        <td className="text-center p-4">
                          {typeof feature.starter === "boolean" ? (
                            feature.starter ? (
                              <Check className="h-5 w-5 text-primary mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{feature.starter}</span>
                          )}
                        </td>
                        <td className="text-center p-4 bg-primary/5">
                          {typeof feature.professional === "boolean" ? (
                            feature.professional ? (
                              <Check className="h-5 w-5 text-primary mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium">{feature.professional}</span>
                          )}
                        </td>
                        <td className="text-center p-4">
                          {typeof feature.enterprise === "boolean" ? (
                            feature.enterprise ? (
                              <Check className="h-5 w-5 text-primary mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{feature.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add-ons section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Add-ons & Services</h3>
            <p className="text-muted-foreground">
              Enhance your LogiVox experience with additional services
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

        {/* Enterprise CTA with Calendar */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Schedule Demo */}
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Schedule a Demo</CardTitle>
                  <CardDescription className="text-base">
                    See LogiVox in action with a personalized walkthrough
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Book a 30-minute demo with our product experts to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Explore features relevant to your business</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Ask questions about implementation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Discuss pricing and custom solutions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">See a live warehouse workflow demonstration</span>
                </li>
              </ul>
              <Button size="lg" className="w-full" asChild>
                <Link href="/contact?type=demo">
                  <Video className="mr-2 h-4 w-4" />
                  Book Your Demo
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contact Sales */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Enterprise Sales</CardTitle>
                  <CardDescription className="text-base">
                    Custom solutions for large-scale operations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our enterprise team can create a tailored solution including:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">On-premise deployment options</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Custom integrations with legacy systems</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Dedicated support and training</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Volume discounts and flexible contracts</span>
                </li>
              </ul>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" className="flex-1" asChild>
                  <Link href="/contact?type=sales">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Sales
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="flex-1" asChild>
                  <Link href="mailto:enterprise@logivox.ai">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Us
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}