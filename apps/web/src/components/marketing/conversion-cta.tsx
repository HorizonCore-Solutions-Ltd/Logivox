"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Calendar,
  Download,
  Calculator,
  PlayCircle,
  Star,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  Zap,
  Phone,
} from "lucide-react";

interface CTAProps {
  variant?:
    | "demo-primary"
    | "trial-primary"
    | "roi-calculator"
    | "resource-download"
    | "video-demo"
    | "consultation"
    | "comparison"
    | "pricing-focus";
  title?: string;
  description?: string;
  urgency?: string;
  socialProof?: string;
  primaryAction?: {
    text: string;
    href: string;
  };
  secondaryAction?: {
    text: string;
    href: string;
  };
  benefits?: string[];
  className?: string;
}

export function ConversionCTA({
  variant = "demo-primary",
  title,
  description,
  urgency,
  socialProof,
  primaryAction,
  secondaryAction,
  benefits,
  className = "",
}: CTAProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case "trial-primary":
        return {
          title: title || "Start Your Free 30-Day Trial",
          description:
            description ||
            "Full access to LogiVox with your data. No credit card required.",
          icon: Zap,
          urgency: urgency || "Setup in under 48 hours",
          socialProof: socialProof || "Join 500+ warehouses saving millions",
          primaryAction: primaryAction || {
            text: "Start Free Trial",
            href: "/sign-up",
          },
          secondaryAction: secondaryAction || {
            text: "Schedule Demo",
            href: "/demo",
          },
          benefits: benefits || [
            "30-day full access",
            "Your real warehouse data",
            "Expert onboarding included",
            "No credit card required",
          ],
          gradient: "from-green-500/10 to-green-600/5",
          borderColor: "border-green-500/20",
        };

      case "roi-calculator":
        return {
          title: title || "Calculate Your Warehouse ROI",
          description:
            description ||
            "See exact savings potential with our ROI calculator. Get personalized analysis in 2 minutes.",
          icon: Calculator,
          urgency: urgency || "Get instant ROI analysis",
          socialProof: socialProof || "97% see positive ROI in first quarter",
          primaryAction: primaryAction || {
            text: "Calculate My ROI",
            href: "/roi-calculator",
          },
          secondaryAction: secondaryAction || {
            text: "View Case Studies",
            href: "/case-studies",
          },
          benefits: benefits || [
            "Personalized savings calculation",
            "Implementation timeline",
            "Cost comparison analysis",
            "Industry benchmarking",
          ],
          gradient: "from-blue-500/10 to-blue-600/5",
          borderColor: "border-blue-500/20",
        };

      case "video-demo":
        return {
          title: title || "See LogiVox in Action",
          description:
            description ||
            "5-minute video walkthrough of LogiVox transforming warehouse operations.",
          icon: PlayCircle,
          urgency: urgency || "Watch now, implement faster",
          socialProof: socialProof || "Watched by 10,000+ warehouse managers",
          primaryAction: primaryAction || {
            text: "Watch Demo Video",
            href: "/demo-video",
          },
          secondaryAction: secondaryAction || {
            text: "Get Live Demo",
            href: "/demo",
          },
          benefits: benefits || [
            "5-minute overview",
            "Real warehouse footage",
            "Customer success stories",
            "No registration required",
          ],
          gradient: "from-purple-500/10 to-purple-600/5",
          borderColor: "border-purple-500/20",
        };

      case "consultation":
        return {
          title: title || "Free Warehouse Optimization Consultation",
          description:
            description ||
            "1-hour consultation with warehouse experts. Get custom recommendations for your operation.",
          icon: Users,
          urgency: urgency || "Limited slots available",
          socialProof: socialProof || "$2.3M average savings identified",
          primaryAction: primaryAction || {
            text: "Book Free Consultation",
            href: "/consultation",
          },
          secondaryAction: secondaryAction || {
            text: "Download Checklist",
            href: "/optimization-guide",
          },
          benefits: benefits || [
            "1-hour expert consultation",
            "Custom optimization plan",
            "ROI projections",
            "Implementation roadmap",
          ],
          gradient: "from-orange-500/10 to-orange-600/5",
          borderColor: "border-orange-500/20",
        };

      case "comparison":
        return {
          title: title || "LogiVox vs Your Current System",
          description:
            description ||
            "See side-by-side comparison with SAP, Oracle, Manhattan, and other WMS providers.",
          icon: Star,
          urgency: urgency || "Make informed decisions",
          socialProof: socialProof || "Proven 67% faster than legacy WMS",
          primaryAction: primaryAction || {
            text: "Compare Systems",
            href: "/comparison",
          },
          secondaryAction: secondaryAction || {
            text: "Get Demo",
            href: "/demo",
          },
          benefits: benefits || [
            "Feature comparison chart",
            "Total cost analysis",
            "Implementation timeline",
            "Customer testimonials",
          ],
          gradient: "from-indigo-500/10 to-indigo-600/5",
          borderColor: "border-indigo-500/20",
        };

      case "pricing-focus":
        return {
          title: title || "Transparent Pricing, No Surprises",
          description:
            description ||
            "Simple per-user pricing starting at $49/month. No hidden fees, consultants, or long-term contracts.",
          icon: DollarSign,
          urgency: urgency || "Lock in current pricing",
          socialProof: socialProof || "Average 936% ROI in year 1",
          primaryAction: primaryAction || {
            text: "View Pricing",
            href: "/pricing",
          },
          secondaryAction: secondaryAction || {
            text: "Calculate Savings",
            href: "/roi-calculator",
          },
          benefits: benefits || [
            "Starting at $49/user/month",
            "No setup fees",
            "Cancel anytime",
            "All features included",
          ],
          gradient: "from-yellow-500/10 to-yellow-600/5",
          borderColor: "border-yellow-500/20",
        };

      default: // demo-primary
        return {
          title: title || "See LogiVox Transform Your Warehouse",
          description:
            description ||
            "30-minute personalized demo with your warehouse data. See exactly how LogiVox solves your challenges.",
          icon: Calendar,
          urgency: urgency || "Book in next 24 hours",
          socialProof: socialProof || "500+ warehouses already transformed",
          primaryAction: primaryAction || {
            text: "Schedule Demo",
            href: "/demo",
          },
          secondaryAction: secondaryAction || {
            text: "Start Free Trial",
            href: "/sign-up",
          },
          benefits: benefits || [
            "Personalized to your warehouse",
            "See real ROI projections",
            "Expert recommendations",
            "Implementation timeline",
          ],
          gradient: "from-primary/10 to-primary/5",
          borderColor: "border-primary/20",
        };
    }
  };

  const config = getVariantConfig();

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} ${config.borderColor} ${className}`}
    >
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <config.icon className="h-6 w-6 text-primary" />
          {config.urgency && (
            <Badge variant="secondary" className="text-xs">
              ⚡ {config.urgency}
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl md:text-3xl">{config.title}</CardTitle>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
          {config.description}
        </p>
        {config.socialProof && (
          <p className="text-sm text-primary font-medium">
            ✨ {config.socialProof}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-3">
          {config.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="flex-1 sm:flex-none" asChild>
            <Link href={config.primaryAction.href}>
              {config.primaryAction.text}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {config.secondaryAction && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 sm:flex-none"
              asChild
            >
              <Link href={config.secondaryAction.href}>
                {config.secondaryAction.text}
              </Link>
            </Button>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Setup in 48 hours</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>24/7 Support</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
