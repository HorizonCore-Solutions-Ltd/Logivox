"use client"

import * as React from "react"
import { 
  Shield,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingDown
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TrustSection() {
  const guarantees = [
    {
      title: "30-Day Money Back",
      description: "Not happy? Get a full refund, no questions asked.",
      icon: DollarSign
    },
    {
      title: "No Long-Term Contracts",
      description: "Cancel anytime. We earn your business every month.",
      icon: CheckCircle
    },
    {
      title: "Setup in Hours",
      description: "Not months. Start managing inventory the same day.",
      icon: Clock
    },
    {
      title: "Bank-Level Security",
      description: "Your data is encrypted and protected 24/7.",
      icon: Shield
    },
    {
      title: "99.9% Uptime",
      description: "Your warehouse never sleeps. Neither do we.",
      icon: Zap
    },
    {
      title: "Lowest Price Guaranteed",
      description: "Find a better deal? We'll match it and add 10% off.",
      icon: TrendingDown
    }
  ]

  return (
    <section className="py-16 md:py-20 border-y bg-muted/20">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Risk-Free Guarantee
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Try LogiVox with zero risk
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're confident you'll love LogiVox. If you don't, we'll give you your money back—simple as that.
          </p>
        </div>

        {/* Guarantees grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guarantees.map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Over 50,000 items managed daily by growing businesses using LogiVox
          </p>
        </div>
      </div>
    </section>
  )
}
