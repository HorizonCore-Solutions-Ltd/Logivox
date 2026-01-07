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
  Package,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Create First Receiving Order | LogiVox Help Center",
  description:
    "Learn how to receive incoming inventory from suppliers, inspect items, and put away stock to warehouse locations.",
};

export default function CreateFirstReceivingPage() {
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
            <span>Create First Receiving Order</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">8 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Create Your First Receiving Order
          </h1>
          <p className="text-xl text-muted-foreground">
            Process incoming inventory from suppliers with inspection,
            verification, and putaway workflows.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <Package className="h-4 w-4" />
            <AlertTitle>What is a Receiving Order?</AlertTitle>
            <AlertDescription>
              A receiving order (also called an inbound order or ASN - Advanced
              Shipping Notice) documents expected inventory arriving from a
              supplier. It guides your team through unloading, inspection, and
              putting items away to proper locations.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">The Receiving Workflow</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Create Receiving Order
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter expected items from purchase order or ASN
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Receive Items</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan and count items as they arrive
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Quality Inspection (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Inspect for damage or quality issues
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Putaway</h3>
                    <p className="text-sm text-muted-foreground">
                      Move items to designated storage locations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Complete Order</h3>
                    <p className="text-sm text-muted-foreground">
                      Close receiving order and update inventory
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Step 1: Create a New Receiving Order
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <div>
                    <p className="font-medium">
                      Navigate to Receiving from the main menu
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <div>
                    <p className="font-medium">Click "New Receiving Order"</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <div>
                    <p className="font-medium">Fill in order details:</p>
                    <ul className="mt-2 ml-4 space-y-1 text-sm text-muted-foreground">
                      <li>• Purchase Order Number (from your supplier)</li>
                      <li>• Supplier Name</li>
                      <li>• Expected Arrival Date</li>
                      <li>• Carrier and Tracking Number (if available)</li>
                      <li>• Receiving Warehouse</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <div>
                    <p className="font-medium">Add expected items:</p>
                    <ul className="mt-2 ml-4 space-y-1 text-sm text-muted-foreground">
                      <li>• Search and select product SKU</li>
                      <li>• Enter expected quantity</li>
                      <li>• Add more items as needed</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    5.
                  </span>
                  <div>
                    <p className="font-medium">Save the receiving order</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Import from Purchase Order</AlertTitle>
            <AlertDescription>
              If your ERP system is integrated, you can automatically import
              receiving orders from purchase orders. Go to Settings,
              Integrations to set this up.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">
            Step 2: Receive Items at the Dock
          </h2>
          <p className="text-muted-foreground mb-6">
            When the shipment arrives, use a mobile device to receive items:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Using Mobile Device</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Open LogiVox mobile app</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Tap "Receiving"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>
                    Select the open receiving order (or scan PO barcode)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>For each item:</span>
                </li>
              </ol>

              <div className="ml-6 space-y-3 border-l-2 border-primary-200 pl-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Scan product barcode</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Enter actual quantity received</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Enter lot number or serial numbers (if tracked)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Enter expiration date (for perishables)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Mark as received</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">Handling Discrepancies</h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                If actual quantities don't match expected:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Over Receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Received more than expected - system allows you to accept
                      or reject extras
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Under Receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Received less than expected - mark as partial receipt or
                      cancel remaining
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Damaged Items</p>
                    <p className="text-sm text-muted-foreground">
                      Mark damaged quantity, system moves to quarantine location
                      automatically
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Step 3: Quality Inspection (Optional)
          </h2>
          <p className="text-muted-foreground mb-6">
            For quality-critical items, perform inspection before putaway:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>In mobile app, tap "Quality Check"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Scan item to inspect</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Complete inspection checklist (if configured)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Mark as Pass, Fail, or Conditional Pass</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Add photos or notes if needed</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Step 4: Putaway to Storage Locations
          </h2>
          <p className="text-muted-foreground mb-6">
            Move received items from dock to their designated storage locations:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                System-Directed Putaway (Recommended)
              </h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>In mobile app, tap "Putaway"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Scan item to putaway</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>
                    System suggests optimal location (based on velocity, size,
                    rules)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Walk to suggested location</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Scan location barcode to confirm</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Place item in location</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">7.</span>
                  <span>Confirm putaway complete</span>
                </li>
              </ol>

              <h3 className="font-semibold mb-4">Manual Location Selection</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Alternatively, you can override and choose a specific location:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>After scanning item, tap "Choose Location"</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Browse or search available locations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Select and confirm location</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Putaway Strategy Tips</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • <strong>Fast-movers:</strong> Place near shipping area for
                  quick access
                </li>
                <li>
                  • <strong>Slow-movers:</strong> Store in bulk area or higher
                  shelves
                </li>
                <li>
                  • <strong>Heavy items:</strong> Put on lower shelves for
                  safety
                </li>
                <li>
                  • <strong>Small items:</strong> Use bin locations to maximize
                  space
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">
            Step 5: Complete the Receiving Order
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Once all items are received and put away:
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>
                    Review receiving summary for any outstanding items
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Resolve any discrepancies or quality holds</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Click "Complete Receiving Order"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>System updates inventory quantities and locations</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>
                    Receiving report is generated (can be printed or emailed)
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">
                  Create Receiving Orders in Advance
                </h4>
                <p className="text-sm text-muted-foreground">
                  Enter expected receipts as soon as you get the purchase order.
                  Your team will be ready when shipments arrive.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Use Staging Area</h4>
                <p className="text-sm text-muted-foreground">
                  Designate a receiving staging zone to separate incoming items
                  from regular inventory until processed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">
                  Document Damages Immediately
                </h4>
                <p className="text-sm text-muted-foreground">
                  Take photos and notes of any damaged items at receipt for
                  supplier claims.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Complete Same Day</h4>
                <p className="text-sm text-muted-foreground">
                  Try to receive and putaway items on the same day to keep
                  inventory accuracy high.
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/dashboard-overview">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Dashboard Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      Navigate the main dashboard and monitor your operations
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/inventory/cycle-counting">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Cycle Counting</h3>
                    <p className="text-sm text-muted-foreground">
                      Maintain inventory accuracy with regular counts
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
              <Link href="/help/getting-started/setup-mobile-devices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Setup Mobile Devices
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/dashboard-overview">
                Next: Dashboard Overview
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
