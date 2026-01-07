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
  Users,
  Building2,
  Shield,
  Database,
  Settings,
  CheckCircle2,
  ArrowRight,
  Lock,
  Palette,
  Globe,
  Layers,
  BarChart3,
  UserCheck,
} from "lucide-react";

export default function MultiTenantPage() {
  const features = [
    {
      icon: Database,
      title: "Complete Data Isolation",
      description:
        "Each organization's data is physically separated with dedicated schemas and encryption keys.",
    },
    {
      icon: Users,
      title: "Unlimited Organizations",
      description:
        "Manage multiple entities, subsidiaries, or clients from a single platform.",
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description:
        "White-label the platform with your logo, colors, and domain for each organization.",
    },
    {
      icon: Settings,
      title: "Independent Configuration",
      description:
        "Each tenant gets its own settings, workflows, and business rules.",
    },
    {
      icon: UserCheck,
      title: "Role-Based Access",
      description:
        "Granular permissions control what users can see and do within each organization.",
    },
    {
      icon: BarChart3,
      title: "Consolidated Reporting",
      description:
        "View analytics across all organizations or drill down into specific tenants.",
    },
  ];

  const useCases = [
    {
      title: "Enterprise Groups",
      description:
        "Manage inventory across multiple subsidiaries, divisions, or business units with centralized visibility and decentralized control.",
      icon: Building2,
    },
    {
      title: "MSPs & Service Providers",
      description:
        "Serve multiple clients with isolated environments while maintaining operational efficiency and economies of scale.",
      icon: Users,
    },
    {
      title: "Franchise Operations",
      description:
        "Enable franchise locations to manage their own inventory while maintaining brand standards and corporate oversight.",
      icon: Globe,
    },
  ];

  const isolationLayers = [
    {
      title: "Data Isolation",
      description:
        "Separate database schemas, encryption keys, and backup procedures",
      icon: Database,
      features: [
        "Dedicated schemas",
        "Unique encryption keys",
        "Isolated backups",
        "Query-level filtering",
      ],
    },
    {
      title: "Security Isolation",
      description:
        "Independent authentication, authorization, and audit logging per tenant",
      icon: Shield,
      features: [
        "Separate auth domains",
        "Tenant-specific policies",
        "Isolated audit logs",
        "Custom SSO",
      ],
    },
    {
      title: "Configuration Isolation",
      description: "Tenant-specific settings, workflows, and business logic",
      icon: Settings,
      features: [
        "Custom workflows",
        "Unique settings",
        "Independent integrations",
        "Tenant rules",
      ],
    },
    {
      title: "UI Isolation",
      description:
        "Customizable branding, themes, and user experience per organization",
      icon: Palette,
      features: [
        "Custom themes",
        "White-labeling",
        "Branded domains",
        "Tenant logos",
      ],
    },
  ];

  const benefits = [
    "Zero-trust architecture ensures complete data separation",
    "Scale to thousands of organizations on single platform",
    "Reduce operational costs with shared infrastructure",
    "Maintain compliance with data residency requirements",
    "Enable self-service tenant provisioning in minutes",
    "Centralized updates without disrupting individual tenants",
    "Cross-tenant analytics for holding companies",
    "Independent SLAs and support tiers per organization",
  ];

  const managementFeatures = [
    {
      icon: Layers,
      title: "Tenant Provisioning",
      description:
        "Automated setup of new organizations with templates and defaults",
    },
    {
      icon: Users,
      title: "User Management",
      description:
        "Manage users across all tenants or within specific organizations",
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Monitor consumption, performance, and costs per tenant",
    },
    {
      icon: Settings,
      title: "Global Policies",
      description:
        "Enforce platform-wide rules while allowing tenant customization",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Multi-Tenant Architecture
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Manage multiple organizations with complete data isolation,
              independent branding, and unified operations. Built for
              enterprises, MSPs, and holding companies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise Multi-Tenancy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scalable organization management with complete isolation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Isolation Layers */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Complete Tenant Isolation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple layers ensure data security and operational independence
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {isolationLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <Card key={layer.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{layer.title}</CardTitle>
                        <CardDescription className="mb-4">
                          {layer.description}
                        </CardDescription>
                        <div className="grid grid-cols-2 gap-2">
                          {layer.features.map((feature) => (
                            <div
                              key={feature}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Built for Your Business Model
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible multi-tenancy for various organizational structures
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title} className="text-center">
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{useCase.title}</CardTitle>
                    <CardDescription className="text-left">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Management Features */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Centralized Tenant Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to manage organizations at scale
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {managementFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader className="text-center">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Scale Without Complexity
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our multi-tenant architecture delivers enterprise capabilities
                with operational simplicity.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Management</CardTitle>
                  <CardDescription>
                    Control all organizations from one dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Tenant management interface will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Secure Multi-Tenant Architecture
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on zero-trust principles with complete data separation
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center p-6">
                  <Layers className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Architecture diagram showing tenant isolation will be
                    available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready for Enterprise Multi-Tenancy?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Manage unlimited organizations with complete isolation and unified
            control
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Talk to Enterprise Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
