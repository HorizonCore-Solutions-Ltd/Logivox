import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, PieChart, LineChart, Database, CheckCircle2, ArrowRight, AlertTriangle, Code } from "lucide-react";

export const metadata: Metadata = {
  title: "BI & Analytics Integration Guide | LogiVox Documentation",
  description:
    "Connect Power BI, Tableau, Looker, Qlik, and Domo with LogiVox Data Warehouse. Real-time KPI datasets, inventory metrics, and executive dashboards.",
};

export default function BIPage() {
  const providers = [
    { name: "Microsoft Power BI", type: "BI Platform", auth: "OAuth 2.0 / DirectQuery", complexity: "Medium", emoji: "📊", notes: "Direct SQL connection or REST API datasets. Pre-built templates for Order Fulfillment and Inventory Health." },
    { name: "Tableau", type: "BI Platform", auth: "PostgreSQL Driver / REST API", complexity: "Medium", emoji: "📈", notes: "Tableau Server or Online — live SQL connection or extract refresh via REST API." },
    { name: "Looker / Google Looker Studio", type: "BI Platform", auth: "SQL Driver / API Key", complexity: "High", emoji: "🔍", notes: "LookML models or Looker Studio connectors for ad-hoc data exploration." },
    { name: "Qlik Sense", type: "BI Platform", auth: "ODBC / REST API", complexity: "High", emoji: "🟢", notes: "Associative analytics engine with ODBC connector or Qlik Data Gateway." },
    { name: "Domo", type: "BI Platform", auth: "REST API / JDBC", complexity: "Medium", emoji: "🔴", notes: "Push datasets via Domo Streams API or JDBC connector for real-time dashboards." },
    { name: "Google Analytics 4", type: "Web Analytics", auth: "Measurement Protocol", complexity: "Low", emoji: "📉", notes: "Track user behavior in customer portals and track warehouse operator productivity." },
  ];

  const syncedData = [
   { title: "Inventory KPIs", description: "Stock levels, turnover rate, aging, and ABC classification metrics", direction: "LogiVox → BI" },
    { title: "Order Metrics", description: "Order volume, fulfillment time, pick accuracy, and ship-on-time percentage", direction: "LogiVox → BI" },
    { title: "Warehouse Productivity", description: "Picks per hour, lines per hour, labor utilization, and shift performance", direction: "LogiVox → BI" },
    { title: "Financial Data", description: "COGS, inventory valuation, freight costs, and revenue by customer", direction: "LogiVox → BI" },
    { title: "Quality Metrics", description: "Cycle count accuracy, damage rate, and customer return rate", direction: "LogiVox → BI" },
    { title: "Custom Dimensions", description: "Filter by warehouse, customer, SKU category, or time period", direction: "LogiVox → BI" },
  ];

  const steps = [
    { step: 1, title: "Enable Analytics Data Feed", description: "In LogiVox → Settings → Integrations → BI & Analytics, enable the data warehouse connector." },
    { step: 2, title: "Generate SQL Credentials", description: "Create read-only SQL credentials (PostgreSQL wire protocol) or REST API key for dataset export." },
    { step: 3, title: "Choose Connection Method", description: "Select DirectQuery (real-time), Scheduled Extract (hourly/daily), or REST API push." },
    { step: 4, title: "Connect BI Tool", description: "In Power BI / Tableau, add a PostgreSQL data source and enter connection string with credentials." },
    { step: 5, title: "Import Schema / Tables", description: "Select tables: Orders, Inventory, Transactions, Receipts, Shipments — or use pre-built views." },
    { step: 6, title: "Configure Refresh Policy", description: "Set incremental refresh schedule (every 15min, 1hr, or daily) to minimize database load." },
    { step: 7, title: "Build Dashboards", description: "Use LogiVox pre-built templates or create custom reports. Publish to your BI platform." },
  ];

  const useCases = [
    {
      title: "Inventory Health Dashboard",
      description: "Real-time visibility into stock levels, slow-moving inventory, and replenishment needs across all warehouses.",
      icon: BarChart3,
    },
    {
      title: "Order Fulfillment Analytics",
      description: "Track order volume trends, pick-to-ship time, and on-time delivery performance by customer and carrier.",
      icon: PieChart,
    },
    {
      title: "Warehouse Productivity Reports",
      description: "Labor utilization heatmaps, picks per hour by operator, and shift-over-shift performance comparisons.",
      icon: LineChart,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/docs/integrations" className="text-indigo-300 hover:text-white text-sm">
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-indigo-700 text-indigo-100">Analytics & BI</Badge>
              <h1 className="text-4xl font-bold">BI Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-indigo-100 max-w-3xl">
            Turn warehouse data into actionable insights. Direct connectors for Power BI, Tableau, and modern data stacks with real-time KPI streaming.
          </p>
        </div>
      </section>

      {/* Supported BI Tools */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported BI Platforms</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{p.complexity}</Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">{p.type}</Badge>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Auth:</span> {p.auth}</p>
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
          <h2 className="text-2xl font-bold mb-6">Available Datasets</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {syncedData.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{item.direction}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8 text-center">Common Analytics Use Cases</h2>
          <div className="grid gap-8 lg:grid-cols-3">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title}>
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center mb-4">
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

      {/* Setup Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Snippet */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code className="h-4 w-4" /> Export KPI Dataset</CardTitle>
                <CardDescription>GET /api/integrations/bi/export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">{"// Export inventory KPIs"}</div>
                  <div className="mt-2"><span className="text-purple-400">GET</span> <span className="text-blue-400">/api/integrations/bi/export?dataset=inventory</span></div>
                  <div className="mt-4 text-slate-400">{"// Response: JSON array"}</div>
                  <div className="mt-2 text-slate-400">{"["}</div>
                  <div className="ml-2 text-slate-400">{"{"}</div>
                  <div className="ml-4"><span className="text-blue-300">"sku"</span>: <span className="text-yellow-300">"WIDGET-001"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"warehouse"</span>: <span className="text-yellow-300">"US-WEST"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"on_hand"</span>: <span className="text-orange-300">1250</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"available"</span>: <span className="text-orange-300">980</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"turnover_rate"</span>: <span className="text-orange-300">4.2</span></div>
                  <div className="ml-2 text-slate-400">{"},..."}</div>
                  <div className="text-slate-400">{"]"}</div>
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
            <AlertTitle>Direct SQL Access Available</AlertTitle>
            <AlertDescription>
              For advanced users: LogiVox provides PostgreSQL wire protocol access to the data warehouse. Contact support to enable DirectQuery for Power BI or Tableau live connections.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-indigo-600 to-purple-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to visualize your data?</h2>
          <p className="text-indigo-100 mb-6">Start building executive dashboards with LogiVox BI connectors.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">Start Free Trial<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" asChild>
              <Link href="/contact">Talk to Analytics Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
