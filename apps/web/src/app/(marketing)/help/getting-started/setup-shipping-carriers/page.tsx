import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle2, Truck, Lightbulb } from "lucide-react"

export const metadata: Metadata = {
  title: "Setup Shipping Carriers | LogiVox Help Center",
  description: "Integrate FedEx, UPS, USPS, and other carriers for automated rate shopping, label printing, and tracking.",
}

export default function SetupShippingCarriersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-8">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <span>/</span>
            <Link href="/help/getting-started" className="hover:text-primary">Getting Started</Link>
            <span>/</span>
            <span>Setup Shipping Carriers</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">12 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Setup Shipping Carriers</h1>
          <p className="text-xl text-muted-foreground">
            Integrate FedEx, UPS, USPS, and other carriers for automated shipping, rate shopping, and tracking.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <Truck className="h-4 w-4" />
            <AlertTitle>Carrier Integration Benefits</AlertTitle>
            <AlertDescription>
              Direct carrier integration enables real-time rate comparison, automatic label printing, package tracking, and simplified billing. Save time and money on every shipment.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Supported Carriers</h2>
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold">
                    F
                  </div>
                  <div>
                    <h3 className="font-semibold">FedEx</h3>
                    <p className="text-xs text-muted-foreground">Express, Ground, Home Delivery</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Fast domestic and international shipping with extensive tracking.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center text-xl font-bold">
                    U
                  </div>
                  <div>
                    <h3 className="font-semibold">UPS</h3>
                    <p className="text-xs text-muted-foreground">Ground, Air, International</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Reliable service with advanced logistics capabilities.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                    US
                  </div>
                  <div>
                    <h3 className="font-semibold">USPS</h3>
                    <p className="text-xs text-muted-foreground">First Class, Priority, Priority Express</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Cost-effective option for lightweight packages and residential delivery.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xl font-bold">
                    D
                  </div>
                  <div>
                    <h3 className="font-semibold">DHL</h3>
                    <p className="text-xs text-muted-foreground">International shipping specialist</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Best for international shipments with global reach.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold">
                    C
                  </div>
                  <div>
                    <h3 className="font-semibold">Canada Post</h3>
                    <p className="text-xs text-muted-foreground">Canadian shipping</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Domestic and international service for Canadian operations.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                    +
                  </div>
                  <div>
                    <h3 className="font-semibold">Regional Carriers</h3>
                    <p className="text-xs text-muted-foreground">OnTrac, LaserShip, etc.</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Cost-effective regional alternatives with zone-specific service.</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Before You Begin</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Active carrier accounts</p>
                    <p className="text-sm text-muted-foreground">Sign up directly with each carrier you want to use</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">API credentials</p>
                    <p className="text-sm text-muted-foreground">Request developer/API access from carrier support</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Shipping address</p>
                    <p className="text-sm text-muted-foreground">Your warehouse "ship from" address on file with carriers</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Label printer (optional)</p>
                    <p className="text-sm text-muted-foreground">Thermal printer for 4x6 shipping labels</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Negotiated Rates</AlertTitle>
            <AlertDescription>
              If you have negotiated shipping rates with carriers, make sure to use those API credentials. This ensures you get your discounted rates when LogiVox requests quotes.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Step-by-Step: FedEx Integration</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Step 1: Get FedEx API Credentials</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Go to <Link href="https://developer.fedex.com" className="text-primary hover:underline" target="_blank">developer.fedex.com</Link></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Sign in with your FedEx account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Create a new API project</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Note down: API Key, Secret Key, Account Number, Meter Number</span>
                </li>
              </ol>

              <h3 className="font-semibold mb-4">Step 2: Configure in LogiVox</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, then Shipping Carriers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Click "Add Carrier" and select FedEx</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Enter your API credentials</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Enter your ship-from address</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Click "Test Connection"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>If successful, click "Save"</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Step-by-Step: UPS Integration</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Step 1: Get UPS API Credentials</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Go to <Link href="https://www.ups.com/upsdeveloperkit" className="text-primary hover:underline" target="_blank">UPS Developer Kit</Link></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Request API access (requires UPS account number)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Receive Access License Number, User ID, Password</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Note your UPS Account Number</span>
                </li>
              </ol>

              <h3 className="font-semibold mb-4">Step 2: Configure in LogiVox</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, then Shipping Carriers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Click "Add Carrier" and select UPS</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Enter Access License Number, User ID, Password</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Enter UPS Account Number</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Enter ship-from address</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Test and save</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Step-by-Step: USPS Integration</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Step 1: Get USPS Web Tools</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Go to <Link href="https://www.usps.com/business/web-tools-apis/" className="text-primary hover:underline" target="_blank">USPS Web Tools</Link></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Sign up for Web Tools account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Receive User ID via email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Request production access (test account has limits)</span>
                </li>
              </ol>

              <h3 className="font-semibold mb-4">Step 2: Configure in LogiVox</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, then Shipping Carriers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Click "Add Carrier" and select USPS</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Enter USPS User ID</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Enter ship-from address</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Test and save</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Configure Rate Shopping</h2>
          <p className="text-muted-foreground mb-6">
            Rate shopping automatically compares prices across carriers to find the best rate for each shipment.
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Setup Rate Shopping Rules</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Go to Settings, Shipping Rules</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Enable "Automatic Rate Shopping"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Set preferences:</span>
                </li>
              </ol>

              <div className="ml-6 space-y-3 border-l-2 border-primary-200 pl-4">
                <div>
                  <p className="font-medium text-sm">Cheapest Rate (Default)</p>
                  <p className="text-xs text-muted-foreground">Always select lowest cost option</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Fastest Delivery</p>
                  <p className="text-xs text-muted-foreground">Prioritize speed over cost</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Balanced</p>
                  <p className="text-xs text-muted-foreground">Consider both cost and delivery time</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Custom Rules</p>
                  <p className="text-xs text-muted-foreground">Set carrier preferences by weight, destination, or product</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Setup Label Printing</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Configure Label Printer</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Connect thermal label printer to computer (USB or network)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Install printer drivers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>In LogiVox, go to Settings, Printers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Select your label printer from the list</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Set label size (usually 4x6 inches)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Print test label</span>
                </li>
              </ol>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>No label printer?</strong> You can print to standard paper (8.5x11) or save labels as PDF and print later. Thermal printers are recommended for high volume.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Test Your Integration</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Create a Test Shipment</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Create a test order or use existing order</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Go to Shipping, select the order</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Click "Get Shipping Rates"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Verify rates appear from configured carriers</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Select a service level (e.g., FedEx Ground)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Click "Print Label"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">7.</span>
                  <span>Verify label prints correctly</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">8.</span>
                  <span>Check tracking number is generated</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Compare Multiple Carriers</h4>
                <p className="text-sm text-muted-foreground">
                  Integrate at least 2-3 carriers to ensure you always have competitive rates and backup options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Monitor Carrier Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Track delivery times and damage rates. Switch carriers if performance declines.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Verify Package Dimensions</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure product dimensions in system are accurate. Incorrect dimensions lead to billing adjustments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Schedule Pickups</h4>
                <p className="text-sm text-muted-foreground">
                  Set up daily pickup schedules with carriers instead of calling each time.
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/customize-workflows">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Customize Workflows</h3>
                    <p className="text-sm text-muted-foreground">Adapt LogiVox to your specific warehouse processes</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/shipping/batch-shipping">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Batch Shipping</h3>
                    <p className="text-sm text-muted-foreground">Process multiple orders at once for efficiency</p>
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
              <Link href="/help/getting-started/configure-scanners">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Configure Scanners
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/customize-workflows">
                Next: Customize Workflows
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
            Need assistance? <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
