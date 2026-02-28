import { Metadata } from "next";
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
  Building2,
  Users,
  Lock,
  Shield,
  Cpu,
  Bot,
  Truck,
  ClipboardCheck,
  BarChart3,
  Globe,
  Mic,
  Package,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Integration Guides | LogiVox Documentation",
  description:
    "Step-by-step setup guides for all LogiVox integrations — ERP, HR, SSO, hardware, robotics, carriers, QMS, BI, IoT, and more.",
};

const GUIDES = [
  {
    href: "/docs/integrations/erp",
    icon: Building2,
    color: "bg-blue-600",
    label: "ERP Systems",
    description: "SAP S/4HANA, Oracle ERP Cloud, Microsoft Dynamics 365, Odoo",
    providers: 6,
    difficulty: "Enterprise",
  },
  {
    href: "/docs/integrations/hr",
    icon: Users,
    color: "bg-violet-600",
    label: "HR & Workforce",
    description: "Workday, SAP SuccessFactors, UKG, ADP, BambooHR, HiBob",
    providers: 6,
    difficulty: "Medium–Enterprise",
  },
  {
    href: "/docs/integrations/sso",
    icon: Lock,
    color: "bg-sky-600",
    label: "Identity & SSO",
    description: "Microsoft Entra ID, Okta, Google Workspace, Auth0, OneLogin",
    providers: 5,
    difficulty: "Medium",
  },
  {
    href: "/docs/integrations/access-control",
    icon: Shield,
    color: "bg-rose-600",
    label: "Physical Access Control",
    description: "Paxton Net2, Gallagher, HID Origo, LenelS2, Brivo, Genetec",
    providers: 6,
    difficulty: "Medium–Enterprise",
  },
  {
    href: "/docs/integrations/hardware",
    icon: Cpu,
    color: "bg-amber-600",
    label: "Warehouse Hardware",
    description:
      "Zebra, Honeywell, Datalogic, Impinj RFID, Siemens PLC, Allen-Bradley",
    providers: 7,
    difficulty: "Medium–Enterprise",
  },
  {
    href: "/docs/integrations/robotics",
    icon: Bot,
    color: "bg-teal-600",
    label: "Robotics & Automation",
    description: "AutoStore, Dematic, Locus AMR, Geek+, Fetch Robotics",
    providers: 5,
    difficulty: "Enterprise",
  },
  {
    href: "/docs/integrations/tms-yms",
    icon: Truck,
    color: "bg-orange-600",
    label: "TMS & Yard Management",
    description: "FleetOps360, Samsara, Webfleet, Trimble TMS, MercuryGate",
    providers: 5,
    difficulty: "Medium–High",
  },
  {
    href: "/docs/integrations/qms",
    icon: ClipboardCheck,
    color: "bg-lime-600",
    label: "Quality Management (QMS)",
    description:
      "iAuditor, EcoOnline, MasterControl, ETQ Reliance, Veeva Vault",
    providers: 5,
    difficulty: "Medium–Enterprise",
  },
  {
    href: "/docs/integrations/bi",
    icon: BarChart3,
    color: "bg-indigo-600",
    label: "Analytics & BI",
    description: "Power BI, Tableau, Looker, Qlik, Domo, Google Analytics",
    providers: 6,
    difficulty: "Medium",
  },
  {
    href: "/docs/integrations/iot-cloud",
    icon: Globe,
    color: "bg-cyan-600",
    label: "IoT & Cloud Sensors",
    description: "AWS IoT Core, Azure IoT Hub, Google Cloud IoT",
    providers: 3,
    difficulty: "High",
  },
  {
    href: "/docs/integrations/voice-hardware",
    icon: Mic,
    color: "bg-pink-600",
    label: "Voice-Directed Picking",
    description: "Honeywell Vocollect, Lydia Voice, Android BYOD headsets",
    providers: 3,
    difficulty: "High",
  },
  {
    href: "/docs/integrations/carriers",
    icon: Package,
    color: "bg-yellow-600",
    label: "Carriers & Shipping",
    description: "FedEx, UPS, DHL, Royal Mail, DPD, USPS, ShipStation",
    providers: 7,
    difficulty: "Medium",
  },
  {
    href: "/docs/integrations/shopify",
    icon: ShoppingCart,
    color: "bg-fuchsia-600",
    label: "Shopify",
    description: "Real-time order sync, inventory updates, and fulfilment",
    providers: 1,
    difficulty: "Easy",
  },
  {
    href: "/docs/integrations/quickbooks",
    icon: CreditCard,
    color: "bg-emerald-600",
    label: "QuickBooks Online",
    description: "Invoices, bills, and P&L sync with QuickBooks",
    providers: 1,
    difficulty: "Easy",
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  "Medium–High": "bg-orange-100 text-orange-800",
  "Medium–Enterprise": "bg-orange-100 text-orange-800",
  High: "bg-red-100 text-red-800",
  Enterprise: "bg-red-100 text-red-800",
};

export default function IntegrationsDocsIndex() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-slate-50 py-12">
        <div className="container max-w-5xl mx-auto px-6">
          <Badge className="mb-3">Integration Guides</Badge>
          <h1 className="text-4xl font-bold mb-3">All Integration Guides</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Step-by-step setup guides for every LogiVox connector — from SAP ERP
            to AutoStore robotics, carrier labels to voice-directed picking.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {GUIDES.length} guides · 60+ providers covered
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => {
            const Icon = g.icon;
            return (
              <Link key={g.href} href={g.href} className="group block">
                <Card className="h-full hover:shadow-md transition-shadow group-hover:border-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`h-10 w-10 rounded-lg ${g.color} flex items-center justify-center`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${difficultyColor[g.difficulty] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {g.difficulty}
                      </span>
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {g.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {g.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {g.providers} provider{g.providers !== 1 ? "s" : ""}
                      </span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Prerequisites */}
        <div className="mt-16 rounded-xl border bg-slate-50 p-8">
          <h2 className="text-xl font-bold mb-4">Before You Start</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "A LogiVox account with Integration Admin role",
              "API credentials from your target provider",
              "Network access / firewall rules confirmed",
              "A test/staging environment to validate before production",
              "Field mapping plan (SKU, location, and cost-centre IDs)",
              "Rollback plan and sync monitoring enabled",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Need help with a specific connector?
          </p>
          <Button asChild>
            <Link href="/contact">
              Talk to an Integration Specialist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
