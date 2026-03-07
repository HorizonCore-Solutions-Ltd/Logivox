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
import { Input } from "@/components/ui/input";
import {
  Package,
  Scanner,
  BarChart3,
  Zap,
  Voice,
  Shield,
  Users,
  Globe,
  ArrowRight,
  Search,
  Check,
  Sparkles,
  Truck,
  RefreshCcw,
  AlertCircle,
  Database,
  TrendingDown,
  Lock,
  Clock,
  HeadphonesIcon,
  Eye,
  Gauge,
  Workflow,
  Layers,
  Leaf,
  GitMerge,
} from "lucide-react";

export default function FeaturesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const features = [
    // Core Platform Features
    {
      category: "Core Platform",
      tier: "starter",
      icon: Package,
      name: "Real-Time Inventory Tracking",
      benefit: "Know exactly what you have, where you have it, right now",
      description:
        "Live visibility across all warehouse locations with instant updates on every SKU movement and stock level change.",
      impact:
        "Eliminate stockouts, reduce overstocking by 35%, prevent $10K+ emergency air shipments",
      usedBy: ["Starter", "Professional", "Enterprise"],
    },
    {
      category: "Core Platform",
      tier: "starter",
      icon: Scanner,
      name: "Barcode & RFID Scanning",
      benefit: "30% faster transactions with zero manual entry errors",
      description:
        "Support for 1D/2D barcodes, RFID tags, and QR codes with automatic data capture and validation.",
      impact:
        "Reduce picking errors from 5-8% to <0.5%, eliminate data entry time",
      usedBy: ["Starter", "Professional", "Enterprise"],
    },
    {
      category: "Core Platform",
      tier: "starter",
      icon: Database,
      name: "Multi-Location Management",
      benefit:
        "Centrally manage unlimited warehouse locations with one platform",
      description:
        "Seamless inventory visibility and control across all your warehouses, distribution centers, and satellite locations.",
      impact: "Support global expansion without adding complexity or systems",
      usedBy: ["Starter", "Professional", "Enterprise"],
    },
    {
      category: "Core Platform",
      tier: "starter",
      icon: Users,
      name: "Role-Based Access Control",
      benefit: "Give each team member exactly the permissions they need",
      description:
        "Granular permission system with 20+ predefined roles (Warehouse Manager, Picker, QC Inspector, etc.) customizable to your org.",
      impact:
        "Reduce security risks, ensure GDPR/HIPAA compliance, audit all actions",
      usedBy: ["Starter", "Professional", "Enterprise"],
    },

    // Operations Features
    {
      category: "Warehouse Operations",
      tier: "professional",
      icon: Workflow,
      name: "Wave Picking & Batch Processing",
      benefit: "35% faster fulfillment by picking multiple orders together",
      description:
        "Intelligent grouping of orders by zone, customer, or route with optimized picking sequences.",
      impact: "$2.1M annual savings with 35% speed increase (see case studies)",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "Warehouse Operations",
      tier: "professional",
      icon: Truck,
      name: "Multi-Carrier Shipping Integration",
      benefit:
        "Automatically select the best carrier for each shipment, cut shipping costs 12-18%",
      description:
        "Real-time rate shopping across UPS, FedEx, USPS, DHL with automatic label generation and tracking.",
      impact:
        "Reduce shipping spend, improve customer satisfaction with tracking",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "Warehouse Operations",
      tier: "professional",
      icon: RefreshCcw,
      name: "Cycle Counting",
      benefit: "99.9% inventory accuracy without shutting down operations",
      description:
        "Continuous verification using ABC analysis, blind counting, and automatic adjustments.",
      impact:
        "Eliminate annual physical inventory chaos, maintain 99.9%+ accuracy year-round",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "Warehouse Operations",
      tier: "professional",
      icon: AlertCircle,
      name: "Returns Processing",
      benefit: "Turn returns into profit with complete RMA management",
      description:
        "Automated returns workflows with quality inspection, restocking decisions, and refund processing.",
      impact:
        "Reduce returns processing cost 40%, increase sellable inventory recovery",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "Warehouse Operations",
      tier: "enterprise",
      icon: Globe,
      name: "Omnichannel Fulfillment Hub",
      benefit: "Unified inventory for Retail, E-com, and Wholesale",
      description:
        "Intelligent order routing cross-channels with dedicated workflows for B2B, DTC, and ship-from-store operations.",
      impact: "15% revenue increase from improved omnichannel stock pooling",
      usedBy: ["Enterprise"],
    },
    {
      category: "Warehouse Operations",
      tier: "professional",
      icon: Shield,
      name: "Quality Control Suite",
      benefit:
        "Catch 95% of defects before shipping, eliminate customer complaints",
      description:
        "Automated inspection workflows, exception management, and quality metrics with audit trails.",
      impact:
        "Reduce customer returns by 90%, eliminate $847K annual rework costs",
      usedBy: ["Professional", "Enterprise"],
    },

    // Advanced Features
    {
      category: "AI & Optimization",
      tier: "professional",
      icon: Voice,
      name: "Voice Operations",
      benefit:
        "Hands-free warehouse control - pickers work 35% faster without distractions",
      description:
        "Natural language voice commands in 15+ languages. Say what you want, LogiVox handles it. Zero training required.",
      impact: "$847K annual savings + 99.2% picking accuracy + 0 training days",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "AI & Optimization",
      tier: "professional",
      icon: Zap,
      name: "AI-Powered Optimization",
      benefit: "Reduce labor costs 25%, speed up operations 30%+",
      description:
        "Machine learning algorithms optimize slotting, picking routes, wave creation, and staff scheduling.",
      impact: "Save $500K-2M annually depending on operation size",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "AI & Optimization",
      tier: "enterprise",
      icon: Eye,
      name: "Computer Vision",
      benefit: "Catch errors and fraud with AI-powered image recognition",
      description:
        "Automated quality control, shrinkage detection, and compliance verification using advanced computer vision.",
      impact:
        "Eliminate false claims, reduce shrinkage 20%, replace manual inspections",
      usedBy: ["Enterprise"],
    },
    {
      category: "AI & Optimization",
      tier: "enterprise",
      icon: TrendingDown,
      name: "Demand Forecasting",
      benefit: "Predict demand 90 days out with 92% accuracy",
      description:
        "ML-powered demand signals from sales, seasonality, and market trends to optimize inventory.",
      impact: "Reduce inventory carrying costs 15%, prevent 60% of stockouts",
      usedBy: ["Enterprise"],
    },

    // Quality & Compliance
    {
      category: "Quality & Compliance",
      tier: "professional",
      icon: Layers,
      name: "CAPA Management",
      benefit: "Systematize problem-solving and prevent recurring issues",
      description:
        "Corrective & preventive action tracking with root cause analysis, task management, and verification.",
      impact: "Implement continuous improvement, reduce defect recurrence 70%",
      usedBy: ["Professional", "Enterprise"],
    },
    {
      category: "Quality & Compliance",
      tier: "enterprise",
      icon: Lock,
      name: "Compliance Reporting",
      benefit:
        "Meet GDPR, HIPAA, SOC 2, and ISO 27001 requirements automatically",
      description:
        "Automated compliance reporting, audit trails, data residency controls, and consent management.",
      impact:
        "Eliminate compliance risk, pass audits first try, avoid $5M+ penalties",
      usedBy: ["Enterprise"],
    },
    {
      category: "Quality & Compliance",
      tier: "professional",
      icon: TrendingDown,
      name: "Advanced Analytics",
      benefit: "Turn data into decisions with 50+ pre-built dashboards",
      description:
        "Real-time dashboards for KPIs, productivity, quality, costs, and customer satisfaction with drill-down analysis.",
      impact: "Identify bottlenecks, optimize staffing, reduce costs by 20%",
      usedBy: ["Professional", "Enterprise"],
    },

    // Enterprise Features
    {
      category: "Enterprise Features",
      tier: "enterprise",
      icon: Globe,
      name: "White-Label Mobile App",
      benefit:
        "Brand the app with your logo and colors - your customers use YOUR app",
      description:
        "Fully customizable mobile experience with your branding, custom workflows, and private app store distribution.",
      impact:
        "Build brand loyalty, control customer experience, reduce training time",
      usedBy: ["Enterprise"],
    },
    {
      category: "Enterprise Features",
      tier: "enterprise",
      icon: Gauge,
      name: "Digital Twin Technology",
      benefit: "Simulate, test and automate your entire replenishment cycle",
      description:
        "Virtual simulation of your warehouse operations for scenario planning, plus live Autonomous Replenishment 2.0 — AI forecasting, IoT shelf triggers, AMR dispatch, and cost-optimised scheduling all from one dashboard.",
      impact:
        "Reduce implementation risk, eliminate stockouts, cut replenishment labor costs by 30%",
      usedBy: ["Enterprise"],
    },
    {
      category: "Enterprise Features",
      tier: "enterprise",
      icon: Clock,
      name: "Dedicated Success Manager",
      benefit: "Your personal expert ensuring you hit all your goals",
      description:
        "Assigned success manager monitors your KPIs, suggests optimizations, and handles all priorities.",
      impact:
        "Achieve rapid ROI payback, hit all strategic goals with dedicated guidance",
      usedBy: ["Enterprise"],
    },
    {
      category: "Enterprise Features",
      tier: "enterprise",
      icon: HeadphonesIcon,
      name: "24/7 Premium Support",
      benefit: "30-minute response time, dedicated support engineer",
      description:
        "Priority support with SLA guarantees, dedicated engineer, and proactive monitoring.",
      impact: "Zero downtime, immediate issue resolution, peace of mind",
      usedBy: ["Enterprise"],
    },

    // Next-Gen WMS Intelligence
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Users,
      name: "Real-Time Labor Management",
      benefit: "Optimize your workforce with live performance heatmaps",
      description:
        "Monitor worker productivity in real-time with AI-driven performance tracking and dynamic labor re-assignment algorithms.",
      impact:
        "25% reduction in labor costs, 35% increase in worker productivity",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Layers,
      name: "Advanced Wave & Task Interleaving",
      benefit: "Eliminate dead-heading with intelligent task chaining",
      description:
        "Automatically assign putaway tasks to operators after picking tasks in the same area to maximize forklift utilization.",
      impact: "20% reduction in travel time, 15% increase in pallet throughput",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Gauge,
      name: "Modern Yard Management",
      benefit: "Full visibility from gate arrival to dock departure",
      description:
        "Track trailer lifecycle, automate dock scheduling, and manage shunter tasks with real-time gate-to-door integration.",
      impact: "Eliminate detention fees, reduce yard congestion by 40%",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Sparkles,
      name: "Robotics & AMR Orchestration",
      benefit:
        "Dispatch Autonomous Mobile Robots for replenishment automatically",
      description:
        "Full AMR fleet management integrated into the replenishment engine. When stock falls below threshold, the system auto-dispatches the nearest available robot, tracks job status, manages battery levels, and handles multi-fleet traffic.",
      impact: "4x scaling without headcount, zero missed replenishment windows",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Zap,
      name: "IoT Smart Shelf Triggers",
      benefit: "Weight sensors fire instant replenishment signals",
      description:
        "Smart-shelf weight sensors stream real-time telemetry into the replenishment engine. When a bin drops below its programmed threshold, a replenishment signal fires automatically — no scanner, no click, no delay.",
      impact: "100% cold-chain compliance, zero stockouts from inattention",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: Workflow,
      name: "Predictive AI Replenishment",
      benefit: "Stop reacting to stockouts — predict and prevent them",
      description:
        "ML models analyse historical sales velocity, seasonal patterns, supplier lead times, and promotion calendars to generate pre-emptive replenishment orders. Integrates directly with Wave Planning for look-ahead demand shaping.",
      impact:
        "35% inventory reduction, 99.8% fill rate without safety-stock bloat",
      usedBy: ["Enterprise"],
    },
    {
      category: "Next-Gen Intelligence",
      tier: "enterprise",
      icon: TrendingDown,
      name: "Cost-Optimised Off-Peak Scheduling",
      benefit: "Cut replenishment labor costs by 30% automatically",
      description:
        "The engine analyses real-time labor rate calendars and warehouse traffic patterns, then schedules heavy replenishment tasks during off-peak windows. Peak-hour surcharges are avoided entirely without manual planning.",
      impact: "30% labor cost reduction, eliminates scheduling manual effort",
      },
    {
      category: "Warehouse Operations",
      tier: "enterprise",
      icon: Users,
      name: "Real-Time Labor Management",
      benefit: "Track productivity and optimize workforce allocation",
      description: "Comprehensive labor tracking with engineered standards, gamification, and biometric authentication to maximize workforce efficiency.",
      impact: "15-20% increase in productivity, reduced overtime costs",
      usedBy: ["Enterprise"],
    },
    {
      category: "Enterprise Features",
      tier: "enterprise",
      icon: Leaf,
      name: "Sustainability & ESG Suite",
      benefit: "Monitor and reduce your environmental footprint",
      description: "Automated carbon accounting, energy tracking, and waste reduction analytics to help you meet corporate responsibility goals.",
      impact: "Compliance with ESG regulations, lower energy bills",
      usedBy: ["Enterprise"],
    },
    {
      category: "AI & Optimization",
      tier: "enterprise",
      icon: GitMerge,
      name: "Intelligent Task Interleaving",
      benefit: "Eliminate deadhead travel with dual-cycle operations",
      description: "AI-driven task assignment that combines put-away and picking tasks into single trips based on location and priority.",
      impact: "30-40% reduction in travel time, increased throughput",
      usedBy: ["Enterprise"],
    },
  ];

  const categories = [
    { id: "all", label: "All Features" },
    { id: "Core Platform", label: "Core Platform" },
    { id: "Warehouse Operations", label: "Warehouse Operations" },
    { id: "AI & Optimization", label: "AI & Optimization" },
    { id: "Quality & Compliance", label: "Quality & Compliance" },
    { id: "Enterprise Features", label: "Enterprise Features" },
    { id: "Next-Gen Intelligence", label: "Next-Gen Intelligence" },
  ];

  const filteredFeatures = features.filter((feature) => {
    const matchesSearch =
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.benefit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || feature.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const tierColors = {
    starter: "bg-blue-50 border-blue-200",
    professional: "bg-purple-50 border-purple-200",
    enterprise: "bg-amber-50 border-amber-200",
  };

  const tierLabels = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Complete Product Platform
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              44+ Powerful Features
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Built for Modern Warehouses
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From real-time inventory to AI-powered optimization, LogiVox gives
              you every tool needed to run a world-class warehouse operation.
              Start with the core and add advanced features as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-12 bg-background border-b sticky top-16 z-40">
        <div className="container-enterprise">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search features... (e.g., 'voice', 'quality', 'optimization')"
                className="pl-10 py-6 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  size="sm"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredFeatures.length} of {features.length} features
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="space-y-8">
            {categories
              .filter(
                (cat) =>
                  selectedCategory === "all" ||
                  cat.id === "all" ||
                  cat.id === selectedCategory,
              )
              .map((category) => {
                if (category.id === "all") return null;

                const categoryFeatures = filteredFeatures.filter(
                  (f) => f.category === category.id,
                );

                if (categoryFeatures.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {category.label}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categoryFeatures.map((feature) => (
                        <Card
                          key={feature.name}
                          className={`border-2 ${tierColors[feature.tier]} transition-all hover:shadow-lg`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                                  <CardTitle className="text-lg">
                                    {feature.name}
                                  </CardTitle>
                                </div>
                                <CardDescription className="text-base font-semibold text-foreground">
                                  {feature.benefit}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary">
                                {tierLabels[feature.tier]}+
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Description */}
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>

                            {/* Impact */}
                            <div className="bg-card rounded p-3 border border-border">
                              <p className="text-sm font-semibold text-primary mb-1">
                                Real Impact:
                              </p>
                              <p className="text-sm">{feature.impact}</p>
                            </div>

                            {/* Available In */}
                            <div className="flex flex-wrap gap-1">
                              {feature.usedBy.map((tier) => (
                                <Badge
                                  key={tier}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tier}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* All Features: show grid when searching or viewing all */}
            {selectedCategory === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFeatures.map((feature) => (
                  <Card
                    key={feature.name}
                    className={`border-2 ${tierColors[feature.tier]} transition-all hover:shadow-lg`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                            <CardTitle className="text-lg">
                              {feature.name}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-base font-semibold text-foreground">
                            {feature.benefit}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {tierLabels[feature.tier]}+
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>

                      <div className="bg-card rounded p-3 border border-border">
                        <p className="text-sm font-semibold text-primary mb-1">
                          Real Impact:
                        </p>
                        <p className="text-sm">{feature.impact}</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {feature.usedBy.map((tier) => (
                          <Badge
                            key={tier}
                            variant="outline"
                            className="text-xs"
                          >
                            {tier}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredFeatures.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No features found matching your search.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Feature Tiers */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Which Features Are Right For You?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All plans include the core platform. Add advanced features as your
              operation grows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>
                  Essential warehouse automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Includes:</p>
                  <ul className="space-y-1">
                    {[
                      "Real-time tracking",
                      "Barcode scanning",
                      "Multi-location mgmt",
                      "Basic reports",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary shadow-lg">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <CardDescription>Complete operations suite</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    Includes everything in Starter, plus:
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Wave picking & batching",
                      "Multi-carrier shipping",
                      "Voice operations",
                      "AI optimization",
                      "Quality control",
                      "Advanced analytics",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>
                  Unlimited scale & customization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    Includes everything, plus:
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Computer vision",
                      "Digital twin",
                      "Next-Gen Intelligence Suite",
                      "White-label app",
                      "Dedicated success mgr",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <Link href="/contact?type=sales">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">See All Features in Action</h2>
            <p className="text-muted-foreground text-lg">
              Schedule a demo and let our team walk you through how LogiVox can
              transform your warehouse operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?type=demo">
                  Schedule Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">
                  View Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
