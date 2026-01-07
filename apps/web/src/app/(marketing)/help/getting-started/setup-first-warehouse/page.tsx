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
  AlertCircle,
  Lightbulb,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Setting Up Your First Warehouse | LogiVox Help Center",
  description:
    "Step-by-step guide to creating and configuring your first warehouse in LogiVox WMS.",
};

export default function SetupFirstWarehousePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb */}
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
            <span>Setup First Warehouse</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">5 min read</Badge>
            <Badge variant="secondary">
              <Video className="h-3 w-3 mr-1" />
              Video Available
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Setting Up Your First Warehouse
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete walkthrough of creating and configuring your first
            warehouse location in LogiVox.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <div className="prose prose-lg max-w-none">
            {/* Prerequisites */}
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Before You Begin</AlertTitle>
              <AlertDescription>
                Make sure you have:
                <ul className="mt-2 space-y-1">
                  <li>✓ Created your LogiVox account</li>
                  <li>✓ Verified your email address</li>
                  <li>✓ Logged into your dashboard</li>
                </ul>
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">
              Step 1: Navigate to Warehouse Settings
            </h2>
            <p className="text-muted-foreground mb-6">
              From your main dashboard, access the warehouse configuration area:
            </p>
            <Card className="mb-8">
              <CardContent className="p-6">
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">
                      1.
                    </span>
                    <span>
                      Click the <strong>Settings</strong> icon in the sidebar
                      navigation
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">
                      2.
                    </span>
                    <span>
                      Select <strong>Warehouses</strong> from the settings menu
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary-600 min-w-[24px]">
                      3.
                    </span>
                    <span>
                      Click the <strong>"+ Add Warehouse"</strong> button
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">
              Step 2: Enter Warehouse Details
            </h2>
            <p className="text-muted-foreground mb-6">
              Fill in the basic information about your warehouse facility:
            </p>

            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Warehouse Name</h3>
                <p className="text-muted-foreground">
                  Choose a clear, descriptive name (e.g., "Main Distribution
                  Center", "East Coast Warehouse")
                </p>
              </div>

              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Warehouse Code</h3>
                <p className="text-muted-foreground">
                  A unique 2-6 character identifier (e.g., "WH01", "NYC",
                  "MAIN"). This code will appear on all documents.
                </p>
              </div>

              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">
                  Address Information
                </h3>
                <p className="text-muted-foreground">
                  Complete physical address including street, city, state, and
                  zip code. This is used for shipping labels and carrier
                  integrations.
                </p>
              </div>

              <div className="border-l-4 border-primary-600 pl-4">
                <h3 className="font-semibold text-lg mb-2">Time Zone</h3>
                <p className="text-muted-foreground">
                  Select the appropriate time zone for accurate timestamps and
                  shift management.
                </p>
              </div>
            </div>

            <Alert className="mb-8" variant="default">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                Use consistent naming conventions if you plan to add multiple
                warehouses. For example: "Distribution Center - Los Angeles" vs
                "DC-LA".
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">
              Step 3: Configure Warehouse Operations
            </h2>
            <p className="text-muted-foreground mb-6">
              Set up your operational preferences:
            </p>

            <Card className="mb-8">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Operating Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Define when your warehouse operates (e.g., Monday-Friday, 8
                    AM - 5 PM). This affects task scheduling and reporting.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Default Receiving Location
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Where new inventory arrives before being put away (we'll
                    configure specific locations in the next step).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Inventory Valuation Method
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose FIFO (First In, First Out), LIFO (Last In, First
                    Out), or Average Cost.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Unit of Measure Preference
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select Imperial (feet, pounds) or Metric (meters, kilograms)
                    for dimensions and weights.
                  </p>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">
              Step 4: Set Up Basic Locations
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your initial warehouse location structure:
            </p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Receiving Zone</strong>
                      <p className="text-sm text-muted-foreground">
                        Where incoming shipments are processed (e.g., "RCV-001")
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Bulk Storage</strong>
                      <p className="text-sm text-muted-foreground">
                        For pallet storage (e.g., "BULK-A01", "BULK-A02")
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Pick Zone</strong>
                      <p className="text-sm text-muted-foreground">
                        For high-velocity items (e.g., "PICK-A-01-01")
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <strong>Shipping Staging</strong>
                      <p className="text-sm text-muted-foreground">
                        Where orders wait for shipment (e.g., "SHIP-001")
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="mb-8">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Quick Setup Available</AlertTitle>
              <AlertDescription>
                You can start with a simple setup and add more locations later.
                See our guide on{" "}
                <Link
                  href="/help/getting-started/configure-locations"
                  className="text-primary hover:underline"
                >
                  Configuring Warehouse Locations
                </Link>{" "}
                for detailed location planning.
              </AlertDescription>
            </Alert>

            <h2 className="text-2xl font-bold mb-4">Step 5: Review and Save</h2>
            <p className="text-muted-foreground mb-6">Before finalizing:</p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Double-check the warehouse code (this cannot be changed
                      later)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Verify the address is complete and accurate</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Confirm the time zone is correct</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Click <strong>"Save Warehouse"</strong> to complete setup
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
            <p className="text-muted-foreground mb-6">
              Congratulations! Your warehouse is now set up. Here's what to do
              next:
            </p>

            <div className="grid gap-4 mb-8">
              <Link href="/help/getting-started/add-users-roles">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Add Users and Assign Roles
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Invite your team members
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/help/getting-started/configure-locations">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Configure Detailed Locations
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Set up zones, aisles, and bins
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/help/getting-started/import-inventory">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Import Your Inventory</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your product catalog
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      <section className="border-t py-8 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/help/getting-started">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Getting Started
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/add-users-roles">
                Next: Add Users
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Helpful Section */}
      <section className="border-t py-8">
        <div className="container-enterprise max-w-4xl text-center">
          <h3 className="font-semibold mb-4">Was this article helpful?</h3>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">👍 Yes</Button>
            <Button variant="outline">👎 No</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Still need help?{" "}
            <Link
              href="/contact?subject=help-warehouse-setup"
              className="text-primary hover:underline"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
