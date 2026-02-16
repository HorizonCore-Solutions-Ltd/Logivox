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
  Check,
  X,
  ArrowRight,
  Star,
  Zap,
  Building2,
  Phone,
  Mail,
  Calculator,
  TrendingUp,
  Users,
  Package,
  Truck,
  BarChart3,
  Shield,
  Globe,
  Clock,
  HeadphonesIcon,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">(
    "annual",
  );
  const [selectedModules, setSelectedModules] = React.useState<string[]>([
    "core",
    "qc",
    "optimization",
  ]);
  const [calculatorUsers, setCalculatorUsers] = React.useState(10);
  const [calculatorOrders, setCalculatorOrders] = React.useState(5000);

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === "annual") {
      return Math.floor(monthlyPrice * 0.8); // 20% discount
    }
    return monthlyPrice;
  };

  const calculateROI = () => {
    const currentCost = calculatorOrders * 8.5; // Industry avg $8.50 per order
    const logivoxCost = calculatorUsers * getPrice(99) + calculatorOrders * 0.5;
    const savings = currentCost - logivoxCost;
    const roi = ((savings / logivoxCost) * 100).toFixed(0);
    return { savings: Math.floor(savings), roi };
  };

  const plans = [
    {
      name: "Starter",
      description: "For small warehouses getting started with automation",
      monthlyPrice: 49,
      popular: false,
      badge: null,
      tagline: "Perfect for 1-5 users",
      features: {
        core: [
          "1 warehouse location",
          "Up to 10,000 SKUs",
          "Basic inventory tracking",
          "Order management",
          "Mobile app with barcode scanning",
          "Email support (24hr response)",
          "Basic reporting & analytics",
        ],
        operations: [
          { name: "Receiving & Putaway", included: true },
          { name: "Picking & Packing", included: true },
          { name: "Shipping", included: true },
          { name: "Returns Processing", included: false },
          { name: "Quality Control", included: false },
          { name: "Wave Picking", included: false },
        ],
        advanced: [
          { name: "Voice Operations", included: false },
          { name: "AI Optimization", included: false },
          { name: "Computer Vision", included: false },
          { name: "CAPA Management", included: false },
        ],
      },
    },
    {
      name: "Professional",
      description: "For growing businesses that need comprehensive features",
      monthlyPrice: 99,
      popular: true,
      badge: "Most Popular",
      tagline: "Best for 5-50 users",
      features: {
        core: [
          "Up to 5 warehouse locations",
          "Unlimited SKUs",
          "Real-time inventory tracking",
          "Advanced order management",
          "Mobile app with offline mode",
          "24/7 priority support (2hr response)",
          "Advanced analytics & dashboards",
          "System integrations & automation",
        ],
        operations: [
          { name: "Receiving & Putaway", included: true },
          { name: "Picking & Packing (4 modes)", included: true },
          { name: "Multi-carrier Shipping", included: true },
          { name: "Complete Returns Processing", included: true },
          { name: "Quality Control Suite", included: true },
          { name: "Wave & Batch Picking", included: true },
        ],
        advanced: [
          { name: "Voice Operations", included: true },
          { name: "Basic AI Optimization", included: true },
          { name: "Computer Vision", included: false },
          { name: "CAPA Management", included: true },
        ],
      },
    },
    {
      name: "Enterprise",
      description: "For large operations with complex requirements",
      monthlyPrice: 0, // Custom pricing
      popular: false,
      badge: "Best Value",
      tagline: "Unlimited users & locations",
      features: {
        core: [
          "Unlimited warehouse locations",
          "Unlimited SKUs & products",
          "Real-time multi-site inventory",
          "Custom workflow automation",
          "White-label mobile apps",
          "Dedicated success manager",
          "Always available guarantee",
          "Full system access & integrations",
        ],
        operations: [
          { name: "All Professional features, plus:", included: true },
          { name: "Cross-Docking Operations", included: true },
          { name: "Yard Management", included: true },
          { name: "Assembly & Kitting", included: true },
          { name: "Digital Twin Technology", included: true },
          { name: "Transportation Management", included: true },
        ],
        advanced: [
          { name: "Full Voice Operations Suite", included: true },
          { name: "AI-Powered Optimization", included: true },
          { name: "Computer Vision & ML", included: true },
          { name: "Complete CAPA System", included: true },
          { name: "Sustainability Tracking", included: true },
          { name: "Custom AI Models", included: true },
        ],
      },
    },
  ];

  const modules = [
    {
      id: "core",
      name: "Core WMS",
      description: "Essential warehouse operations",
      badge: "Included",
      price: "Included",
      icon: Package,
    },
    {
      id: "qc",
      name: "Quality Control",
      description: "Industry-leading inspection system",
      badge: "Comprehensive",
      price: "+$20/user",
      icon: Shield,
    },
    {
      id: "optimization",
      name: "AI Optimization",
      description: "Smart load, slotting & route planning",
      badge: "Intelligent",
      price: "+$30/user",
      icon: Zap,
    },
    {
      id: "capa",
      name: "CAPA Management",
      description: "Corrective & preventive actions",
      badge: "Quality First",
      price: "+$25/user",
      icon: BarChart3,
    },
    {
      id: "voice",
      name: "Voice Operations",
      description: "Hands-free warehouse control",
      badge: "Hands-Free",
      price: "+$15/user",
      icon: HeadphonesIcon,
    },
    {
      id: "returns",
      name: "Returns Processing",
      description: "Complete RMA system",
      badge: "Essentialial",
      price: "+$18/user",
      icon: Truck,
    },
  ];

  const comparisonCategories = [
    {
      category: "Core Features",
      features: [
        {
          name: "Warehouse Locations",
          starter: "1",
          professional: "5",
          enterprise: "Unlimited",
        },
        {
          name: "SKU Limit",
          starter: "10,000",
          professional: "Unlimited",
          enterprise: "Unlimited",
        },
        {
          name: "Users",
          starter: "1-5",
          professional: "5-50",
          enterprise: "Unlimited",
        },
        {
          name: "Mobile App",
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "Barcode Scanning",
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "System Integrations",
          starter: false,
          professional: true,
          enterprise: true,
        },
      ],
    },
    {
      category: "Complete Operations",
      features: [
        {
          name: "Receiving & Putaway",
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "Inventory Management",
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "Picking Modes",
          starter: "Single",
          professional: "4 modes",
          enterprise: "4 modes + Custom",
        },
        {
          name: "Quality Control",
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "Returns Processing",
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "Wave Picking",
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "Cross-Docking",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Assembly & Kitting",
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      category: "Advanced Features",
      features: [
        {
          name: "Voice Operations",
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "AI Optimization",
          starter: false,
          professional: "Basic",
          enterprise: "Full",
        },
        {
          name: "Computer Vision",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "CAPA Management",
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "Digital Twin",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Sustainability Tracking",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Yard Management",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Labor Management",
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      category: "Support & Security",
      features: [
        {
          name: "Support Response Time",
          starter: "24 hours",
          professional: "2 hours",
          enterprise: "30 minutes",
        },
        {
          name: "Availability Guarantee",
          starter: "99.5%",
          professional: "99.9%",
          enterprise: "99.99%",
        },
        {
          name: "Dedicated Success Manager",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Custom Training",
          starter: false,
          professional: "Add-on",
          enterprise: true,
        },
        {
          name: "White-Label Option",
          starter: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "On-Premise Deployment",
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Simple, Transparent Pricing
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Pricing that scales
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                with your business
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From small warehouses to global enterprises, LogiVox delivers
              complete warehouse management in one simple platform. Start
              smallll, scale infinitely.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant={billingCycle === "monthly" ? "default" : "outline"}
                onClick={() => setBillingCycle("monthly")}
                size="lg"
                className="min-w-32"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "annual" ? "default" : "outline"}
                onClick={() => setBillingCycle("annual")}
                size="lg"
                className="min-w-32 relative"
              >
                Annual
                <Badge className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-700">
                  Save 20%
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 relative">
        <div className="container-enterprise">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-primary shadow-2xl scale-105 z-10"
                    : "hover:shadow-xl"
                } transition-all`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="px-4 py-1.5 text-sm bg-primary shadow-lg">
                      <Star className="h-3 w-3 mr-1 inline" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-1">
                    {plan.description}
                  </CardDescription>
                  <div className="text-sm text-primary font-semibold">
                    {plan.tagline}
                  </div>

                  <div className="pt-6">
                    {plan.monthlyPrice === 0 ? (
                      <div className="text-4xl font-bold">Custom</div>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center space-x-2">
                          <span className="text-5xl font-bold text-primary">
                            ${getPrice(plan.monthlyPrice)}
                          </span>
                          <span className="text-muted-foreground">
                            /user/month
                          </span>
                        </div>
                        {billingCycle === "annual" && (
                          <p className="text-sm text-green-600 mt-2 font-medium">
                            ${plan.monthlyPrice * 12 * 0.8}/user/year • Save 20%
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Core Features */}
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                      Core Platform
                    </h4>
                    <ul className="space-y-2.5">
                      {plan.features.core.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start space-x-3"
                        >
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Operations */}
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                      Warehouse Operations
                    </h4>
                    <ul className="space-y-2.5">
                      {plan.features.operations.map((feature) => (
                        <li
                          key={feature.name}
                          className="flex items-start space-x-3"
                        >
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm ${!feature.included ? "text-muted-foreground" : ""}`}
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Advanced */}
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                      Advanced Features
                    </h4>
                    <ul className="space-y-2.5">
                      {plan.features.advanced.map((feature) => (
                        <li
                          key={feature.name}
                          className="flex items-start space-x-3"
                        >
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm ${!feature.included ? "text-muted-foreground" : ""}`}
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link
                      href={plan.monthlyPrice === 0 ? "/contact" : "/sign-up"}
                    >
                      {plan.monthlyPrice === 0
                        ? "Contact Sales"
                        : "Start Free Trial"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  {plan.monthlyPrice !== 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      30-day free trial • No credit card required
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Module Add-ons */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Modular Add-Ons</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enhance any plan with specialized modules. Mix and match to
                build your perfect solution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    selectedModules.includes(module.id)
                      ? "border-2 border-primary"
                      : ""
                  }`}
                  onClick={() => {
                    if (module.id === "core") return;
                    setSelectedModules((prev) =>
                      prev.includes(module.id)
                        ? prev.filter((m) => m !== module.id)
                        : [...prev, module.id],
                    );
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <module.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {module.badge}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {module.price}
                      </span>
                      {module.id !== "core" && (
                        <Badge
                          variant={
                            selectedModules.includes(module.id)
                              ? "default"
                              : "outline"
                          }
                        >
                          {selectedModules.includes(module.id)
                            ? "Selected"
                            : "Add"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="mb-20">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl">Calculate Your ROI</CardTitle>
                <CardDescription className="text-lg">
                  See how much you'll save with LogiVox
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Number of Users
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={calculatorUsers}
                        onChange={(e) =>
                          setCalculatorUsers(Number(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="text-2xl font-bold text-primary mt-2">
                        {calculatorUsers} users
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Monthly Orders
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="50000"
                        step="1000"
                        value={calculatorOrders}
                        onChange={(e) =>
                          setCalculatorOrders(Number(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="text-2xl font-bold text-primary mt-2">
                        {calculatorOrders.toLocaleString()} orders/month
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <span className="text-muted-foreground">
                        LogiVox Cost
                      </span>
                      <span className="text-2xl font-bold">
                        ${(calculatorUsers * getPrice(99)).toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b">
                      <span className="text-muted-foreground">
                        Monthly Savings
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ${calculateROI().savings.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b">
                      <span className="text-muted-foreground">
                        Annual Savings
                      </span>
                      <span className="text-3xl font-bold text-green-600">
                        ${(calculateROI().savings * 12).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold">
                        Return on Investment
                      </span>
                      <Badge className="text-xl px-4 py-2 bg-green-600">
                        {calculateROI().roi}% ROI
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">
                      Start Saving Today
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Complete Feature Comparison
              </h2>
              <p className="text-muted-foreground text-lg">
                Compare all features and capabilitis plans
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-bold">Feature</th>
                    <th className="text-center p-4 font-bold">Starter</th>
                    <th className="text-center p-4 font-bold bg-primary/10">
                      Professional
                    </th>
                    <th className="text-center p-4 font-bold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonCategories.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-muted/30">
                        <td
                          colSpan={4}
                          className="p-4 font-bold text-sm uppercase tracking-wide"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4 font-medium">{feature.name}</td>
                          <td className="text-center p-4">
                            {typeof feature.starter === "boolean" ? (
                              feature.starter ? (
                                <Check className="h-5 w-5 text-primary mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground mx-auto" />
                              )
                            ) : (
                              <span className="text-sm font-medium">
                                {feature.starter}
                              </span>
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
                              <span className="text-sm font-medium">
                                {feature.professional}
                              </span>
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
                              <span className="text-sm font-medium">
                                {feature.enterprise}
                              </span>
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

          {/* Enterprise CTA */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Talk to Sales</CardTitle>
                    <CardDescription className="text-base">
                      Get a custom quote for your operation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {[
                    "Custom pricing for 50+ users",
                    "On-premise deployment options",
                    "Dedicated implementation team",
                    "24/7 premium support",
                  ].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/contact?type=sales">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Sales Team
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Schedule Demo</CardTitle>
                    <CardDescription className="text-base">
                      See LogiVox in action with live demo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {[
                    "30-minute personalized walkthrough",
                    "See the complete platform in action",
                    "Ask questions about implementation",
                    "Get ROI analysis for your operation",
                  ].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link href="/contact?type=demo">
                    <Clock className="mr-2 h-4 w-4" />
                    Book Your Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.99%</div>
              <div className="text-sm text-muted-foreground">
                Always Available
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">44+</div>
              <div className="text-sm text-muted-foreground">
                Powerful Features
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$52M+</div>
              <div className="text-sm text-muted-foreground">
                Average Annual Savings
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">936%</div>
              <div className="text-sm text-muted-foreground">Average ROI</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
