"use client"

import * as React from "react"
import { Navigation } from '@/components/landing'
import { Footer } from '@/components/layout/footer'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AutoSuggestSearch } from "@/components/ui/auto-suggest-search"
import Link from "next/link"
import { 
  BookOpen,
  Code,
  Zap,
  Shield,
  Database,
  Layers,
  ArrowRight,
  FileText,
  Video,
  Download,
  ExternalLink,
  Rocket
} from "lucide-react"

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Array<{ id: string; text: string; type?: string; category?: string }>>([])

  const quickStart = [
    {
      icon: Rocket,
      title: "Getting Started",
      description: "Set up your LogiVox account and configure your first warehouse in minutes",
      href: "/docs/getting-started",
      time: "5 min"
    },
    {
      icon: Code,
      title: "API Quickstart",
      description: "Make your first API call and integrate LogiVox into your applications",
      href: "/docs/api/quickstart",
      time: "10 min"
    },
    {
      icon: Database,
      title: "Data Import Guide",
      description: "Import existing inventory data from CSV, Excel, or via API",
      href: "/docs/guides/data-import",
      time: "15 min"
    },
    {
      icon: Shield,
      title: "Security Setup",
      description: "Configure zero-trust security, RBAC, and compliance settings",
      href: "/docs/security/setup",
      time: "20 min"
    }
  ]

  const documentation = [
    {
      category: "API Reference",
      icon: Code,
      description: "Complete REST API documentation with interactive examples",
      links: [
        { title: "Authentication", href: "/docs/api/authentication" },
        { title: "Inventory Endpoints", href: "/docs/api/inventory" },
        { title: "Bookings API", href: "/docs/api/bookings" },
        { title: "Webhooks", href: "/docs/api/webhooks" },
        { title: "Rate Limits", href: "/docs/api/rate-limits" }
      ]
    },
    {
      category: "Integration Guides",
      icon: Zap,
      description: "Step-by-step guides for connecting with enterprise systems",
      links: [
        { title: "Oracle ERP Integration", href: "/docs/integrations/oracle" },
        { title: "SAP Integration", href: "/docs/integrations/sap" },
        { title: "NetSuite Integration", href: "/docs/integrations/netsuite" },
        { title: "QuickBooks Integration", href: "/docs/integrations/quickbooks" },
        { title: "Custom Integrations", href: "/docs/integrations/custom" }
      ]
    },
    {
      category: "Features",
      icon: Layers,
      description: "In-depth guides for all platform features",
      links: [
        { title: "Multi-Tenant Architecture", href: "/docs/features/multi-tenant" },
        { title: "Stock Booking", href: "/docs/features/bookings" },
        { title: "Analytics & Reporting", href: "/docs/features/analytics" },
        { title: "PWA & Offline Mode", href: "/docs/features/pwa" },
        { title: "RBAC & Permissions", href: "/docs/features/rbac" }
      ]
    },
    {
      category: "Security & Compliance",
      icon: Shield,
      description: "Security best practices and compliance documentation",
      links: [
        { title: "Zero-Trust Architecture", href: "/docs/security/zero-trust" },
        { title: "Data Encryption", href: "/docs/security/encryption" },
        { title: "Audit Logs", href: "/docs/security/audit-logs" },
        { title: "GDPR Compliance", href: "/docs/compliance/gdpr" },
        { title: "SOC 2", href: "/docs/compliance/soc2" }
      ]
    }
  ]

  const resources = [
    {
      icon: FileText,
      title: "Tutorials",
      count: "50+",
      description: "Step-by-step tutorials for common tasks"
    },
    {
      icon: Video,
      title: "Video Guides",
      count: "30+",
      description: "Video walkthroughs and demonstrations"
    },
    {
      icon: Code,
      title: "Code Examples",
      count: "100+",
      description: "Ready-to-use code snippets and examples"
    },
    {
      icon: Download,
      title: "SDKs",
      count: "5",
      description: "Official SDKs for popular languages"
    }
  ]

  const sdks = [
    {
      name: "Node.js",
      description: "Official Node.js SDK for LogiVox API",
      command: "npm install @logivox/sdk",
      docsHref: "/docs/sdks/nodejs"
    },
    {
      name: "Python",
      description: "Official Python SDK for LogiVox API",
      command: "pip install flowstock",
      docsHref: "/docs/sdks/python"
    },
    {
      name: "Java",
      description: "Official Java SDK for enterprise applications",
      command: "maven install com.flowstock:sdk",
      docsHref: "/docs/sdks/java"
    },
    {
      name: "C# / .NET",
      description: "Official .NET SDK for LogiVox integration",
      command: "dotnet add package LogiVox.SDK",
      docsHref: "/docs/sdks/dotnet"
    }
  ]

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container-enterprise">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                <BookOpen className="h-3 w-3 mr-1" />
                Documentation
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Everything you need to
                <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  build with LogiVox
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Comprehensive guides, API references, and resources to help you 
                integrate and extend LogiVox for your enterprise needs.
              </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mt-12">
              <AutoSuggestSearch
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value)
                  // Generate contextual suggestions
                  if (value.trim()) {
                    const allItems = [...quickStart, ...apiDocs, ...categories]
                    const filtered = allItems
                      .filter(item => 
                        item.title.toLowerCase().includes(value.toLowerCase()) ||
                        item.description?.toLowerCase().includes(value.toLowerCase())
                      )
                      .slice(0, 6)
                      .map(item => ({
                        id: item.title,
                        text: item.title,
                        type: "page" as const,
                        category: item.description || "Documentation"
                      }))
                    setSuggestions(filtered)
                  } else {
                    setSuggestions([])
                  }
                }}
                suggestions={suggestions}
                placeholder="Search documentation..."
                contextType="docs"
                className="h-12 text-base"
                showHistory={true}
              />
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-16">
          <div className="container-enterprise">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Quick Start Guides</h2>
              <p className="text-muted-foreground text-lg">
                Get up and running with LogiVox in minutes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStart.map((guide) => (
                <Link key={guide.title} href={guide.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <guide.icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline">{guide.time}</Badge>
                      </div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{guide.description}</CardDescription>
                      <Button variant="ghost" size="sm" className="mt-4 p-0">
                        Read guide
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-16 bg-muted/30">
          <div className="container-enterprise">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Documentation</h2>
              <p className="text-muted-foreground text-lg">
                Explore comprehensive guides and references
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {documentation.map((section) => (
                <Card key={section.category} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{section.category}</CardTitle>
                    </div>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.title}>
                          <Link
                            href={link.href}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-sm"
                          >
                            <span>{link.title}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-16">
          <div className="container-enterprise">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Resources</h2>
              <p className="text-muted-foreground text-lg">
                Additional learning materials and tools
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {resources.map((resource) => (
                <Card key={resource.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-white">
                        <resource.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold mb-1">
                      {resource.count}
                    </CardTitle>
                    <CardDescription className="text-base font-semibold">
                      {resource.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="py-16 bg-muted/30">
          <div className="container-enterprise">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Official SDKs</h2>
              <p className="text-muted-foreground text-lg">
                Get started quickly with our official SDKs for popular languages
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sdks.map((sdk) => (
                <Card key={sdk.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="text-xl">{sdk.name}</CardTitle>
                      <Link href={sdk.docsHref}>
                        <Button variant="ghost" size="sm">
                          Docs
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <CardDescription>{sdk.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 rounded-md bg-muted font-mono text-sm">
                      {sdk.command}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container-enterprise">
            <div className="max-w-3xl mx-auto text-center space-y-8 p-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Need help getting started?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our support team is here to help you succeed with LogiVox
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8" asChild>
                  <Link href="/help">
                    Visit Help Center
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
