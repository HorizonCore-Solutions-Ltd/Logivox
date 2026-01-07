import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Import Initial Inventory | LogiVox Help Center",
  description:
    "Learn how to import your product catalog and inventory data via CSV or API integration.",
};

export default function ImportInventoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-8">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-primary">
              Help Center
            </Link>
            <span>/</span>
            <Link href="/help/getting-started" className="hover:text-primary">
              Getting Started
            </Link>
            <span>/</span>
            <span>Import Inventory</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">10 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Import Your Initial Inventory
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload your product catalog and inventory data using CSV import or
            API integration.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Before You Begin</AlertTitle>
            <AlertDescription>
              Ensure you have completed warehouse setup and configured your
              storage locations. You'll assign inventory to these locations
              during import.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Import Methods</h2>
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-6">
                <FileSpreadsheet className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">CSV Upload</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a spreadsheet with your product and inventory data.
                  Best for one-time imports or manual updates.
                </p>
                <ul className="text-sm space-y-1">
                  <li>✓ Simple and quick</li>
                  <li>✓ No technical knowledge required</li>
                  <li>✓ Up to 10,000 items per file</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold mb-4">
                  API
                </div>
                <h3 className="font-semibold text-lg mb-2">API Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your ERP, e-commerce platform, or existing system for
                  real-time synchronization.
                </p>
                <ul className="text-sm space-y-1">
                  <li>✓ Automated sync</li>
                  <li>✓ Real-time updates</li>
                  <li>✓ Unlimited items</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Method 1: CSV Upload</h2>

          <h3 className="text-xl font-semibold mb-4">
            Step 1: Download the Template
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <span>Navigate to Inventory, then Import Inventory</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <span>Click "Download CSV Template"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <span>
                    Open the template in Excel, Google Sheets, or any
                    spreadsheet software
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Step 2: Fill in Product Data
          </h3>
          <p className="text-muted-foreground mb-4">
            Complete the following required and optional fields:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Required Fields</h4>
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-primary-600 pl-4">
                  <p className="font-medium">SKU</p>
                  <p className="text-sm text-muted-foreground">
                    Unique product identifier (e.g., WIDGET-001)
                  </p>
                </div>

                <div className="border-l-4 border-primary-600 pl-4">
                  <p className="font-medium">Product Name</p>
                  <p className="text-sm text-muted-foreground">
                    Descriptive product name
                  </p>
                </div>

                <div className="border-l-4 border-primary-600 pl-4">
                  <p className="font-medium">Quantity</p>
                  <p className="text-sm text-muted-foreground">
                    Number of units in stock
                  </p>
                </div>

                <div className="border-l-4 border-primary-600 pl-4">
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    Where item is stored (e.g., PICK-A-01-02-03)
                  </p>
                </div>
              </div>

              <h4 className="font-semibold mb-4">Optional But Recommended</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-medium text-sm">Barcode / UPC</p>
                  <p className="text-xs text-muted-foreground">For scanning</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Category</p>
                  <p className="text-xs text-muted-foreground">
                    Product classification
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Cost</p>
                  <p className="text-xs text-muted-foreground">
                    Unit cost price
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Weight</p>
                  <p className="text-xs text-muted-foreground">
                    Shipping weight
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Dimensions</p>
                  <p className="text-xs text-muted-foreground">L x W x H</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Reorder Point</p>
                  <p className="text-xs text-muted-foreground">
                    Low stock threshold
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Reorder Quantity</p>
                  <p className="text-xs text-muted-foreground">
                    How much to reorder
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Lot Number</p>
                  <p className="text-xs text-muted-foreground">
                    Batch tracking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-8" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Common Import Errors to Avoid</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Duplicate SKUs (each SKU must be unique)</li>
                <li>
                  • Invalid location codes (must match existing locations)
                </li>
                <li>• Missing required fields</li>
                <li>• Incorrect number formats (use decimals, not commas)</li>
                <li>• Special characters in SKU field</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h3 className="text-xl font-semibold mb-4">
            Step 3: Upload and Review
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <div>
                    <p className="font-medium">
                      Save your completed spreadsheet as CSV
                    </p>
                    <p className="text-sm text-muted-foreground">
                      File, Save As, CSV (Comma delimited)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <div>
                    <p className="font-medium">
                      Go back to Inventory, Import Inventory
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <div>
                    <p className="font-medium">
                      Click "Upload CSV" and select your file
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <div>
                    <p className="font-medium">Review the validation summary</p>
                    <p className="text-sm text-muted-foreground">
                      System checks for errors and shows preview
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    5.
                  </span>
                  <div>
                    <p className="font-medium">
                      If validation passes, click "Confirm Import"
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Method 2: API Integration</h2>
          <p className="text-muted-foreground mb-6">
            Connect your existing systems for automated inventory
            synchronization.
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Popular Integrations</h3>
              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Shopify</p>
                    <p className="text-xs text-muted-foreground">
                      E-commerce platform sync
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">QuickBooks</p>
                    <p className="text-xs text-muted-foreground">
                      Accounting integration
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">SAP</p>
                    <p className="text-xs text-muted-foreground">
                      Enterprise ERP
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">NetSuite</p>
                    <p className="text-xs text-muted-foreground">Cloud ERP</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">WooCommerce</p>
                    <p className="text-xs text-muted-foreground">
                      WordPress e-commerce
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Custom REST API</p>
                    <p className="text-xs text-muted-foreground">
                      Your own system
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help with API integration?</strong> Our
                  implementation team can assist with connecting your systems.{" "}
                  <Link
                    href="/contact"
                    className="text-primary hover:underline"
                  >
                    Contact us
                  </Link>{" "}
                  for a consultation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Basic API Integration Steps
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, then Integrations</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Select your platform (e.g., Shopify, QuickBooks)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Follow the authorization wizard</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>
                    Configure sync settings (frequency, field mapping)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Test the connection and run initial sync</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            After Import: Verify Your Data
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Once import is complete, perform these checks:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Review inventory summary</p>
                    <p className="text-sm text-muted-foreground">
                      Check total items, total value, low stock alerts
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Spot check several items</p>
                    <p className="text-sm text-muted-foreground">
                      Verify SKUs, quantities, and locations are correct
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Test barcode scanning</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure barcodes are properly linked
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Run an inventory report</p>
                    <p className="text-sm text-muted-foreground">
                      Export to verify all data imported correctly
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Pro Tip: Cycle Counting</AlertTitle>
            <AlertDescription>
              After initial import, schedule regular cycle counts to maintain
              accuracy. Start with high-value or high-velocity items and count a
              small portion of inventory daily.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/setup-mobile-devices">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Setup Mobile Devices</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure scanners and tablets for your warehouse team
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/getting-started/create-first-receiving">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Create First Receiving Order
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Process incoming inventory from suppliers
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t py-8 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/help/getting-started/configure-locations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Configure Locations
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/setup-mobile-devices">
                Next: Setup Mobile Devices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t py-8">
        <div className="container-enterprise max-w-4xl text-center">
          <h3 className="font-semibold mb-4">Was this article helpful?</h3>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">Yes, this helped</Button>
            <Button variant="outline">No, I need more help</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Need assistance?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
