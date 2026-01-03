"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Mail,
  Video,
  FileText,
  Search,
  ArrowRight,
  CheckCircle2,
  Zap,
  Phone
} from "lucide-react"

export default function HelpCenterPage() {
  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Quick start guides and onboarding tutorials",
      articles: 24,
      href: "/help/getting-started"
    },
    {
      icon: Zap,
      title: "Features & Functionality",
      description: "Learn how to use core features",
      articles: 58,
      href: "/help/features"
    },
    {
      icon: FileText,
      title: "API Documentation",
      description: "Integration guides and API references",
      articles: 42,
      href: "/docs/api"
    },
    {
      icon: MessageSquare,
      title: "Troubleshooting",
      description: "Common issues and solutions",
      articles: 31,
      href: "/help/troubleshooting"
    },
    {
      icon: CheckCircle2,
      title: "Best Practices",
      description: "Optimization tips and recommendations",
      articles: 19,
      href: "/help/best-practices"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      articles: 15,
      href: "/help/videos"
    }
  ]

  const popularArticles = [
    "How to set up your first warehouse location",
    "Voice picking configuration guide",
    "Creating and managing user roles",
    "Integrating with your ERP system",
    "Setting up cycle counting schedules",
    "Understanding inventory valuation methods",
    "Configuring shipping carrier integrations",
    "Mobile app setup and usage"
  ]

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "24/7",
      action: "Start Chat"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      availability: "Response within 4 hours",
      action: "Send Email"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with an expert",
      availability: "Mon-Fri, 9am-6pm EST",
      action: "Call Now"
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary-50 to-background py-20 md:py-32">
        <div className="container-enterprise relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Help Center
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              How can we help you?
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Search our knowledge base or browse categories to find answers to your questions
            </p>
            <div className="mt-8 flex items-center space-x-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for help articles..."
                  className="pl-10 h-12"
                />
              </div>
              <Button size="lg">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Find answers organized by topic
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <category.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{category.articles} articles</Badge>
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Popular Articles
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most frequently viewed help articles
            </p>
          </div>
          <Card className="mx-auto max-w-3xl">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {popularArticles.map((article, index) => (
                  <li key={index}>
                    <Link
                      href="#"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      <span className="flex-1 text-sm">{article}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Still Need Help?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our support team is here to assist you
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <option.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription className="mt-2">{option.description}</CardDescription>
                  <div className="mt-2">
                    <Badge variant="secondary">{option.availability}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    {option.action}
                  </Button>
                </CardContent>
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
              Can't Find What You're Looking For?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Contact our support team directly for personalized assistance
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
