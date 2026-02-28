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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  AlertTriangle,
  Code,
  RefreshCw,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ERP Integration Guide | LogiVox Documentation",
  description:
    "Connect SAP S/4HANA, Oracle ERP Cloud, Microsoft Dynamics 365, NetSuite, and Odoo with LogiVox WMS. Sync materials, purchase orders, GR/GI, and stock transport orders.",
};

export default function ERPIntegrationPage() {
  const providers = [
    {
      name: "SAP S/4HANA",
      auth: "OAuth 2.0",
      complexity: "Enterprise",
      emoji: "🔵",
      notes:
        "Uses SAP API Business Hub — Materials Management, WM/EWM modules.",
    },
    {
      name: "SAP ECC (Legacy)",
      auth: "RFC / IDoc",
      complexity: "Enterprise",
      emoji: "🔵",
      notes: "RFC-based BAPI calls and IDoc message types WMMBXY, DESADV.",
    },
    {
      name: "Oracle ERP Cloud",
      auth: "OAuth 2.0",
      complexity: "Enterprise",
      emoji: "🔴",
      notes:
        "Oracle Fusion REST APIs — Inventory, Procurement, and Order Management.",
    },
    {
      name: "Microsoft Dynamics 365",
      auth: "OAuth 2.0 (Entra ID)",
      complexity: "Enterprise",
      emoji: "🟦",
      notes:
        "D365 Finance & Supply Chain — OData v4 entities for items, POs, and transfers.",
    },
    {
      name: "Dynamics 365 Business Central",
      auth: "OAuth 2.0",
      complexity: "High",
      emoji: "🟦",
      notes: "Mid-market ERP — REST API v2.0 for items, sales/purchase orders.",
    },
    {
      name: "Odoo",
      auth: "API Key / XML-RPC",
      complexity: "Medium",
      emoji: "🟣",
      notes:
        "Open-source ERP — JSON-RPC or XML-RPC, modules: stock, mrp, purchase.",
    },
  ];

  const syncedData = [
    {
      title: "Materials / Items",
      description: "Product master records synced to LogiVox item catalogue",
      direction: "ERP → LogiVox",
    },
    {
      title: "Purchase Orders",
      description: "PO lines drive inbound receipts and ASN creation",
      direction: "ERP → LogiVox",
    },
    {
      title: "Goods Receipts (GR)",
      description: "GR / GI postings written back to ERP on confirmation",
      direction: "LogiVox → ERP",
    },
    {
      title: "Stock Transport Orders",
      description: "Inter-site transfers triggered and confirmed",
      direction: "Bidirectional",
    },
    {
      title: "Delivery Notes / ASN",
      description: "Outbound shipment data posted to ERP on goods issue",
      direction: "LogiVox → ERP",
    },
    {
      title: "Inventory Snapshot",
      description: "Periodic stock reconciliation by location and batch",
      direction: "Bidirectional",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Enable the ERP Connector",
      description:
        "In LogiVox → Settings → Integrations → ERP, select your provider and click Enable.",
    },
    {
      step: 2,
      title: "Create an API credential in your ERP",
      description:
        "Generate an OAuth client (or API key for Odoo) scoped to Materials Management and Inventory APIs.",
    },
    {
      step: 3,
      title: "Enter credentials in LogiVox",
      description:
        "Paste the Client ID, Client Secret, and Token URL into the connector configuration screen.",
    },
    {
      step: 4,
      title: "Map plants / warehouses",
      description:
        "Match your ERP plant codes and storage locations to LogiVox warehouse zones.",
    },
    {
      step: 5,
      title: "Configure sync direction & frequency",
      description:
        "Choose real-time webhooks (where supported) or scheduled polling intervals (5 / 15 / 60 min).",
    },
    {
      step: 6,
      title: "Run a test sync",
      description:
        "Trigger a manual sync from the dashboard and verify 10–20 items and a sample PO appear correctly.",
    },
    {
      step: 7,
      title: "Enable production mode",
      description:
        "Enable the connector for live traffic. Monitor sync health in the Integrations Dashboard.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-blue-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-blue-700 text-blue-100">
                ERP Systems
              </Badge>
              <h1 className="text-4xl font-bold">ERP Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            Connect your enterprise resource planning system to LogiVox for
            real-time materials, purchase order, and inventory synchronisation.
          </p>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported ERP Providers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {p.complexity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Auth:</span>{" "}
                    {p.auth}
                  </p>
                  <p>{p.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Gets Synced */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">What Gets Synchronised</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {syncedData.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {item.direction}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Snippet */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Trigger Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Trigger ERP Sync
                </CardTitle>
                <CardDescription>POST /api/integrations/erp</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Trigger a full ERP sync"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">/api/integrations/erp</span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">"SAP_S4HANA"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"action"</span>:{" "}
                    <span className="text-yellow-300">"sync"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"scope"</span>:{" "}
                    <span className="text-yellow-300">
                      "materials,purchase_orders"
                    </span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                  <div className="mt-4 text-slate-400">{"// Response"}</div>
                  <div className="mt-1 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"syncId"</span>:{" "}
                    <span className="text-yellow-300">"sync_abc123"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"status"</span>:{" "}
                    <span className="text-yellow-300">"running"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">"SAP_S4HANA"</span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Alert */}
      <section className="py-10 bg-white">
        <div className="container-enterprise max-w-3xl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Enterprise Setup</AlertTitle>
            <AlertDescription>
              SAP and Oracle ERP integrations require enterprise-tier access and
              dedicated onboarding support. Contact your LogiVox account team to
              begin the implementation process.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-blue-600 to-blue-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to connect your ERP?
          </h2>
          <p className="text-blue-100 mb-6">
            Our integration team will guide you through the full setup.
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
              <Link href="/contact">Talk to an Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
