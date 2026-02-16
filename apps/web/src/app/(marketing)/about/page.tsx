import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Navigation and Footer handled by marketing layout
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Building2,
  Award,
  Globe,
  Heart,
  Target,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About LogiVox - Leading Voice-Enabled Warehouse Management",
  description:
    "Founded to eliminate warehouse chaos through voice technology and AI. Trusted by 500+ warehouses, reducing errors 95% and saving $52M+ annually.",
  keywords: [
    "warehouse management company",
    "logistics software",
    "inventory management",
  ],
};

const stats = [
  { value: "500+", label: "Warehouses Trust Us", icon: Building2 },
  { value: "$52M+", label: "Customer Savings", icon: Target },
  { value: "95%", label: "Error Reduction", icon: Shield },
  { value: "24/7", label: "Expert Support", icon: Heart },
];

const timeline = [
  {
    year: "2023",
    title: "Founded with a Mission",
    description:
      "Started by warehouse operations veterans frustrated with outdated, error-prone systems.",
  },
  {
    year: "2024",
    title: "Voice Technology Breakthrough",
    description:
      "Launched industry-first voice-enabled warehouse operations with natural language processing.",
  },
  {
    year: "2025",
    title: "AI-Powered Optimization",
    description:
      "Introduced predictive analytics and machine learning for demand forecasting and labor optimization.",
  },
  {
    year: "2026",
    title: "Enterprise Scale",
    description:
      "Now serving 500+ warehouses across healthcare, manufacturing, and retail with proven $52M+ in savings.",
  },
];

const values = [
  {
    icon: Users,
    title: "Customer First",
    description:
      "Every decision starts with how it helps our customers succeed. We measure our success by yours.",
  },
  {
    icon: Lightbulb,
    title: "Innovation Drive",
    description:
      "We push boundaries with voice AI, computer vision, and predictive analytics to solve real problems.",
  },
  {
    icon: Shield,
    title: "Security & Trust",
    description:
      "Enterprise-grade security isn't optional. SOC 2, ISO 27001, and HIPAA compliance built in.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description:
      "Making warehouse operations efficient worldwide, from small businesses to Fortune 500.",
  },
];

const testimonials = [
  {
    quote:
      "LogiVox transformed our warehouse from chaos to precision. 95% error reduction wasn't just a promise - it was our reality within 3 months.",
    author: "Jennifer Martinez",
    role: "VP Operations",
    company: "MedSupply Solutions",
    logo: "MS",
    metrics: "95% error reduction, $2.1M annual savings",
  },
  {
    quote:
      "The voice AI is game-changing. Our pickers work hands-free, 35% faster, with zero training time. It just works.",
    author: "Robert Chen",
    role: "Warehouse Director",
    company: "TechGear Logistics",
    logo: "TG",
    metrics: "35% productivity increase, 0 days training",
  },
  {
    quote:
      "We evaluated 12 WMS systems. LogiVox was the only one that delivered ROI in month 1, not year 1.",
    author: "Sarah Williams",
    role: "CFO",
    company: "RetailFlow Inc",
    logo: "RF",
    metrics: "ROI achieved in 30 days",
  },
];

const trustIndicators = [
  { name: "SOC 2 Type II Certified", icon: Shield },
  { name: "ISO 27001 Compliant", icon: Award },
  { name: "HIPAA Ready", icon: Heart },
  { name: "99.99% Uptime SLA", icon: Zap },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "CEO & Co-Founder",
    background:
      "Former VP Operations at Amazon, 15+ years warehouse management",
    image: "SJ",
  },
  {
    name: "Michael Chen",
    role: "CTO & Co-Founder",
    background: "Ex-Microsoft AI engineer, voice technology patent holder",
    image: "MC",
  },
  {
    name: "David Rodriguez",
    role: "VP Customer Success",
    background:
      "20+ years logistics consulting, supply chain optimization expert",
    image: "DR",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container-enterprise">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="secondary" className="mb-4">
              🚀 About LogiVox
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Eliminating Warehouse Chaos
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Through Voice & AI
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Founded by warehouse operations veterans who were tired of
              outdated systems causing errors, delays, and frustration. Today,
              500+ warehouses trust LogiVox to eliminate chaos and drive
              results.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="text-center p-6 hover:shadow-lg transition-all"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge>🎯 Our Mission</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Transform Every Warehouse Into a Precision Operation
              </h2>
              <p className="text-lg text-muted-foreground">
                We believe warehouse workers shouldn't fight with complicated
                software. Technology should adapt to humans, not the other way
                around. That's why we built the first warehouse system you can
                control with your voice.
              </p>
              <p className="text-muted-foreground">
                Our AI-powered platform eliminates picking errors, speeds up
                fulfillment, and gives you real-time visibility—all while being
                incredibly easy to use. No complex training. No steep learning
                curves. Just results.
              </p>
            </div>
            <Card className="p-8">
              <h3 className="font-bold text-xl mb-4">The LogiVox Promise</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">
                    95% reduction in picking errors, guaranteed
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">
                    30-day implementation, not 6+ months
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">
                    24/7 support that actually helps
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">ROI visible within 90 days</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">📈 Our Journey</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Startup to Industry Leader
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four years of relentless focus on solving real warehouse problems
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-border"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={item.year} className="relative flex items-center">
                  <div className="flex-1 pr-8 text-right">
                    {index % 2 === 0 && (
                      <Card className="p-6">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {item.year}
                        </div>
                        <h3 className="font-bold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </Card>
                    )}
                  </div>

                  <div className="w-4 h-4 bg-primary rounded-full relative z-10"></div>

                  <div className="flex-1 pl-8">
                    {index % 2 === 1 && (
                      <Card className="p-6">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {item.year}
                        </div>
                        <h3 className="font-bold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">💬 Customer Stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real results from real customers who transformed their operations
              with LogiVox
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary/20"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                    {testimonial.logo}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-xs text-primary font-semibold bg-primary/5 px-2 py-1 rounded">
                  📊 {testimonial.metrics}
                </div>
              </Card>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6 text-muted-foreground">
              Trusted & Certified
            </h3>
            <div className="flex flex-wrap justify-center gap-6">
              {trustIndicators.map((indicator) => (
                <div
                  key={indicator.name}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <indicator.icon className="h-4 w-4 text-primary" />
                  <span>{indicator.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">⭐ Our Values</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              What Drives Us Every Day
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card
                key={value.title}
                className="p-6 text-center hover:shadow-lg transition-all"
              >
                <value.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">👥 Leadership Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Warehouse Veterans Building the Future
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team combines decades of warehouse operations experience with
              cutting-edge AI and voice technology expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <Card
                key={member.name}
                className="p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">
                    {member.image}
                  </span>
                </div>
                <h3 className="font-bold mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground">
                  {member.background}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Join 500+ Successful Warehouses?
              </h2>
              <p className="text-muted-foreground mb-6">
                See exactly how LogiVox can transform your operations with a
                personalized demo. Our warehouse experts will show you real ROI
                projections and implementation timeline.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">
                    Error Reduction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">3x</div>
                  <div className="text-sm text-muted-foreground">
                    Fulfillment Speed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">30d</div>
                  <div className="text-sm text-muted-foreground">
                    ROI Timeline
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full lg:w-auto"
              >
                <Link href="/pricing">
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div>
              <LeadCaptureForm
                variant="demo-request"
                title="Get Your Personal Demo"
                description="See LogiVox in action with your warehouse data"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
