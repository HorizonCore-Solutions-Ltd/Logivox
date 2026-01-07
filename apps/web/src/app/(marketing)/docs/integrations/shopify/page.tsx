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
  ShoppingBag,
  CheckCircle2,
  Copy,
  Code,
  Zap,
  ArrowRight,
  Download,
  Settings,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Shopify Integration Guide | LogiVox Documentation",
  description:
    "Connect your Shopify store with LogiVox WMS. Sync orders, inventory, and fulfillment automatically.",
};

export default function ShopifyIntegrationPage() {
  const integrationSteps = [
    {
      step: 1,
      title: "Install LogiVox App",
      description: "Add LogiVox from the Shopify App Store",
    },
    {
      step: 2,
      title: "Connect Your Store",
      description: "Authorize LogiVox to access your Shopify data",
    },
    {
      step: 3,
      title: "Configure Settings",
      description: "Map warehouses and set sync preferences",
    },
    {
      step: 4,
      title: "Initial Sync",
      description: "Import products and inventory levels",
    },
    {
      step: 5,
      title: "Test & Go Live",
      description: "Verify syncing and enable automation",
    },
  ];

  const syncedData = [
    {
      title: "Orders",
      description: "Automatic order import from Shopify to LogiVox",
      frequency: "Real-time",
    },
    {
      title: "Inventory Levels",
      description: "Two-way sync of stock quantities",
      frequency: "Every 5 minutes",
    },
    {
      title: "Fulfillment Status",
      description: "Update Shopify when orders ship",
      frequency: "Real-time",
    },
    {
      title: "Tracking Numbers",
      description: "Automatic tracking info to customers",
      frequency: "Real-time",
    },
    {
      title: "Product Data",
      description: "SKU, title, barcode, and variants",
      frequency: "On-demand",
    },
    {
      title: "Location Mapping",
      description: "Connect Shopify locations to warehouses",
      frequency: "Manual setup",
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
            <span>Shopify</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-5xl font-bold">Shopify Integration</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Seamlessly connect your Shopify store with LogiVox to automate order
            fulfillment and keep inventory synchronized in real-time.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Badge className="bg-green-500 text-white">
              Official Integration
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20"
            >
              Two-Way Sync
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20"
            >
              Real-time
            </Badge>
          </div>
        </div>
      </section>

      {/* Quick Setup */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Quick Setup Guide</h2>

          <div className="space-y-4">
            {integrationSteps.map((step) => (
              <Card key={step.step}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Download className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Installation</h2>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 1: Install from Shopify App Store</CardTitle>
              <CardDescription>
                Add LogiVox to your Shopify store in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-semibold">1.</span>
                  <div>
                    <p className="font-medium">Visit the Shopify App Store</p>
                    <p className="text-sm text-muted-foreground">
                      Search for "LogiVox WMS" or use this direct link:
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Open in App Store
                    </Button>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-semibold">2.</span>
                  <div>
                    <p className="font-medium">Click "Add app"</p>
                    <p className="text-sm text-muted-foreground">
                      Review the permissions requested by LogiVox
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-semibold">3.</span>
                  <div>
                    <p className="font-medium">Authorize the integration</p>
                    <p className="text-sm text-muted-foreground">
                      LogiVox will request access to orders, products, and
                      inventory
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-semibold">4.</span>
                  <div>
                    <p className="font-medium">Complete setup in LogiVox</p>
                    <p className="text-sm text-muted-foreground">
                      You'll be redirected to configure your integration
                      settings
                    </p>
                  </div>
                </li>
              </ol>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Free Trial Available</AlertTitle>
                <AlertDescription>
                  Test the Shopify integration free for 14 days. No credit card
                  required.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Configuration */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">Configuration</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Mapping</CardTitle>
                <CardDescription>
                  Connect Shopify locations to LogiVox warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Map each Shopify location to a corresponding LogiVox
                  warehouse. This ensures inventory counts stay synchronized.
                </p>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div>
                        <div className="font-medium">
                          Main Warehouse (Shopify)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          New York, NY
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          NYC Distribution Center
                        </div>
                        <div className="text-sm text-muted-foreground">
                          LogiVox WH-001
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div>
                        <div className="font-medium">West Coast (Shopify)</div>
                        <div className="text-sm text-muted-foreground">
                          Los Angeles, CA
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">LA Fulfillment Center</div>
                        <div className="text-sm text-muted-foreground">
                          LogiVox WH-002
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Import Settings</CardTitle>
                <CardDescription>
                  Configure how orders flow from Shopify to LogiVox
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Automatic Order Import</div>
                      <div className="text-sm text-muted-foreground">
                        Import orders immediately when placed in Shopify
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Order Status Filter</div>
                      <div className="text-sm text-muted-foreground">
                        Only import paid orders (recommended)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Fulfillment Service</div>
                      <div className="text-sm text-muted-foreground">
                        Set LogiVox as the fulfillment service
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Customer Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Let Shopify send shipping notifications
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Sync Settings</CardTitle>
                <CardDescription>
                  Control how inventory levels synchronize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Sync Frequency</div>
                      <div className="text-sm text-muted-foreground">
                        Every 5 minutes (configurable)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Sync Direction</div>
                      <div className="text-sm text-muted-foreground">
                        LogiVox → Shopify (one-way recommended)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Safety Stock Buffer</div>
                      <div className="text-sm text-muted-foreground">
                        Reserve 5 units to prevent overselling
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Out of Stock Handling</div>
                      <div className="text-sm text-muted-foreground">
                        Continue selling when out of stock: No
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
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <RefreshCw className="h-8 w-8 text-primary-600" />
            <h2 className="text-3xl font-bold">What Gets Synced</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {syncedData.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{item.frequency}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Webhook Configuration */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">
            Advanced: Webhook Configuration
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Event Notifications</CardTitle>
              <CardDescription>
                For developers who want more control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                LogiVox automatically configures webhooks during installation.
                If you need to set them up manually:
              </p>

              <div>
                <h4 className="font-semibold mb-3">Webhook Events</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Code className="h-4 w-4 text-primary-600" />
                    <code className="text-sm">orders/create</code>
                    <span className="text-sm text-muted-foreground">
                      New order placed
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Code className="h-4 w-4 text-primary-600" />
                    <code className="text-sm">orders/updated</code>
                    <span className="text-sm text-muted-foreground">
                      Order details changed
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Code className="h-4 w-4 text-primary-600" />
                    <code className="text-sm">orders/cancelled</code>
                    <span className="text-sm text-muted-foreground">
                      Order cancelled
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Code className="h-4 w-4 text-primary-600" />
                    <code className="text-sm">products/create</code>
                    <span className="text-sm text-muted-foreground">
                      New product added
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Code className="h-4 w-4 text-primary-600" />
                    <code className="text-sm">products/update</code>
                    <span className="text-sm text-muted-foreground">
                      Product details updated
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Webhook Endpoint</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 text-slate-100 p-3 rounded-lg text-sm">
                    https://api.logivox.com/v2/webhooks/shopify
                  </code>
                  <Button size="sm" variant="ghost">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Common Issues & Solutions</h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Not Syncing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Verify warehouse mapping is configured correctly</li>
                  <li>✓ Check that inventory sync is enabled in settings</li>
                  <li>✓ Ensure SKUs match between Shopify and LogiVox</li>
                  <li>✓ Review sync logs for error messages</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Not Importing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Confirm order import is enabled</li>
                  <li>✓ Check order status filter settings</li>
                  <li>✓ Verify webhook configuration</li>
                  <li>✓ Test with a new order to isolate the issue</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Status Not Updating</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Ensure LogiVox is set as fulfillment service</li>
                  <li>✓ Check that tracking numbers are valid</li>
                  <li>✓ Verify Shopify API permissions</li>
                  <li>✓ Review fulfillment logs in LogiVox</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container-enterprise max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect Your Store?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Start syncing orders and inventory in minutes with our Shopify
            integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="https://apps.shopify.com/logivox">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Install from App Store
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-transparent hover:bg-white/10 text-white border-white"
            >
              <Link href="/contact">Get Help with Setup</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
