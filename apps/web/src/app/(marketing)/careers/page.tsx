"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Briefcase,
  Heart,
  TrendingUp,
  Code,
  Globe,
  Coffee,
  ArrowRight,
  MapPin,
  Clock,
  DollarSign,
  Zap
} from "lucide-react"

export default function CareersPage() {
  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance for you and your family"
    },
    {
      icon: TrendingUp,
      title: "Growth & Learning",
      description: "Annual learning budget, conference attendance, and career development programs"
    },
    {
      icon: Globe,
      title: "Remote First",
      description: "Work from anywhere with flexible hours and home office setup budget"
    },
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Market-leading salary, equity options, and performance bonuses"
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Unlimited PTO, parental leave, and wellness days"
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Collaborate with talented, passionate people building the future of logistics"
    }
  ]

  const openPositions = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote (US)",
      type: "Full-time",
      description: "Build scalable features for our warehouse management platform using Next.js, TypeScript, and PostgreSQL."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote (Global)",
      type: "Full-time",
      description: "Design intuitive interfaces for complex warehouse operations and voice-enabled workflows."
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote (US/EU)",
      type: "Full-time",
      description: "Scale our infrastructure and optimize deployment pipelines for enterprise customers."
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "San Francisco, CA",
      type: "Full-time",
      description: "Help enterprise customers achieve success with LogiVox WMS implementation and optimization."
    },
    {
      title: "Solutions Architect",
      department: "Sales",
      location: "Remote (US)",
      type: "Full-time",
      description: "Design technical solutions for enterprise prospects and lead integration projects."
    },
    {
      title: "Technical Writer",
      department: "Marketing",
      location: "Remote (Global)",
      type: "Full-time",
      description: "Create comprehensive documentation, guides, and tutorials for our platform."
    }
  ]

  const values = [
    {
      title: "Customer First",
      description: "We build products that solve real problems for our customers"
    },
    {
      title: "Move Fast",
      description: "We ship quickly, iterate based on feedback, and continuously improve"
    },
    {
      title: "Think Big",
      description: "We tackle ambitious challenges and push boundaries"
    },
    {
      title: "Own It",
      description: "We take ownership of our work and deliver results"
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Join Our Team
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Build the Future of Warehouse Management
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Join a team of passionate builders creating enterprise software that powers 
              global supply chains. We're solving complex logistics challenges with innovative 
              technology and voice-enabled operations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#positions">
                  View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Join LogiVox?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We take care of our team so they can do their best work
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </div>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Open Positions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Find your next role at LogiVox
            </p>
          </div>
          <div className="mx-auto max-w-4xl space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-xl">{position.title}</CardTitle>
                        <Badge>{position.department}</Badge>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {position.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{position.type}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="ml-4">
                      Apply <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container-enterprise">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Don't See Your Role?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We're always looking for talented people. Send us your resume and tell us how 
              you'd like to contribute to LogiVox.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
