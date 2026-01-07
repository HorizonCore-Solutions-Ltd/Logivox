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
  Smartphone,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Setup Mobile Devices | LogiVox Help Center",
  description:
    "Configure barcode scanners and tablets for warehouse operations including receiving, picking, and cycle counting.",
};

export default function SetupMobileDevicesPage() {
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
            <span>Setup Mobile Devices</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">7 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Setup Mobile Devices</h1>
          <p className="text-xl text-muted-foreground">
            Configure barcode scanners, smartphones, and tablets for warehouse
            floor operations.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <Smartphone className="h-4 w-4" />
            <AlertTitle>Device Options</AlertTitle>
            <AlertDescription>
              LogiVox works with dedicated barcode scanners, smartphones with
              camera scanning, and industrial tablets. Choose what works best
              for your operations and budget.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Supported Device Types</h2>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  📱
                </div>
                <h3 className="font-semibold text-lg mb-2">Smartphones</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  iOS or Android phones with camera-based scanning
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Low cost option</li>
                  <li>✓ Camera barcode scanning</li>
                  <li>✓ WiFi connectivity</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  🔲
                </div>
                <h3 className="font-semibold text-lg mb-2">Barcode Scanners</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Dedicated handheld or ring scanners with Bluetooth
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Fast scanning</li>
                  <li>✓ Rugged design</li>
                  <li>✓ Long battery life</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mb-4">
                  📲
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  Industrial Tablets
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Rugged tablets with integrated scanners
                </p>
                <ul className="text-xs space-y-1">
                  <li>✓ Large screen</li>
                  <li>✓ Built-in scanner</li>
                  <li>✓ Drop-proof design</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Recommended Hardware</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Budget-Friendly Options</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Any modern smartphone (iOS 14+ or Android 10+)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use existing devices with mobile app
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Socket Mobile SocketScan S700</p>
                    <p className="text-sm text-muted-foreground">
                      Bluetooth scanner, under $300
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold mb-4">Professional-Grade Options</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Zebra TC21/TC26 Mobile Computer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Industrial Android device with integrated scanner
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Honeywell CT40</p>
                    <p className="text-sm text-muted-foreground">
                      Rugged handheld with long battery life
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Zebra DS3608 Scanner</p>
                    <p className="text-sm text-muted-foreground">
                      Ultra-rugged corded or cordless scanner
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Setup Instructions</h2>

          <h3 className="text-xl font-semibold mb-4">
            Option 1: Mobile App Setup (Smartphones/Tablets)
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Step 1: Install the App</h4>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <span>Open App Store (iOS) or Google Play (Android)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <span>Search for "LogiVox WMS"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <span>Tap Install/Get</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <span>Wait for download to complete</span>
                </li>
              </ol>

              <h4 className="font-semibold mb-4">
                Step 2: Login and Configure
              </h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <span>Open the LogiVox app</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <span>
                    Enter your company subdomain (e.g., yourcompany.logivox.com)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <span>Login with your username and password</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <span>
                    Grant camera permissions when prompted (for barcode
                    scanning)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    5.
                  </span>
                  <span>
                    Select your default warehouse if you have multiple locations
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Option 2: Dedicated Scanner Setup
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Bluetooth Pairing</h4>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <div>
                    <p className="font-medium">Turn on your barcode scanner</p>
                    <p className="text-sm text-muted-foreground">
                      Hold power button until LED lights up
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <div>
                    <p className="font-medium">Enable Bluetooth pairing mode</p>
                    <p className="text-sm text-muted-foreground">
                      Usually a dedicated button or barcode to scan
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <div>
                    <p className="font-medium">
                      On your phone/tablet, go to Settings, Bluetooth
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <div>
                    <p className="font-medium">
                      Select your scanner from available devices
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Usually shows model name or serial number
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    5.
                  </span>
                  <div>
                    <p className="font-medium">Enter PIN if prompted</p>
                    <p className="text-sm text-muted-foreground">
                      Default is often 0000 or 1234
                    </p>
                  </div>
                </li>
              </ol>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Scanner Configuration:</strong> Most Bluetooth
                  scanners work in keyboard emulation mode, meaning scans appear
                  as if typed. No additional driver installation needed!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Option 3: Web Browser Access
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                For desktop computers or when apps aren't available:
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    1.
                  </span>
                  <span>
                    Open any modern web browser (Chrome, Safari, Edge, Firefox)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    2.
                  </span>
                  <span>
                    Navigate to your LogiVox URL (yourcompany.logivox.com)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    3.
                  </span>
                  <span>Login with your credentials</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">
                    4.
                  </span>
                  <span>
                    Use USB or wireless barcode scanners in keyboard mode
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Test Your Setup</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Verify everything is working correctly:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Test barcode scanning</p>
                    <p className="text-sm text-muted-foreground">
                      Scan a product barcode in the inventory search
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Test location scanning</p>
                    <p className="text-sm text-muted-foreground">
                      Scan a location barcode during putaway
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Verify WiFi connectivity</p>
                    <p className="text-sm text-muted-foreground">
                      Walk around warehouse to check signal strength
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Check battery life</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure devices last full shift
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-8" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Common Setup Issues</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • <strong>Scanner not connecting:</strong> Check batteries and
                  Bluetooth is on
                </li>
                <li>
                  • <strong>Barcodes not reading:</strong> Clean scanner lens,
                  increase brightness
                </li>
                <li>
                  • <strong>App crashing:</strong> Update to latest version,
                  restart device
                </li>
                <li>
                  • <strong>Slow performance:</strong> Check WiFi signal, clear
                  app cache
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">
            Device Management Best Practices
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Label each device with ID number
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Easier to track and assign to users
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Create charging station</p>
                    <p className="text-sm text-muted-foreground">
                      Designated area for overnight charging
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Keep spare devices</p>
                    <p className="text-sm text-muted-foreground">
                      Backup devices for malfunctions or damage
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Regular maintenance schedule</p>
                    <p className="text-sm text-muted-foreground">
                      Clean lenses weekly, update software monthly
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Enforce logout at shift end</p>
                    <p className="text-sm text-muted-foreground">
                      Security best practice
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/create-first-receiving">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Create Your First Receiving Order
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Process incoming inventory from suppliers
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/getting-started/dashboard-overview">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Dashboard Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      Navigate the main dashboard and understand key metrics
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
              <Link href="/help/getting-started/import-inventory">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Import Inventory
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/create-first-receiving">
                Next: Create Receiving Order
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
