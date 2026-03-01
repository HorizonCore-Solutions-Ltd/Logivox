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
  Plug,
  Zap,
  RefreshCw,
  Webhook,
  Code,
  CheckCircle2,
  ArrowRight,
  Database,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Users,
  Shield,
  Package,
  Bot,
  Truck,
  ClipboardCheck,
  Cpu,
  Mic,
  CreditCard,
  Globe,
  Mail,
  Building2,
  Lock,
  FileText,
} from "lucide-react";

// ── Provider catalogue by category ──────────────────────────────────────────

interface Provider {
  name: string;
  emoji: string;
  popularity: "HIGH" | "MEDIUM" | "LOW";
  complexity: "LOW" | "MEDIUM" | "HIGH" | "ENTERPRISE";
}

interface IntegrationCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  providers: Provider[];
}

const CATEGORIES: IntegrationCategory[] = [
  {
    id: "ERP",
    label: "ERP Systems",
    description:
      "Enterprise resource planning — materials, POs, GR/GI, and inventory sync.",
    icon: Building2,
    colorClass: "bg-blue-600",
    providers: [
      {
        name: "SAP S/4HANA",
        emoji: "🔵",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "SAP ECC",
        emoji: "🔵",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "Oracle ERP Cloud",
        emoji: "🔴",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "Microsoft Dynamics 365 F&SCM",
        emoji: "🟦",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "Dynamics 365 Business Central",
        emoji: "🟦",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      { name: "Odoo", emoji: "🟣", popularity: "MEDIUM", complexity: "MEDIUM" },
    ],
  },
  {
    id: "ACCOUNTING",
    label: "Accounting & Finance",
    description: "Invoices, P&L, stock valuation, and financial journals.",
    icon: CreditCard,
    colorClass: "bg-emerald-600",
    providers: [
      {
        name: "QuickBooks Online",
        emoji: "🟢",
        popularity: "HIGH",
        complexity: "LOW",
      },
      { name: "Xero", emoji: "🔵", popularity: "HIGH", complexity: "LOW" },
      {
        name: "Sage Business Cloud",
        emoji: "🟩",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Oracle NetSuite",
        emoji: "🔷",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      { name: "FreshBooks", emoji: "🌿", popularity: "LOW", complexity: "LOW" },
    ],
  },
  {
    id: "HR",
    label: "HR & Workforce",
    description: "Workers, contracts, shifts, and time-and-attendance data.",
    icon: Users,
    colorClass: "bg-violet-600",
    providers: [
      {
        name: "Workday HCM",
        emoji: "🏢",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "SAP SuccessFactors",
        emoji: "🔵",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "UKG (Kronos)",
        emoji: "⏱️",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "ADP Workforce Now",
        emoji: "💼",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "BambooHR",
        emoji: "🎋",
        popularity: "MEDIUM",
        complexity: "LOW",
      },
      { name: "HiBob", emoji: "👥", popularity: "MEDIUM", complexity: "LOW" },
    ],
  },
  {
    id: "SSO",
    label: "Identity & SSO",
    description: "SAML / OIDC single-sign-on and SCIM directory provisioning.",
    icon: Lock,
    colorClass: "bg-sky-600",
    providers: [
      {
        name: "Microsoft Entra ID (Azure AD)",
        emoji: "🟦",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      { name: "Okta", emoji: "🔵", popularity: "HIGH", complexity: "MEDIUM" },
      {
        name: "Google Workspace",
        emoji: "🔴",
        popularity: "HIGH",
        complexity: "LOW",
      },
      {
        name: "Auth0",
        emoji: "⚫",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "OneLogin",
        emoji: "🟢",
        popularity: "LOW",
        complexity: "MEDIUM",
      },
    ],
  },
  {
    id: "ACCESS_CONTROL",
    label: "Physical Access Control",
    description: "Badge holders, door events, and zone-based access rules.",
    icon: Shield,
    colorClass: "bg-rose-600",
    providers: [
      {
        name: "Paxton Net2",
        emoji: "🚪",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Gallagher Command Centre",
        emoji: "🔐",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "HID Origo",
        emoji: "📛",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      { name: "LenelS2", emoji: "🔑", popularity: "LOW", complexity: "HIGH" },
      {
        name: "Brivo",
        emoji: "☁️",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Genetec Security Center",
        emoji: "🎥",
        popularity: "MEDIUM",
        complexity: "ENTERPRISE",
      },
    ],
  },
  {
    id: "HARDWARE",
    label: "Warehouse Hardware",
    description: "Barcode scanners, label printers, RFID readers, and PLCs.",
    icon: Cpu,
    colorClass: "bg-amber-600",
    providers: [
      {
        name: "Zebra Mobile Computers",
        emoji: "🦓",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Zebra Label Printers",
        emoji: "🖨️",
        popularity: "HIGH",
        complexity: "LOW",
      },
      {
        name: "Honeywell Scanners",
        emoji: "📡",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Datalogic",
        emoji: "📶",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Impinj RFID",
        emoji: "📡",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "Siemens PLC / SCADA",
        emoji: "⚙️",
        popularity: "MEDIUM",
        complexity: "ENTERPRISE",
      },
      {
        name: "Allen-Bradley / Rockwell",
        emoji: "🔧",
        popularity: "MEDIUM",
        complexity: "ENTERPRISE",
      },
    ],
  },
  {
    id: "ROBOTICS",
    label: "Robotics & Automation",
    description: "AS/RS, AMR fleets, conveyors, and sortation systems.",
    icon: Bot,
    colorClass: "bg-teal-600",
    providers: [
      {
        name: "AutoStore",
        emoji: "🤖",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "Dematic iQ WCS",
        emoji: "🏭",
        popularity: "HIGH",
        complexity: "ENTERPRISE",
      },
      {
        name: "Locus Robotics (AMR)",
        emoji: "🤖",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "Geek+ (Goods-to-Person)",
        emoji: "📦",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "Fetch Robotics",
        emoji: "🚗",
        popularity: "LOW",
        complexity: "HIGH",
      },
    ],
  },
  {
    id: "TMS_YMS",
    label: "TMS & Yard Management",
    description: "Fleet telematics, dock assignments, and carrier management.",
    icon: Truck,
    colorClass: "bg-orange-600",
    providers: [
      {
        name: "FleetOps360",
        emoji: "🚛",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Samsara",
        emoji: "📍",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Webfleet (TomTom)",
        emoji: "🗺️",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Trimble TMS",
        emoji: "🚚",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "MercuryGate TMS",
        emoji: "☿",
        popularity: "LOW",
        complexity: "HIGH",
      },
    ],
  },
  {
    id: "QMS",
    label: "Quality Management (QMS)",
    description:
      "CAPA actions, audit findings, deviations, and nonconformances.",
    icon: ClipboardCheck,
    colorClass: "bg-lime-600",
    providers: [
      {
        name: "iAuditor (SafetyCulture)",
        emoji: "✅",
        popularity: "HIGH",
        complexity: "LOW",
      },
      {
        name: "EcoOnline (EHS)",
        emoji: "🟢",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "MasterControl",
        emoji: "📋",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "ETQ Reliance",
        emoji: "🔵",
        popularity: "LOW",
        complexity: "HIGH",
      },
      {
        name: "Veeva Vault QMS",
        emoji: "🏥",
        popularity: "LOW",
        complexity: "ENTERPRISE",
      },
    ],
  },
  {
    id: "BI",
    label: "Analytics & BI",
    description: "KPI datasets, inventory metrics, and executive dashboards.",
    icon: BarChart3,
    colorClass: "bg-indigo-600",
    providers: [
      {
        name: "Microsoft Power BI",
        emoji: "📊",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Tableau",
        emoji: "📈",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Looker / Google Looker Studio",
        emoji: "🔍",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "Qlik Sense",
        emoji: "🟢",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      { name: "Domo", emoji: "🔴", popularity: "LOW", complexity: "MEDIUM" },
      {
        name: "Google Analytics 4",
        emoji: "📉",
        popularity: "HIGH",
        complexity: "LOW",
      },
    ],
  },
  {
    id: "IOT_CLOUD",
    label: "IoT & Cloud Sensors",
    description: "Device telemetry, sensor streaming, and shadow state sync.",
    icon: Globe,
    colorClass: "bg-cyan-600",
    providers: [
      {
        name: "AWS IoT Core",
        emoji: "☁️",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "Azure IoT Hub",
        emoji: "🔵",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "Google Cloud IoT",
        emoji: "🔴",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
    ],
  },
  {
    id: "VOICE_HARDWARE",
    label: "Voice-Directed Picking",
    description: "Operator voice profiles, task lists, and headset firmware.",
    icon: Mic,
    colorClass: "bg-pink-600",
    providers: [
      {
        name: "Honeywell Vocollect",
        emoji: "🎧",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "Lydia Voice",
        emoji: "🎤",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      {
        name: "Android Voice (BYOD)",
        emoji: "📱",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
    ],
  },
  {
    id: "ECOMMERCE",
    label: "E-Commerce & Marketplaces",
    description:
      "Real-time inventory sync, order fulfilment, and listing management.",
    icon: ShoppingCart,
    colorClass: "bg-fuchsia-600",
    providers: [
      { name: "Shopify", emoji: "🛍️", popularity: "HIGH", complexity: "LOW" },
      {
        name: "WooCommerce",
        emoji: "🟣",
        popularity: "HIGH",
        complexity: "LOW",
      },
      {
        name: "Amazon Seller Central",
        emoji: "🟠",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      { name: "eBay", emoji: "🔴", popularity: "MEDIUM", complexity: "MEDIUM" },
      {
        name: "BigCommerce",
        emoji: "🔵",
        popularity: "MEDIUM",
        complexity: "LOW",
      },
      {
        name: "Adobe Commerce (Magento)",
        emoji: "🔴",
        popularity: "MEDIUM",
        complexity: "HIGH",
      },
      { name: "Etsy", emoji: "🟠", popularity: "LOW", complexity: "LOW" },
      {
        name: "Squarespace",
        emoji: "⬛",
        popularity: "LOW",
        complexity: "LOW",
      },
    ],
  },
  {
    id: "SHIPPING",
    label: "Carriers & Shipping",
    description:
      "Rate shopping, label generation, and real-time parcel tracking.",
    icon: Package,
    colorClass: "bg-yellow-600",
    providers: [
      { name: "FedEx", emoji: "🟣", popularity: "HIGH", complexity: "MEDIUM" },
      { name: "UPS", emoji: "🟤", popularity: "HIGH", complexity: "MEDIUM" },
      {
        name: "DHL Express",
        emoji: "🟡",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Royal Mail",
        emoji: "🇬🇧",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      { name: "DPD", emoji: "🔴", popularity: "HIGH", complexity: "MEDIUM" },
      { name: "USPS", emoji: "🦅", popularity: "HIGH", complexity: "LOW" },
      {
        name: "ShipStation",
        emoji: "⚓",
        popularity: "MEDIUM",
        complexity: "LOW",
      },
    ],
  },
  {
    id: "CRM",
    label: "CRM Systems",
    description: "Customers, contacts, deal stages, and fulfilment events.",
    icon: Database,
    colorClass: "bg-slate-600",
    providers: [
      {
        name: "Salesforce",
        emoji: "☁️",
        popularity: "HIGH",
        complexity: "HIGH",
      },
      {
        name: "HubSpot",
        emoji: "🟠",
        popularity: "HIGH",
        complexity: "MEDIUM",
      },
      {
        name: "Zoho CRM",
        emoji: "🟢",
        popularity: "MEDIUM",
        complexity: "MEDIUM",
      },
      {
        name: "Pipedrive",
        emoji: "🟢",
        popularity: "MEDIUM",
        complexity: "LOW",
      },
    ],
  },
  {
    id: "COMMUNICATION",
    label: "Communication & Alerts",
    description:
      "SMS, push, email, and chat notifications for warehouse events.",
    icon: MessageSquare,
    colorClass: "bg-green-600",
    providers: [
      { name: "Slack", emoji: "💬", popularity: "HIGH", complexity: "LOW" },
      {
        name: "Microsoft Teams",
        emoji: "🟦",
        popularity: "HIGH",
        complexity: "LOW",
      },
      {
        name: "Twilio (SMS / WhatsApp)",
        emoji: "📱",
        popularity: "HIGH",
        complexity: "LOW",
      },
      { name: "SendGrid", emoji: "🔵", popularity: "HIGH", complexity: "LOW" },
      {
        name: "Mailchimp",
        emoji: "🐒",
        popularity: "MEDIUM",
        complexity: "LOW",
      },
      { name: "Klaviyo", emoji: "🟢", popularity: "MEDIUM", complexity: "LOW" },
    ],
  },
  {
    id: "PAYMENT",
    label: "Payments",
    description: "Payment collection, invoicing, and billing automation.",
    icon: CreditCard,
    colorClass: "bg-red-600",
    providers: [
      { name: "Stripe", emoji: "💳", popularity: "HIGH", complexity: "LOW" },
      { name: "PayPal", emoji: "🔵", popularity: "HIGH", complexity: "LOW" },
      { name: "Square", emoji: "⬛", popularity: "MEDIUM", complexity: "LOW" },
    ],
  },
];

const complexityLabel: Record<string, string> = {
  LOW: "Easy setup",
  MEDIUM: "Medium setup",
  HIGH: "Complex setup",
  ENTERPRISE: "Enterprise",
};
const complexityColor: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  ENTERPRISE: "bg-red-100 text-red-800",
};

export default function IntegrationsPage() {
  const integrationCategories = [
    {
      icon: Database,
      title: "ERP Systems",
      description:
        "SAP, Oracle NetSuite, Microsoft Dynamics 365, Infor, Epicor, Sage",
      count: "15+",
    },
    {
      icon: ShoppingCart,
      title: "E-Commerce",
      description: "Shopify, WooCommerce, Magento, BigCommerce, Amazon, eBay",
      count: "20+",
    },
    {
      icon: BarChart3,
      title: "Analytics & BI",
      description: "Power BI, Tableau, Looker, Google Analytics, Datadog",
      count: "10+",
    },
    {
      icon: Mail,
      title: "Communication",
      description: "Slack, Microsoft Teams, Email, SMS, Push Notifications",
      count: "8+",
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "SharePoint, Google Drive, Dropbox, OneDrive, Box",
      count: "12+",
    },
    {
      icon: MessageSquare,
      title: "CRM Systems",
      description: "Salesforce, HubSpot, Microsoft Dynamics CRM, Zoho",
      count: "6+",
    },
    {
      icon: Clock,
      title: "Workforce, Rota & Time",
      description:
        "UKG/Kronos, ADP Workforce Now, Workday, Rippling, BambooHR, Deputy, Planday, When I Work",
      count: "12+",
    },
  ];

  const integrationCatalog = [
    {
      title: "Rota / Time & Attendance",
      providers: [
        "UKG / Kronos",
        "ADP Workforce Now",
        "Workday Time Tracking",
        "Rippling",
        "BambooHR",
        "Gusto Time",
        "Deputy",
        "Planday",
        "When I Work",
        "Rotavu (native)",
        "7shifts",
        "Tanda / Workforce.com",
        "Humanity",
        "Shiftboard",
      ],
    },
    {
      title: "ERP / Finance",
      providers: [
        "SAP",
        "Oracle NetSuite",
        "Microsoft Dynamics 365",
        "Infor",
        "Sage Intacct",
        "Epicor",
      ],
    },
    {
      title: "E-Commerce / Marketplaces",
      providers: [
        "Shopify",
        "Magento / Adobe Commerce",
        "BigCommerce",
        "WooCommerce",
        "Amazon",
        "eBay",
        "Walmart",
      ],
    },
    {
      title: "WMS / TMS / Shipping",
      providers: [
        "Manhattan",
        "Blue Yonder",
        "ShipEngine",
        "EasyPost",
        "FedEx",
        "UPS",
        "DHL",
      ],
    },
    {
      title: "Analytics / Data",
      providers: [
        "Power BI",
        "Tableau",
        "Looker",
        "BigQuery",
        "Snowflake",
        "Datadog",
      ],
    },
  ];

  const integrationFeatures = [
    {
      icon: Plug,
      title: "Pre-Built Connectors",
      description:
        "100+ ready-to-use integrations for popular business applications.",
    },
    {
      icon: Code,
      title: "REST API",
      description:
        "Comprehensive API for custom integrations and automation workflows.",
    },
    {
      icon: Webhook,
      title: "Webhooks",
      description:
        "Real-time event notifications to trigger actions in external systems.",
    },
    {
      icon: RefreshCw,
      title: "Bi-Directional Sync",
      description: "Two-way data synchronization keeps all systems up to date.",
    },
    {
      icon: Zap,
      title: "Zapier & Make",
      description:
        "Connect to 5,000+ apps through no-code automation platforms.",
    },
    {
      icon: Database,
      title: "Data Mapping",
      description:
        "Flexible field mapping and transformation for seamless data flow.",
    },
  ];

  const apiCapabilities = [
    "RESTful architecture with JSON responses",
    "OAuth 2.0 authentication and authorization",
    "Rate limiting and usage quotas",
    "Comprehensive API documentation",
    "SDKs for popular programming languages",
    "Sandbox environment for testing",
    "Webhook event delivery with retries",
    "API versioning for backward compatibility",
  ];

  const useCases = [
    {
      title: "Automated Order Processing",
      description:
        "Connect e-commerce platforms to automatically create stock reservations and update inventory levels across all channels.",
      icon: ShoppingCart,
    },
    {
      title: "Financial Reconciliation",
      description:
        "Sync transactions with accounting systems for real-time financial reporting and automated reconciliation.",
      icon: FileText,
    },
    {
      title: "Analytics Pipeline",
      description:
        "Stream inventory data to BI tools for advanced analytics, forecasting, and business intelligence.",
      icon: BarChart3,
    },
  ];

  const benefits = [
    "Connect existing tools without data migration",
    "Automate workflows between systems",
    "Eliminate manual data entry and errors",
    "Real-time synchronization across platforms",
    "Reduce integration development time by 70%",
    "Monitor integration health with dashboards",
    "Scale integrations as your business grows",
    "Expert support for custom integration needs",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Powerful Integrations
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect LogiVox with your entire tech stack. 100+ pre-built
              integrations, comprehensive APIs, and webhooks for seamless
              automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">View API Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              100+ Pre-Built Integrations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with the tools you already use (all connector-based and
              configurable)
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrationCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.title}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                    <CardTitle className="mt-4">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Catalog */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Integration Coverage</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rota, time, ERP, commerce, logistics, analytics — powered via
              API/webhooks and configurable mappings
            </p>
            <p className="text-sm text-muted-foreground">
              Availability depends on connector enablement and customer
              entitlements; setup required per provider.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {integrationCatalog.map((category) => (
              <Card key={category.title} className="h-full">
                <CardHeader>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>
                    Connector-based; mapping required for IDs, locations, and
                    payloads.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {category.providers.map((provider) => (
                      <li key={provider} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{provider}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Flexible Integration Options
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the integration method that fits your needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {integrationFeatures.map((feature) => {
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

      {/* API Capabilities */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">API Platform</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Developer-Friendly REST API
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Build custom integrations with our comprehensive,
                well-documented API.
              </p>
              <div className="space-y-3">
                {apiCapabilities.map((capability) => (
                  <div key={capability} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{capability}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/contact">
                    Get API Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>API Example</CardTitle>
                  <CardDescription>
                    Simple and intuitive endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-green-400">
                      {"// Get inventory items"}
                    </div>
                    <div className="mt-2">
                      <span className="text-purple-400">GET</span>{" "}
                      <span className="text-blue-400">/api/v1/inventory</span>
                    </div>
                    <div className="mt-4 text-green-400">
                      {"// Create booking"}
                    </div>
                    <div className="mt-2">
                      <span className="text-purple-400">POST</span>{" "}
                      <span className="text-blue-400">/api/v1/bookings</span>
                    </div>
                    <div className="mt-2 text-slate-400">{"{"}</div>
                    <div className="ml-4 text-slate-400">
                      <span className="text-blue-300">"customer_id"</span>:{" "}
                      <span className="text-yellow-300">"12345"</span>,
                    </div>
                    <div className="ml-4 text-slate-400">
                      <span className="text-blue-300">"items"</span>: [...]
                    </div>
                    <div className="text-slate-400">{"}"}</div>
                    <div className="mt-4 text-green-400">
                      {"// Webhook events"}
                    </div>
                    <div className="mt-2">
                      <span className="text-purple-400">POST</span>{" "}
                      <span className="text-blue-400">/webhooks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Integration Use Cases</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-world examples of powerful automation
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title}>
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Hub</CardTitle>
                  <CardDescription>
                    Manage all connections in one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Plug className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Integration management dashboard will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">Seamless Connectivity</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our integration platform eliminates data silos and automates
                workflows.
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect Your Systems?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start integrating LogiVox with your tech stack today
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
              <Link href="/contact">Explore Integrations</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
