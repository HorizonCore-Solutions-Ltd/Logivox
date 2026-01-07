"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

export function CTASection() {
  const benefits = [
    "30-day money-back guarantee",
    "No credit card required",
    "Cancel anytime"
  ]

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container-enterprise relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to eliminate warehouse chaos?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join growing businesses who've cut picking errors by 95% and sped up fulfillment 3x with LogiVox.
            </p>
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
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/25" asChild>
              <Link href="/sign-up">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="/demo">
                Schedule a Demo
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <p className="text-sm text-muted-foreground pt-6">
            Questions? Call us at <span className="font-semibold text-foreground">(555) 123-4567</span> or{" "}
            <Link href="/contact" className="text-primary hover:underline">
              chat with our team
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
