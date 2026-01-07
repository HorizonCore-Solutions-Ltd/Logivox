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
  Scan,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Configure Barcode Scanners | LogiVox Help Center",
  description:
    "Setup and test barcode scanners for warehouse operations including symbology configuration and troubleshooting.",
};

export default function ConfigureScannersPage() {
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
            <span>Configure Scanners</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Intermediate</Badge>
            <Badge variant="outline">10 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Configure Barcode Scanners
          </h1>
          <p className="text-xl text-muted-foreground">
            Hardware setup, symbology configuration, and troubleshooting for
            optimal scanning performance.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <Scan className="h-4 w-4" />
            <AlertTitle>Scanner Configuration</AlertTitle>
            <AlertDescription>
              Most scanners work out of the box, but proper configuration
              improves speed and accuracy. This guide covers common setup tasks.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">
            Scanner Connection Methods
          </h2>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  USB
                </div>
                <h3 className="font-semibold text-lg mb-2">USB Wired</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Direct connection to computer
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Most reliable</li>
                  <li>✓ No batteries needed</li>
                  <li>✓ Plug and play</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  BT
                </div>
                <h3 className="font-semibold text-lg mb-2">Bluetooth</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Wireless connection to mobile devices
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Portable and flexible</li>
                  <li>✓ Works with phones/tablets</li>
                  <li>✓ Requires pairing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  WiFi
                </div>
                <h3 className="font-semibold text-lg mb-2">WiFi Network</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connected to warehouse network
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Long range</li>
                  <li>✓ Multiple devices</li>
                  <li>✓ Requires network setup</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Initial Scanner Setup</h2>

          <h3 className="text-xl font-semibold mb-4">
            Step 1: Physical Connection
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">For USB Scanners</h4>
              <ol className="space-y-2 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Plug scanner USB cable into computer</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>
                    Wait for driver installation (Windows usually auto-installs)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Open a text editor and test scan a barcode</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>If numbers appear, scanner is working correctly</span>
                </li>
              </ol>

              <h4 className="font-semibold mb-4">For Bluetooth Scanners</h4>
              <ol className="space-y-2">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Power on the scanner</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>
                    Scan the "Bluetooth Pairing" barcode (usually in scanner
                    manual)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>On your device, go to Bluetooth settings</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Select scanner from available devices</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Enter PIN if prompted (often 0000 or 1234)</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Step 2: Configure Symbologies
          </h3>
          <p className="text-muted-foreground mb-6">
            Symbologies are barcode types (UPC, Code 128, QR codes, etc.).
            Enable only the types you use for faster scanning.
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Common Barcode Types</h4>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">UPC-A / EAN-13</p>
                    <p className="text-sm text-muted-foreground">
                      Retail product barcodes (12-13 digits)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Code 128</p>
                    <p className="text-sm text-muted-foreground">
                      Warehouse and shipping labels (alphanumeric)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Code 39</p>
                    <p className="text-sm text-muted-foreground">
                      Industrial and government use
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">QR Code</p>
                    <p className="text-sm text-muted-foreground">
                      2D codes with high data capacity
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Data Matrix</p>
                    <p className="text-sm text-muted-foreground">
                      Small 2D codes for compact items
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>LogiVox Recommendation:</strong> Enable UPC-A, EAN-13,
                  and Code 128 at minimum. These cover most retail and warehouse
                  applications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Step 3: Configure Scanning Behavior
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Most scanners allow configuration via special programming
                barcodes in the user manual. Common settings:
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-primary-600 pl-4">
                  <h4 className="font-semibold mb-1">Keyboard Wedge Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Scanner inputs like keyboard typing (default and
                    recommended)
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4">
                  <h4 className="font-semibold mb-1">Add Suffix (Enter Key)</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically press Enter after each scan for form
                    submission
                  </p>
                </div>

                <div className="border-l-4 border-primary-400 pl-4">
                  <h4 className="font-semibold mb-1">Scan Beep</h4>
                  <p className="text-sm text-muted-foreground">
                    Audio feedback when successful (enable for confirmation)
                  </p>
                </div>

                <div className="border-l-4 border-primary-300 pl-4">
                  <h4 className="font-semibold mb-1">LED Indicator</h4>
                  <p className="text-sm text-muted-foreground">
                    Visual feedback for successful scan (green light)
                  </p>
                </div>

                <div className="border-l-4 border-primary-200 pl-4">
                  <h4 className="font-semibold mb-1">Continuous Scan Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Scan multiple items without trigger press (useful for batch
                    processing)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Testing Your Scanner</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Verification Steps</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <div>
                    <p className="font-medium">Test in text editor</p>
                    <p className="text-sm text-muted-foreground">
                      Open Notepad/TextEdit and scan a barcode - numbers should
                      appear
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <div>
                    <p className="font-medium">Test in LogiVox</p>
                    <p className="text-sm text-muted-foreground">
                      Go to Inventory, click search field, scan a product
                      barcode
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <div>
                    <p className="font-medium">Test different symbologies</p>
                    <p className="text-sm text-muted-foreground">
                      Scan UPC codes, QR codes, and location labels
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <div>
                    <p className="font-medium">Test at various distances</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure scanner reads from 2 inches to 12 inches away
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <div>
                    <p className="font-medium">Test damaged barcodes</p>
                    <p className="text-sm text-muted-foreground">
                      Try scanning worn or partially obscured labels
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Troubleshooting Common Issues
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    Scanner Not Responding
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Check cable connection or Bluetooth pairing</li>
                    <li>• Replace batteries if wireless</li>
                    <li>• Restart the device</li>
                    <li>
                      • Verify driver installation (Windows Device Manager)
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    Barcode Won't Scan
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Clean scanner lens with microfiber cloth</li>
                    <li>• Increase lighting or adjust angle</li>
                    <li>• Enable the correct symbology</li>
                    <li>• Check if barcode is damaged or faded</li>
                    <li>• Ensure barcode isn't behind plastic or glass</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    Wrong Data Captured
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Disable unused symbologies to prevent misreads</li>
                    <li>• Check prefix/suffix settings</li>
                    <li>
                      • Verify keyboard layout matches (US vs International)
                    </li>
                    <li>• Recalibrate scanner with factory reset barcode</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    Slow Scanning Speed
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Disable unnecessary symbologies</li>
                    <li>• Increase scan trigger sensitivity</li>
                    <li>• Check for low battery</li>
                    <li>• Improve warehouse lighting</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-red-600">
                    Bluetooth Keeps Disconnecting
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Stay within range (typically 30 feet)</li>
                    <li>• Remove interference sources</li>
                    <li>• Charge or replace batteries</li>
                    <li>• Re-pair the device</li>
                    <li>• Update Bluetooth firmware</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-8" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>When to Contact Support</AlertTitle>
            <AlertDescription>
              If scanner still doesn't work after troubleshooting:
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Scanner may be defective (contact manufacturer)</li>
                <li>• Incompatible model (check LogiVox compatibility list)</li>
                <li>
                  • Advanced configuration needed (contact LogiVox support)
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Advanced Configuration</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                Custom Prefixes and Suffixes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add characters before or after scanned data for specific
                workflows:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tab Suffix</p>
                    <p className="text-sm text-muted-foreground">
                      Move to next form field after scan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Enter Suffix</p>
                    <p className="text-sm text-muted-foreground">
                      Submit form immediately after scan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Location Prefix</p>
                    <p className="text-sm text-muted-foreground">
                      Add "LOC-" to distinguish location scans from product
                      scans
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Regular Cleaning</h4>
                <p className="text-sm text-muted-foreground">
                  Clean scanner lens weekly with microfiber cloth. Dust and
                  smudges reduce read performance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Battery Maintenance</h4>
                <p className="text-sm text-muted-foreground">
                  For wireless scanners, charge nightly. Keep spare batteries on
                  hand for long shifts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Save Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Document your scanner settings. Print or save programming
                  barcodes for quick reset.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Training</h4>
                <p className="text-sm text-muted-foreground">
                  Train warehouse staff on proper scanning technique (distance,
                  angle, lighting).
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/setup-shipping-carriers">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Setup Shipping Carriers</h3>
                    <p className="text-sm text-muted-foreground">
                      Integrate FedEx, UPS, USPS for automated shipping
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/inventory/barcode-labels">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Print Barcode Labels</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate and print labels for products and locations
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
              <Link href="/help/getting-started/dashboard-overview">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Dashboard Overview
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/setup-shipping-carriers">
                Next: Setup Shipping Carriers
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
