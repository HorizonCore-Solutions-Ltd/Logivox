import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle2, BarChart3, Lightbulb } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard Overview | LogiVox Help Center",
  description: "Navigate the main dashboard and understand key performance metrics, widgets, and actionable insights.",
}

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-8">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <span>/</span>
            <Link href="/help/getting-started" className="hover:text-primary">Getting Started</Link>
            <span>/</span>
            <span>Dashboard Overview</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Beginner</Badge>
            <Badge variant="outline">6 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Dashboard Overview</h1>
          <p className="text-xl text-muted-foreground">
            Navigate the main dashboard, understand key metrics, and customize your view.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>Your Command Center</AlertTitle>
            <AlertDescription>
              The dashboard provides real-time visibility into warehouse operations, inventory levels, order status, and performance metrics. It's your starting point each day.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Dashboard Layout</h2>
          <p className="text-muted-foreground mb-6">
            The dashboard is organized into sections with customizable widgets:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="border-l-4 border-primary-600 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Top Navigation Bar</h3>
                  <p className="text-sm text-muted-foreground">
                    Access main modules (Receiving, Picking, Shipping, Inventory, etc.) and notifications
                  </p>
                </div>
                
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Key Metrics Row</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick view cards showing critical numbers (orders, inventory value, alerts)
                  </p>
                </div>
                
                <div className="border-l-4 border-primary-400 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Performance Charts</h3>
                  <p className="text-sm text-muted-foreground">
                    Visual graphs of trends (order volume, pick rates, accuracy)
                  </p>
                </div>
                
                <div className="border-l-4 border-primary-300 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Activity Feed</h3>
                  <p className="text-sm text-muted-foreground">
                    Recent transactions and system events
                  </p>
                </div>
                
                <div className="border-l-4 border-primary-200 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Action Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Tasks requiring attention (low stock alerts, pending orders, quality holds)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Key Metric Cards</h2>
          <p className="text-muted-foreground mb-6">
            The top row displays real-time operational metrics:
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Orders Today</h4>
                <p className="text-2xl font-bold text-primary-600 mb-2">247</p>
                <p className="text-sm text-muted-foreground">
                  Total orders received, in progress, and shipped
                </p>
                <p className="text-xs text-green-600 mt-1">↑ 12% vs yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Inventory Value</h4>
                <p className="text-2xl font-bold text-primary-600 mb-2">$1.2M</p>
                <p className="text-sm text-muted-foreground">
                  Total value of current on-hand inventory
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across 15,432 units</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Pending Shipments</h4>
                <p className="text-2xl font-bold text-primary-600 mb-2">89</p>
                <p className="text-sm text-muted-foreground">
                  Orders picked and ready to ship
                </p>
                <p className="text-xs text-orange-600 mt-1">32 require carrier pickup</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Low Stock Items</h4>
                <p className="text-2xl font-bold text-orange-600 mb-2">23</p>
                <p className="text-sm text-muted-foreground">
                  Items below reorder point
                </p>
                <p className="text-xs text-muted-foreground mt-1">5 critically low</p>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Color-Coded Status</AlertTitle>
            <AlertDescription>
              Metrics use color coding: Green (good), Orange (needs attention), Red (urgent action required). Click any metric card to view detailed breakdown.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Performance Charts</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Available Chart Types</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Order Volume Trends</p>
                    <p className="text-sm text-muted-foreground">Line chart showing daily/weekly order counts</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Inventory Turnover</p>
                    <p className="text-sm text-muted-foreground">How quickly inventory moves through warehouse</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pick Accuracy Rate</p>
                    <p className="text-sm text-muted-foreground">Percentage of orders picked correctly first time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Warehouse Utilization</p>
                    <p className="text-sm text-muted-foreground">Percentage of available space used</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">On-Time Shipment Rate</p>
                    <p className="text-sm text-muted-foreground">Orders shipped by promised date</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Action Items Panel</h2>
          <p className="text-muted-foreground mb-6">
            The action items panel highlights tasks that need your attention:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Low Stock Alerts (23)</h4>
                    <Badge variant="outline" className="bg-orange-100">Urgent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Items below reorder point. Consider creating purchase orders.
                  </p>
                  <Button size="sm" variant="outline">View Items</Button>
                </div>

                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Pending Receiving (5)</h4>
                    <Badge variant="outline" className="bg-blue-100">Action Needed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Expected shipments to process and putaway.
                  </p>
                  <Button size="sm" variant="outline">Go to Receiving</Button>
                </div>

                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Quality Holds (3)</h4>
                    <Badge variant="outline" className="bg-red-100">Review Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Items flagged during quality inspection awaiting decision.
                  </p>
                  <Button size="sm" variant="outline">Review Items</Button>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Cycle Counts Due (12)</h4>
                    <Badge variant="outline" className="bg-green-100">Scheduled</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Locations scheduled for today's cycle count.
                  </p>
                  <Button size="sm" variant="outline">Start Counting</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Customizing Your Dashboard</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Personalize Your View</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Click the gear icon in the top right of the dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Select "Customize Dashboard"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Drag widgets to reorder them</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>Click "Add Widget" to include additional metrics or charts</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Remove unwanted widgets by clicking the X icon</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Save your layout</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Dashboard Tips</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Set as Home Page</h4>
                <p className="text-sm text-muted-foreground">
                  Configure dashboard to load automatically when you login. Go to Settings, Preferences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Refresh Frequency</h4>
                <p className="text-sm text-muted-foreground">
                  Dashboard auto-refreshes every 60 seconds. Click refresh icon for immediate update.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Mobile Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Mobile app has simplified dashboard optimized for smaller screens and quick actions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Export Reports</h4>
                <p className="text-sm text-muted-foreground">
                  Click any chart or metric to export detailed data as PDF or Excel.
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Role-Based Dashboards</AlertTitle>
            <AlertDescription>
              Different user roles see different metrics. Warehouse managers see operational metrics, while executives see financial and strategic KPIs. Customize based on your role.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Common Dashboard Actions</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Drill Down</p>
                    <p className="text-sm text-muted-foreground">Click any metric or chart to see detailed breakdown</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Change Date Range</p>
                    <p className="text-sm text-muted-foreground">Use date picker to view different time periods</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Compare Periods</p>
                    <p className="text-sm text-muted-foreground">Enable comparison view to see week-over-week or month-over-month trends</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Quick Actions</p>
                    <p className="text-sm text-muted-foreground">Use quick action buttons to jump to common tasks (Create Order, Receive Shipment, etc.)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/getting-started/configure-scanners">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Configure Barcode Scanners</h3>
                    <p className="text-sm text-muted-foreground">Hardware setup and testing procedures</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/reporting/custom-reports">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground">Create detailed reports for deeper analysis</p>
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
              <Link href="/help/getting-started/create-first-receiving">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Create Receiving Order
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help/getting-started/configure-scanners">
                Next: Configure Scanners
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
