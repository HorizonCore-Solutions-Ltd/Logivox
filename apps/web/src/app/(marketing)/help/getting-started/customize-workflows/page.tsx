import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, Settings, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Customize Workflows | LogiVox Help Center",
  description:
    "Adapt LogiVox to your specific warehouse processes with custom workflows, rules, and automation.",
};

export default function CustomizeWorkflowsPage() {
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
            <span>Customize Workflows</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Badge>Intermediate</Badge>
            <Badge variant="outline">15 minutes</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Customize Workflows</h1>
          <p className="text-xl text-muted-foreground">
            Adapt LogiVox to your specific warehouse processes with custom
            workflows, automation rules, and business logic.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-enterprise max-w-4xl">
          <Alert className="mb-8">
            <Settings className="h-4 w-4" />
            <AlertTitle>Flexible Configuration</AlertTitle>
            <AlertDescription>
              Every warehouse operates differently. LogiVox provides extensive
              customization options to match your unique processes without
              custom development.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">
            Workflow Customization Areas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Receiving Workflows
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure how incoming inventory is processed
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Quality inspection requirements</li>
                  <li>• Putaway strategies</li>
                  <li>• ASN validation rules</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Picking Workflows
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Define how orders are fulfilled
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Wave vs. discrete picking</li>
                  <li>• Pick path optimization</li>
                  <li>• Batch size rules</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Packing Workflows
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Control packing station operations
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Verification steps</li>
                  <li>• Carton selection logic</li>
                  <li>• Packing slip templates</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Shipping Workflows
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage outbound shipment processing
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Carrier selection rules</li>
                  <li>• Label printing automation</li>
                  <li>• Manifesting schedules</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Customizing Receiving Workflows
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                Configure Inspection Requirements
              </h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, Workflows, Receiving</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Enable "Quality Inspection" toggle</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Set inspection rules:</span>
                </li>
              </ol>

              <div className="ml-6 space-y-4 border-l-2 border-primary-200 pl-4 mb-6">
                <div>
                  <p className="font-medium text-sm">Inspect All Items</p>
                  <p className="text-xs text-muted-foreground">
                    Every received item requires inspection before putaway
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Inspect by Value</p>
                  <p className="text-xs text-muted-foreground">
                    Only high-value items (set threshold, e.g., over $100)
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Inspect by Category</p>
                  <p className="text-xs text-muted-foreground">
                    Specific product categories (e.g., electronics, perishables)
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Random Sampling</p>
                  <p className="text-xs text-muted-foreground">
                    Inspect X% of received items randomly
                  </p>
                </div>
              </div>

              <h3 className="font-semibold mb-4">
                Configure Putaway Strategies
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">System-Directed (Recommended)</p>
                    <p className="text-sm text-muted-foreground">
                      LogiVox suggests optimal locations based on rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Fixed Location</p>
                    <p className="text-sm text-muted-foreground">
                      Each SKU always goes to same location
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Velocity-Based</p>
                    <p className="text-sm text-muted-foreground">
                      Fast-movers near shipping, slow-movers in bulk
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      FEFO (First Expired, First Out)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      For perishables - prioritize by expiration date
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Customizing Picking Workflows
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Select Picking Method</h3>
              <p className="text-muted-foreground mb-4">
                Navigate to Settings, Workflows, Picking
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-4 border-l-4 border-primary-600">
                  <h4 className="font-semibold mb-2">
                    Discrete Picking (Pick-to-Order)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    One picker handles one complete order
                  </p>
                  <p className="text-xs">
                    <strong>Best for:</strong> Low volume, large orders, custom
                    fulfillment
                  </p>
                </div>

                <div className="p-4 border-l-4 border-primary-500">
                  <h4 className="font-semibold mb-2">Wave Picking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Multiple orders picked together at scheduled times
                  </p>
                  <p className="text-xs">
                    <strong>Best for:</strong> High volume, similar shipping
                    schedules
                  </p>
                </div>

                <div className="p-4 border-l-4 border-primary-400">
                  <h4 className="font-semibold mb-2">Batch Picking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pick one SKU for multiple orders in one pass
                  </p>
                  <p className="text-xs">
                    <strong>Best for:</strong> Many small orders with
                    overlapping items
                  </p>
                </div>

                <div className="p-4 border-l-4 border-primary-300">
                  <h4 className="font-semibold mb-2">Zone Picking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Each picker assigned to specific warehouse zone
                  </p>
                  <p className="text-xs">
                    <strong>Best for:</strong> Large warehouses, specialized
                    product knowledge
                  </p>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Hybrid Approach:</strong> You can combine methods. For
                  example, use wave picking for standard orders and discrete
                  picking for rush or custom orders.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold mb-4">
            Configure Pick Path Optimization
          </h3>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Optimize the route pickers take through the warehouse:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Shortest Path</p>
                    <p className="text-sm text-muted-foreground">
                      Minimize walking distance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Sequential by Aisle</p>
                    <p className="text-sm text-muted-foreground">
                      Pick all items in Aisle A, then B, then C
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Serpentine (Snake)</p>
                    <p className="text-sm text-muted-foreground">
                      Zigzag through aisles without backtracking
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Return Path</p>
                    <p className="text-sm text-muted-foreground">
                      Pick down one side, return on other side
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Automation Rules</h2>
          <p className="text-muted-foreground mb-6">
            Create automated actions based on conditions:
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Example Automation Rules</h3>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Auto-Create Purchase Orders
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When:</strong> Inventory falls below reorder point
                    <br />
                    <strong>Then:</strong> Create purchase order for supplier
                  </p>
                  <p className="text-xs">
                    Navigate to Settings, Automation, Inventory Rules
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Priority Order Flagging
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When:</strong> Order tagged as "Rush" or "Express"
                    <br />
                    <strong>Then:</strong> Move to front of pick queue, send
                    notification
                  </p>
                  <p className="text-xs">
                    Navigate to Settings, Automation, Order Rules
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Carrier Selection</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When:</strong> Order weight over 50 lbs
                    <br />
                    <strong>Then:</strong> Use freight carrier instead of parcel
                  </p>
                  <p className="text-xs">
                    Navigate to Settings, Automation, Shipping Rules
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Customer Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When:</strong> Order shipped
                    <br />
                    <strong>Then:</strong> Send email with tracking number
                  </p>
                  <p className="text-xs">
                    Navigate to Settings, Automation, Notification Rules
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Cycle Count Scheduling</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When:</strong> Location not counted in 90 days
                    <br />
                    <strong>Then:</strong> Add to cycle count queue
                  </p>
                  <p className="text-xs">
                    Navigate to Settings, Automation, Inventory Rules
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Custom Fields and Labels</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Add custom data fields specific to your business:
              </p>

              <h3 className="font-semibold mb-4">How to Add Custom Fields</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, Custom Fields</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>
                    Select entity type (Products, Orders, Customers, Locations)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Click "Add Custom Field"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>
                    Choose field type (Text, Number, Date, Dropdown, Checkbox)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Set field name and options</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">6.</span>
                  <span>Save and apply</span>
                </li>
              </ol>

              <h3 className="font-semibold mb-4">
                Common Custom Field Examples
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="text-sm">
                  <p className="font-medium">Products</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Manufacturer Part Number</li>
                    <li>• Country of Origin</li>
                    <li>• Hazmat Classification</li>
                    <li>• Seasonality Flag</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Orders</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Gift Message</li>
                    <li>• Special Handling Instructions</li>
                    <li>• Marketing Source</li>
                    <li>• Internal Project Code</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Customers</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Customer Tier (Gold, Silver, Bronze)</li>
                    <li>• Tax Exempt Status</li>
                    <li>• Preferred Carrier</li>
                    <li>• Sales Representative</li>
                  </ul>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Locations</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Temperature Zone</li>
                    <li>• Max Weight Capacity</li>
                    <li>• Security Level</li>
                    <li>• Last Maintenance Date</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            User Permissions and Roles
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Customize what each user role can see and do:
              </p>

              <h3 className="font-semibold mb-4">Configure Role Permissions</h3>
              <ol className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">1.</span>
                  <span>Navigate to Settings, Users & Roles</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">2.</span>
                  <span>Select a role (or create custom role)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">3.</span>
                  <span>Toggle permissions for each module</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">4.</span>
                  <span>
                    Set granular permissions (View, Create, Edit, Delete)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary-600">5.</span>
                  <span>Save role configuration</span>
                </li>
              </ol>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Principle of Least Privilege:</strong> Grant users
                  only the permissions they need for their job. This improves
                  security and reduces accidental errors.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Dashboard Customization</h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                Create Role-Specific Dashboards
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Warehouse Manager Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      Order volume, pick rates, inventory accuracy, labor
                      productivity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Picker Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned tasks, pick list, personal performance metrics
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Executive Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      High-level KPIs, financial metrics, capacity utilization
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Customer Service Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      Order status, tracking numbers, returns queue
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">
            Testing Your Customizations
          </h2>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Best Practices</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Test in staging environment first
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use test data before applying to production
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Run pilot with small team</p>
                    <p className="text-sm text-muted-foreground">
                      Validate workflows with a few users before full rollout
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Document your customizations</p>
                    <p className="text-sm text-muted-foreground">
                      Keep notes on why you made specific configuration choices
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Monitor performance metrics</p>
                    <p className="text-sm text-muted-foreground">
                      Track KPIs before and after to measure improvement
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Get user feedback</p>
                    <p className="text-sm text-muted-foreground">
                      Warehouse staff will identify issues you might miss
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Getting Help</h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Workflow Consultation</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Our implementation team can help design optimal workflows for
                  your operation.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/contact">Schedule Consultation</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Advanced Training</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  In-depth training on configuration and automation for power
                  users.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/training">View Training Options</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Congratulations!</AlertTitle>
            <AlertDescription>
              You've completed the Getting Started guide! You now have a solid
              foundation for using LogiVox. Explore additional help articles for
              advanced features and optimization strategies.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>
          <div className="grid gap-4 mb-8">
            <Link href="/help/inventory">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Inventory Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Deep dive into inventory controls, cycle counting, and
                      optimization
                    </p>
                  </div>
                  <Badge>Advanced</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/picking">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Order Fulfillment</h3>
                    <p className="text-sm text-muted-foreground">
                      Master picking strategies, wave management, and packing
                    </p>
                  </div>
                  <Badge>Advanced</Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/help/reporting">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Reporting & Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Build custom reports and leverage business intelligence
                    </p>
                  </div>
                  <Badge>Advanced</Badge>
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
              <Link href="/help/getting-started/setup-shipping-carriers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: Setup Shipping Carriers
              </Link>
            </Button>
            <Button asChild>
              <Link href="/help">Back to Help Center</Link>
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
