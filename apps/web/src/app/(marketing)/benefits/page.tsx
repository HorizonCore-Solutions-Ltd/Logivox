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
  TrendingUp,
  DollarSign,
  Zap,
  Users,
  BarChart3,
  Shield,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function BenefitsPage() {
  const mainBenefits = [
    {
      icon: TrendingUp,
      title: "Rapid ROI Achievement",
      metric: "30 Days",
      subtitle: "See measurable returns faster than any competitor",
      bullets: [
        "Average ROI visible within 30 days (vs 6-12 months with competitors)",
        "93% of customers achieve cost payback within 90 days",
        "Typical ROI visible within 90 days for Professional tier customers",
        "Implementation completed in 30 days, not 6+ months",
      ],
      benefit: "Calculate your ROI",
      link: "/pricing",
    },
    {
      icon: DollarSign,
      title: "Massive Cost Savings",
      metric: "$52M+",
      subtitle: "Verified annual customer savings",
      bullets: [
        "Average warehouse saves $500K-$2M annually",
        "95% error reduction eliminates $10K-50K/month in rework",
        "25% labor productivity increase saves $250K+ annually",
        "Eliminate emergency 30% markup air shipments",
        "Reduce inventory carrying costs 15-35% through optimization",
      ],
      benefit: "See case studies",
      link: "/case-studies",
    },
    {
      icon: Users,
      title: "Happier, More Productive Teams",
      metric: "35% Faster",
      subtitle: "Work smarter with less frustration",
      bullets: [
        "Voice operations eliminate distractions - pickers love it",
        "Zero training required - new hires productive day one",
        "Reduce physical strain with hands-free operations",
        "Real-time alerts prevent costly mistakes before they happen",
        "Career growth opportunities as efficiency increases",
      ],
      benefit: "Read team testimonials",
      link: "/about",
    },
    {
      icon: Zap,
      title: "Operational Excellence",
      metric: "99.9% Accuracy",
      subtitle: "Stop fighting fires - run smoothly",
      bullets: [
        "Pick accuracy increases from 87% to 99.2%",
        "Eliminate inventory discrepancies that plague manual systems",
        "Real-time visibility prevents stockouts and overstocking",
        "Automated workflows reduce manual exceptions by 80%",
        "Compliance reporting automated - pass audits first try",
      ],
      benefit: "See how we do it",
      link: "/features",
    },
    {
      icon: BarChart3,
      title: "Data-Driven Decision Making",
      metric: "50+ Dashboards",
      subtitle: "Know exactly what's happening, in real-time",
      bullets: [
        "50+ pre-built dashboards cover all key metrics",
        "Real-time KPI monitoring identifies problems immediately",
        "Identify bottlenecks and optimization opportunities",
        "Predictive analytics prevent problems before they occur",
        "Executive dashboards for C-level visibility",
      ],
      benefit: "Explore analytics",
      link: "/solutions/analytics",
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      metric: "SOC 2 Type II",
      subtitle: "Sleep well knowing your data is protected",
      bullets: [
        "SOC 2 Type II certified - independently audited annually",
        "ISO 27001 compliant information security management",
        "HIPAA ready for healthcare operations",
        "256-bit AES encryption for all data (in transit & at rest)",
        "Zero-trust architecture - every request verified",
      ],
      benefit: "View security details",
      link: "/security",
    },
  ];

  const customerBenefits = [
    {
      title: "Keep Customers Happy",
      benefits: [
        "99.9% pick accuracy = fewer returns and complaints",
        "Faster fulfillment = shipments leave same day",
        "Real-time tracking improves customer confidence",
        "Proactive issue prevention stops problems before they reach customers",
      ],
      icon: Users,
    },
    {
      title: "Reduce Operational Risk",
      benefits: [
        "Compliance automation meets GDPR/HIPAA/SOC 2 requirements",
        "Audit trails show exactly what happened and when",
        "Disaster recovery ensures 99.99% uptime",
        "Prevent costly data breaches with enterprise security",
      ],
      icon: Shield,
    },
    {
      title: "Scale Without Chaos",
      benefits: [
        "Add 10 warehouses without changing systems",
        "Expand to 1M+ SKUs without hitting limits",
        "Online/offline mode works everywhere",
        "Performance stays consistent as you grow",
      ],
      icon: TrendingUp,
    },
    {
      title: "Future-Proof Your Operations",
      benefits: [
        "AI and computer vision ready - no rip-and-replace",
        "API-first architecture supports any integration",
        "Mobile-first design works on any device",
        "Regular feature releases keep you competitive",
      ],
      icon: Zap,
    },
  ];

  const byRole = [
    {
      role: "Warehouse Manager",
      goals: "Hit targets, reduce costs, keep team motivated",
      benefits: [
        "Real-time visibility into all operations",
        "Automatic alerts for issues needing attention",
        "Performance dashboards show progress vs targets",
        "Happy team means less turnover and training costs",
      ],
    },
    {
      role: "Finance/CFO",
      goals: "ROI, cost control, risk management",
      benefits: [
        "30-day ROI achievement vs 1+ year competitor",
        "Transparent cost analysis showing exactly where money is saved",
        "Enterprise security reduces compliance audit costs",
        "Predictable scaling - costs grow with revenue, not operations",
      ],
    },
    {
      role: "Operations Director",
      goals: "Efficiency, quality, growth",
      benefits: [
        "95% error reduction improves customer satisfaction",
        "35% speed increase handles growth without hiring",
        "Scalable architecture grows from 1 to 100+ locations",
        "Standardized workflows ensure consistency across all sites",
      ],
    },
    {
      role: "Warehouse Associate",
      goals: "Easier job, fewer errors, fair pay",
      benefits: [
        "Voice operations = hands-free, eyes-free work",
        "Real-time guidance prevents mistakes before they happen",
        "No complex training - works intuitively",
        "Performance tracking is fair and transparent",
      ],
    },
  ];

  const beforeAfter = [
    {
      metric: "Picking Accuracy",
      before: "87%",
      after: "99.2%",
      improvement: "+12.2 points",
      icon: Target,
    },
    {
      metric: "Fulfillment Speed",
      before: "45 picks/hour",
      after: "61 picks/hour",
      improvement: "+35%",
      icon: Zap,
    },
    {
      metric: "Inventory Accuracy",
      before: "92%",
      after: "99.9%",
      improvement: "+7.9 points",
      icon: BarChart3,
    },
    {
      metric: "Implementation Time",
      before: "6+ months",
      after: "30 days",
      improvement: "-80%",
      icon: Clock,
    },
    {
      metric: "Training Hours",
      before: "40 hours",
      after: "0 hours",
      improvement: "100% faster",
      icon: Users,
    },
    {
      metric: "Monthly Operating Cost",
      before: "$15,000",
      after: "$8,500",
      improvement: "-43%",
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="container-enterprise relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              ✨ Why Customers Choose LogiVox
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Stop Fighting Warehouse Chaos
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Start Running a Precision Operation
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See 30-day ROI, 95% error reduction, and $500K-2M annual savings.
              Not average improvements. Real, measurable transformation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Benefits */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="space-y-12">
            {mainBenefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="overflow-hidden border-2 hover:shadow-lg transition-shadow"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-primary">
                          {benefit.metric}
                        </h2>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.subtitle}</p>
                  </div>

                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <ul className="space-y-3 mb-8">
                      {benefit.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline">
                      <Link href={benefit.link}>
                        {benefit.benefit}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Results */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real Results from Day 1</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Not promises. Not projections. Real results from real customers,
              verified and documented.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {beforeAfter.map((item) => (
              <Card key={item.metric} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-3">{item.metric}</h3>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">{item.before}</span> →{" "}
                    <span className="font-bold text-primary">{item.after}</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {item.improvement}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* By Business Function */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Benefits by Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LogiVox creates value for everyone in your organization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {byRole.map((role) => (
              <Card
                key={role.role}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{role.role}</CardTitle>
                  <CardDescription className="text-base">
                    Achieves: {role.goals}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {role.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
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

      {/* Key Business Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Strategic Advantages</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Beyond the bottom line - competitive differentiators that matter
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {customerBenefits.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/20 rounded">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {item.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-sm"
                      >
                        <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="container-enterprise">
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10 p-12 text-center">
            <blockquote className="space-y-6">
              <p className="text-2xl font-semibold italic">
                "We evaluated 12 WMS systems. LogiVox was the only one that
                delivered ROI in month 1, not year 1. Our picking accuracy went
                from 87% to 99.2%. We save $847K annually. This is not just a
                software purchase - it's a business transformation."
              </p>
              <div>
                <p className="font-bold">Sarah Williams</p>
                <p className="text-muted-foreground">
                  CFO, RetailFlow Inc • 327% ROI
                </p>
              </div>
            </blockquote>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">
              Ready to Transform Your Warehouse?
            </h2>
            <p className="text-muted-foreground text-lg">
              See these benefits firsthand with a personalized demo. We'll show
              you exactly how much you could save based on your specific
              operation.
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
                  View Pricing & ROI
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
