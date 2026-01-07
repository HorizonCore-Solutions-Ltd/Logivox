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
  Calculator,
  CheckCircle2,
  Copy,
  Code,
  ArrowRight,
  RefreshCw,
  FileText,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "QuickBooks Integration Guide | LogiVox Documentation",
  description:
    "Connect QuickBooks with LogiVox WMS for seamless accounting integration. Sync orders, invoices, and inventory costs.",
};

export default function QuickBooksIntegrationPage() {
  const syncedData = [
    {
      title: "Sales Orders",
      description: "Export fulfilled orders as QuickBooks invoices",
      direction: "LogiVox → QuickBooks",
    },
    {
      title: "Purchase Orders",
      description: "Import POs to track incoming inventory",
      direction: "QuickBooks → LogiVox",
    },
    {
      title: "Inventory Costs",
      description: "Sync COGS and inventory valuation",
      direction: "Two-way",
    },
    {
      title: "Customers",
      description: "Keep customer records synchronized",
      direction: "Two-way",
    },
    {
      title: "Payments",
      description: "Track payment status and reconciliation",
      direction: "QuickBooks → LogiVox",
    },
    {
      title: "Chart of Accounts",
      description: "Map warehouse accounts to QuickBooks",
      direction: "One-time setup",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border-b py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <Link href="/docs" className="hover:text-white">
              Documentation
            </Link>
            <span>/</span>
            <Link href="/docs/integrations" className="hover:text-white">
              Integrations
            </Link>
            <span>/</span>
            <span>QuickBooks</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
              <Calculator className="h-6 w-6" />
            </div>
            <h1 className="text-5xl font-bold">QuickBooks Integration</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Streamline your accounting by connecting LogiVox with QuickBooks
            Online or Desktop. Automate invoicing, track costs, and maintain
            accurate financial records.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Badge className="bg-green-500 text-white">
              Official Integration
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20"
            >
              QB Online
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20"
            >
              QB Desktop
            </Badge>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Integration Overview</h2>

          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    QuickBooks Online
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Real-time API connection</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Automatic sync every 15 minutes</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>OAuth 2.0 secure authentication</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Multi-company support</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    QuickBooks Desktop
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Web Connector integration</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Scheduled sync (hourly, daily)</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Pro, Premier, Enterprise supported</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>On-premise data security</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Setup for QB Online */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Setup: QuickBooks Online</h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Connect Your Account</CardTitle>
                <CardDescription>
                  Authorize LogiVox to access your QuickBooks data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-semibold">1.</span>
                    <div>
                      <p>
                        In LogiVox, navigate to{" "}
                        <strong>Settings → Integrations → QuickBooks</strong>
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-semibold">2.</span>
                    <div>
                      <p>
                        Click <strong>"Connect to QuickBooks Online"</strong>
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-semibold">3.</span>
                    <div>
                      <p>Sign in to your Intuit account when prompted</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-semibold">4.</span>
                    <div>
                      <p>Select the QuickBooks company you want to connect</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-semibold">5.</span>
                    <div>
                      <p>Review and authorize the requested permissions</p>
                    </div>
                  </li>
                </ol>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Permissions Needed</AlertTitle>
                  <AlertDescription>
                    LogiVox requires access to: Customers, Items/Products,
                    Sales, Purchase Orders, Invoices, and Payments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Map Your Accounts</CardTitle>
                <CardDescription>
                  Connect LogiVox accounts to QuickBooks Chart of Accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Map these LogiVox accounts to corresponding QuickBooks
                    accounts:
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold">
                            LogiVox Account
                          </th>
                          <th className="text-left p-3 font-semibold">
                            QuickBooks Account
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3">Sales Revenue</td>
                          <td className="p-3 text-muted-foreground">
                            Income → Sales
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">Cost of Goods Sold</td>
                          <td className="p-3 text-muted-foreground">
                            Cost of Goods Sold → Inventory
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">Inventory Asset</td>
                          <td className="p-3 text-muted-foreground">
                            Other Current Assets → Inventory
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">Shipping Income</td>
                          <td className="p-3 text-muted-foreground">
                            Income → Shipping & Handling
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">Sales Tax Payable</td>
                          <td className="p-3 text-muted-foreground">
                            Current Liabilities → Sales Tax
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Configure Sync Settings</CardTitle>
                <CardDescription>
                  Choose what data to synchronize and when
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Invoice Creation</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically create invoices when orders are fulfilled
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Customer Sync</div>
                      <div className="text-sm text-muted-foreground">
                        Import QuickBooks customers to LogiVox
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Inventory Valuation</div>
                      <div className="text-sm text-muted-foreground">
                        Update product costs based on purchase orders
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Payment Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Mark invoices as paid when payment received
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What Gets Synced */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <RefreshCw className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Data Synchronization</h2>
          </div>

          <div className="grid gap-4">
            {syncedData.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {item.direction}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Invoice Workflow */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Invoice Workflow</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automated Invoice Creation</CardTitle>
              <CardDescription>
                How orders become invoices in QuickBooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      Order Fulfilled in LogiVox
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Order is picked, packed, and shipped
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-muted h-6"></div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Customer Lookup</h4>
                    <p className="text-sm text-muted-foreground">
                      LogiVox matches customer to QuickBooks record
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-muted h-6"></div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Invoice Created</h4>
                    <p className="text-sm text-muted-foreground">
                      Invoice generated in QuickBooks with line items, shipping,
                      and tax
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-muted h-6"></div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">COGS Updated</h4>
                    <p className="text-sm text-muted-foreground">
                      Cost of goods sold journal entry recorded
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-muted h-6"></div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold">Inventory Adjusted</h4>
                    <p className="text-sm text-muted-foreground">
                      Inventory asset account reduced by cost value
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cost Tracking */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Cost Tracking & Valuation</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Cost Methods</CardTitle>
              <CardDescription>
                Choose how LogiVox calculates inventory costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    FIFO (First In, First Out)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Oldest inventory costs are used first. Recommended for most
                    businesses.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    LIFO (Last In, First Out)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Newest inventory costs are used first. Check with your
                    accountant for tax implications.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Weighted Average</h4>
                  <p className="text-sm text-muted-foreground">
                    Average cost across all units in stock. Simplest method for
                    consistent pricing.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Specific Identification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Track individual unit costs (serial numbers). Best for
                    high-value items.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Troubleshooting</h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoices Not Creating</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Verify customer exists in QuickBooks</li>
                  <li>✓ Check account mapping is complete</li>
                  <li>✓ Ensure all products have QuickBooks items</li>
                  <li>✓ Review sync logs for specific errors</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Values Incorrect</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Confirm cost method matches QuickBooks</li>
                  <li>✓ Verify purchase order costs are importing</li>
                  <li>✓ Check for manual cost overrides</li>
                  <li>✓ Reconcile inventory valuation reports</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Lost</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    ✓ Re-authorize OAuth connection (expires every 6 months)
                  </li>
                  <li>✓ Check QuickBooks subscription is active</li>
                  <li>✓ Verify network connectivity</li>
                  <li>✓ Contact support if issue persists</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container-enterprise max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help with Setup?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Our accounting integration specialists can help you get QuickBooks
            connected properly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/docs/integrations">
                <Code className="mr-2 h-5 w-5" />
                View All Integrations
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-transparent hover:bg-white/10 text-white border-white"
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
