"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield,
  Zap,
  Building2,
  BarChart3,
  Users,
  Lock,
  Globe,
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Activity,
  Settings
} from "lucide-react"

export function FeaturesSection() {
  const primaryFeatures = [
    {
      icon: Shield,
      title: "Zero-Trust Security",
      description: "Enterprise-grade security with end-to-end encryption, role-based access control, and continuous monitoring.",
      features: [
        "End-to-end encryption",
        "Role-based access control",
        "Audit trails & compliance",
        "SOC 2 Type II certified"
      ],
      badge: "Security",
      color: "from-blue-500/20 to-blue-600/20"
    },
    {
      icon: Zap,
      title: "Real-time Synchronization",
      description: "Lightning-fast real-time updates across all systems with conflict resolution and offline support.",
      features: [
        "Instant data sync",
        "Conflict resolution",
        "Offline capability",
        "Event-driven architecture"
      ],
      badge: "Performance",
      color: "from-yellow-500/20 to-yellow-600/20"
    },
    {
      icon: Building2,
      title: "Multi-Tenant Architecture",
      description: "Scalable multi-tenant platform with complete data isolation and custom branding per organization.",
      features: [
        "Complete data isolation",
        "Custom branding",
        "Scalable infrastructure",
        "Organization management"
      ],
      badge: "Enterprise",
      color: "from-green-500/20 to-green-600/20"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and analytics with real-time dashboards and predictive insights.",
      features: [
        "Real-time dashboards",
        "Predictive analytics",
        "Custom reports",
        "Data visualization"
      ],
      badge: "Analytics",
      color: "from-purple-500/20 to-purple-600/20"
    }
  ]

  const additionalFeatures = [
    {
      icon: Database,
      title: "ERP Integrations",
      description: "Seamless integration with Oracle, SAP, NetSuite, and other enterprise systems."
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Deploy across multiple regions with automatic failover and disaster recovery."
    },
    {
      icon: Lock,
      title: "Compliance Ready",
      description: "Built-in compliance for GDPR, HIPAA, SOX, and other regulatory requirements."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Advanced workflow management with approval processes and team coordination."
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Continuous monitoring with intelligent alerting and automated issue resolution."
    },
    {
      icon: Layers,
      title: "API-First Design",
      description: "Comprehensive REST and GraphQL APIs for seamless integrations and customizations."
    }
  ]

  return (
    <section className="py-24 bg-background">
      <div className="container-enterprise">
        {/* Section header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything you need for
            <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              enterprise operations
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            FlowStock combines cutting-edge technology with enterprise-grade reliability 
            to deliver a comprehensive stock booking and inventory management solution.
          </p>
        </div>

        {/* Primary features grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {primaryFeatures.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden border-2 hover:border-primary/20 transition-colors">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-50`} />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {feature.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed mt-4">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {additionalFeatures.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Integration showcase */}
        <div className="text-center space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Seamless integrations with your existing tools
            </h3>
            <p className="text-muted-foreground mb-8">
              Connect FlowStock with your favorite enterprise applications and workflows
            </p>
          </div>

          {/* Integration logos/icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {[
              { name: "Oracle ERP", icon: Database },
              { name: "SAP", icon: Building2 },
              { name: "NetSuite", icon: Globe },
              { name: "Salesforce", icon: Users },
              { name: "Microsoft", icon: Settings },
              { name: "APIs", icon: Activity },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <integration.icon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{integration.name}</span>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <Button size="lg" variant="outline" asChild>
              <Link href="/integrations">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}