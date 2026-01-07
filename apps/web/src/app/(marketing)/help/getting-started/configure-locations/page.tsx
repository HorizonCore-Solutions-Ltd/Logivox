import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Lightbulb } from "lucide-react"

export const metadata: Metadata = {
  title: "Configuring Warehouse Locations | LogiVox Help Center",
  description: "Learn how to set up zones, aisles, racks, and bin locations for optimal warehouse organization.",
}

export default function ConfigureLocationsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-8">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <span>/</span>
            <Link href="/help/getting-started" className="hover:text-primary">Getting Started</Link>
            <span>/</span>
            <span>Configure Locations</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">8 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Configuring Warehouse Locations</h1>
          <p className="text-xl text-muted-foreground">
            Set up zones, aisles, racks, and bin locations for optimal warehouse organization and inventory tracking.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Why Location Structure Matters</AlertTitle>
            <AlertDescription>
              A well-organized location system improves picking speed, reduces errors, and enables accurate inventory tracking. Plan your structure before creating locations.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Understanding Location Hierarchy</h2>
          <p className="text-muted-foreground mb-6">
            LogiVox uses a flexible hierarchy to organize your warehouse space:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="border-l-4 border-primary-600 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Warehouse</h3>
                  <p className="text-sm text-muted-foreground">Top level - Your entire facility</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Main Distribution Center</p>
                </div>
                
                <div className="ml-4 border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Zone</h3>
                  <p className="text-sm text-muted-foreground">Large area with similar characteristics</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Receiving Zone, Pick Zone, Bulk Storage</p>
                </div>
                
                <div className="ml-8 border-l-4 border-primary-400 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Aisle</h3>
                  <p className="text-sm text-muted-foreground">Walkway between racks</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Aisle A, Aisle B, Aisle 1, Aisle 2</p>
                </div>
                
                <div className="ml-12 border-l-4 border-primary-300 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Rack / Bay</h3>
                  <p className="text-sm text-muted-foreground">Physical shelving unit</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Rack 01, Rack 02</p>
                </div>
                
                <div className="ml-16 border-l-4 border-primary-200 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Shelf / Level</h3>
                  <p className="text-sm text-muted-foreground">Horizontal storage level</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Level 1, Level 2, Level 3</p>
                </div>
                
                <div className="ml-20 border-l-4 border-primary-100 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Bin / Position</h3>
                  <p className="text-sm text-muted-foreground">Smallest storage location</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Bin 01, Position A</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-8" variant="default">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Location Naming Best Practice</AlertTitle>
            <AlertDescription>
              Use a consistent naming convention like: ZONE-AISLE-RACK-LEVEL-BIN<br />
              Example: <strong>PICK-A-01-02-03</strong> (Pick Zone, Aisle A, Rack 01, Level 02, Bin 03)
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Step 1: Create Your Zones</h2>
          <p className="text-muted-foreground mb-6">
            Start by defining major areas in your warehouse:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">1.</span>
                  <div>
                    <p className="font-medium">Navigate to Settings, then Warehouse Locations</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">2.</span>
                  <div>
                    <p className="font-medium">Click "Add Zone"</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600 min-w-[24px]">3.</span>
                  <div>
                    <p className="font-medium">Enter zone details:</p>
                    <ul className="mt-2 ml-4 space-y-1 text-sm text-muted-foreground">
                      <li>• Zone Name (e.g., "Receiving Zone")</li>
                      <li>• Zone Code (e.g., "RCV")</li>
                      <li>• Zone Type (Receiving, Picking, Bulk, Shipping, etc.)</li>
                      <li>• Temperature Control (if applicable)</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">Common Zone Types</h3>
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Receiving Zone</h4>
                <p className="text-sm text-muted-foreground">Where incoming shipments are unloaded and inspected</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Pick Zone</h4>
                <p className="text-sm text-muted-foreground">High-velocity items for fast order fulfillment</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Bulk Storage</h4>
                <p className="text-sm text-muted-foreground">Pallet racking for reserve inventory</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Shipping Staging</h4>
                <p className="text-sm text-muted-foreground">Orders waiting for carrier pickup</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Returns Area</h4>
                <p className="text-sm text-muted-foreground">Returned items for inspection and restocking</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Quarantine Zone</h4>
                <p className="text-sm text-muted-foreground">Items on hold pending quality inspection</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Step 2: Add Aisles Within Zones</h2>
          <Card className="mb-8">
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Within each zone, create aisles to represent walkways:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Select the zone you created</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Click "Add Aisle"</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Use letters (A, B, C) or numbers (1, 2, 3) for aisle names</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Repeat for all aisles in the zone</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Step 3: Configure Racks and Bins</h2>
          <p className="text-muted-foreground mb-6">
            Now add the detailed storage locations:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">For Pick Zones (Shelf Storage)</h3>
              <div className="space-y-3 mb-6">
                <p className="text-sm">Define racks (vertical units), levels (shelves), and bins (positions):</p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono">PICK-A-01-02-03</p>
                  <p className="text-xs text-muted-foreground mt-1">Pick Zone, Aisle A, Rack 01, Level 02, Bin 03</p>
                </div>
              </div>

              <h3 className="font-semibold mb-4">For Bulk Storage (Pallet Racking)</h3>
              <div className="space-y-3">
                <p className="text-sm">Simpler structure for pallet positions:</p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono">BULK-A-01-02</p>
                  <p className="text-xs text-muted-foreground mt-1">Bulk Storage, Aisle A, Rack 01, Level 02 (pallet position)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Step 4: Bulk Import (Optional)</h2>
          <p className="text-muted-foreground mb-6">
            For warehouses with many locations, use bulk import:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Download the location import template (CSV file)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Fill in your locations following the naming convention</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Upload the file via Settings, Import Locations</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Review and confirm the import</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Step 5: Print Location Labels</h2>
          <p className="text-muted-foreground mb-6">
            Generate barcode labels for easy scanning:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6 space-y-3">
              <p>After creating locations:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Go to Warehouse Locations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Select locations to label</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Click "Print Labels"</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Print on standard label paper and attach to physical locations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Pro Tip: Start Small</AlertTitle>
            <AlertDescription>
              Begin with basic zones and add detail as needed. You can always add more locations later. It's better to start simple and expand than to create too many unused locations.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/import-inventory">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Import Your Inventory</h3>
                    <p className="text-sm text-muted-foreground">Upload your product catalog and assign to locations</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/getting-started/setup-mobile-devices">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Setup Mobile Devices</h3>
                    <p className="text-sm text-muted-foreground">Configure scanners and tablets for warehouse operations</p>
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
              <Link href="/help/getting-started/add-users-roles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Add Users
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/import-inventory">
                Next: Import Inventory
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
