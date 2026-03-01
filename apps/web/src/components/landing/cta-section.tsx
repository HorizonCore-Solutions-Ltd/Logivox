"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Phone, Mail, Clock } from "lucide-react";

export function CTASection() {
  const benefits = [
    "Enterprise-grade reliability",
    "Dedicated success manager",
    "Custom deployment options",
  ];

  return (
    <section
      id="get-started"
      className="py-20 md:py-28 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container-enterprise relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready for Enterprise-Grade WMS?
            </h2>
            <p className="text-xl text-muted-foreground">
              Production-ready platform with 489 APIs, 42 dashboards, and
              complete Next-Gen capabilities. Voice operations, AI optimization,
              and IoT integration fully deployed.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto mt-6">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <span>🔒</span>
                <strong>Enterprise Ready:</strong> ISO 27001 & SOC 2 certified
                with 99.99% uptime SLA
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 py-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-lg shadow-primary/25"
              asChild
            >
              <Link href="/contact" aria-label="Request enterprise demo">
                Request Enterprise Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              asChild
            >
              <Link href="/contact" aria-label="Contact sales team">
                Contact Sales Team
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Need information?</strong> Our enterprise team responds
              within 2 hours
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Enterprise Sales
              </span>
              <Link
                href="/contact"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Contact form available
              </Link>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Avg 2-hour response
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
