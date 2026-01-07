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
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Copy,
  CheckCircle2,
  ArrowRight,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory API | LogiVox Documentation",
  description:
    "Complete API reference for inventory management endpoints. Query stock levels, update quantities, and manage products.",
};

export default function InventoryAPIPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/v2/inventory",
      description: "List all inventory items",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      method: "GET",
      path: "/v2/inventory/:id",
      description: "Get specific inventory item",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      method: "POST",
      path: "/v2/inventory",
      description: "Create new inventory item",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      method: "PUT",
      path: "/v2/inventory/:id",
      description: "Update inventory item",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      method: "POST",
      path: "/v2/inventory/:id/adjust",
      description: "Adjust inventory quantity",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      method: "GET",
      path: "/v2/inventory/:id/transactions",
      description: "Get inventory transaction history",
      color: "text-green-600",
      bgColor: "bg-green-100",
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
            <Link href="/docs/api" className="hover:text-white">
              API Reference
            </Link>
            <span>/</span>
            <span>Inventory</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
              <Package className="h-6 w-6" />
            </div>
            <h1 className="text-5xl font-bold">Inventory API</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Manage your warehouse inventory programmatically. Query stock
            levels, update quantities, and track product movements.
          </p>
        </div>
      </section>

      {/* Endpoints Overview */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Available Endpoints</h2>

          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Badge
                      className={`${endpoint.bgColor} ${endpoint.color} font-mono`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="flex-1 font-mono text-sm">
                      {endpoint.path}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* List Inventory */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">List Inventory Items</h2>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-600 font-mono">
                    GET
                  </Badge>
                  <code className="font-mono">/v2/inventory</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Retrieve a paginated list of all inventory items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4 p-3 border rounded-lg">
                    <code className="font-mono text-primary-600">
                      warehouse_id
                    </code>
                    <span className="text-muted-foreground">
                      Filter by warehouse
                    </span>
                  </div>
                  <div className="flex gap-4 p-3 border rounded-lg">
                    <code className="font-mono text-primary-600">sku</code>
                    <span className="text-muted-foreground">Search by SKU</span>
                  </div>
                  <div className="flex gap-4 p-3 border rounded-lg">
                    <code className="font-mono text-primary-600">status</code>
                    <span className="text-muted-foreground">
                      Filter by status (active, low_stock, out_of_stock)
                    </span>
                  </div>
                  <div className="flex gap-4 p-3 border rounded-lg">
                    <code className="font-mono text-primary-600">limit</code>
                    <span className="text-muted-foreground">
                      Results per page (default: 50, max: 100)
                    </span>
                  </div>
                  <div className="flex gap-4 p-3 border rounded-lg">
                    <code className="font-mono text-primary-600">page</code>
                    <span className="text-muted-foreground">
                      Page number (default: 1)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl https://api.logivox.com/v2/inventory?warehouse_id=wh_123&limit=10 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "data": [
    {
      "id": "inv_abc123",
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "warehouse_id": "wh_123",
      "quantity_available": 150,
      "quantity_reserved": 25,
      "quantity_total": 175,
      "reorder_point": 50,
      "status": "active",
      "location": "A-01-05",
      "updated_at": "2026-01-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 247,
    "pages": 25
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get Single Item */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Get Inventory Item</h2>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-600 font-mono">
                    GET
                  </Badge>
                  <code className="font-mono">/v2/inventory/:id</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Retrieve detailed information about a specific inventory item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Path Parameters</h4>
                <div className="p-3 border rounded-lg">
                  <code className="font-mono text-primary-600">id</code>
                  <span className="text-muted-foreground ml-4">
                    Inventory item ID
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl https://api.logivox.com/v2/inventory/inv_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "id": "inv_abc123",
  "sku": "WIDGET-001",
  "name": "Premium Widget",
  "description": "High-quality widget for industrial use",
  "warehouse_id": "wh_123",
  "quantity_available": 150,
  "quantity_reserved": 25,
  "quantity_total": 175,
  "reorder_point": 50,
  "status": "active",
  "location": "A-01-05",
  "barcode": "123456789012",
  "dimensions": {
    "length": 10.5,
    "width": 8.0,
    "height": 6.0,
    "unit": "inches"
  },
  "weight": {
    "value": 2.5,
    "unit": "lbs"
  },
  "cost": 12.50,
  "price": 24.99,
  "created_at": "2025-12-01T08:00:00Z",
  "updated_at": "2026-01-07T10:30:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Adjust Inventory */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Adjust Inventory Quantity</h2>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-600 font-mono">
                    POST
                  </Badge>
                  <code className="font-mono">/v2/inventory/:id/adjust</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Increase or decrease inventory quantities with reason tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Audit Trail</AlertTitle>
                <AlertDescription>
                  All adjustments are logged with timestamps, user information,
                  and reasons for full traceability.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "adjustment": -10,
  "reason": "damaged",
  "notes": "Water damage from warehouse leak",
  "reference_number": "ADJ-2026-001"
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Adjustment Reasons</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">received</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">sold</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">damaged</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">expired</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">lost</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">cycle_count</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">return</code>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <code className="text-primary-600">other</code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl -X POST https://api.logivox.com/v2/inventory/inv_abc123/adjust \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "adjustment": -10,
    "reason": "damaged",
    "notes": "Water damage from warehouse leak"
  }'`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "id": "inv_abc123",
  "sku": "WIDGET-001",
  "previous_quantity": 175,
  "new_quantity": 165,
  "adjustment": -10,
  "transaction_id": "txn_789xyz",
  "updated_at": "2026-01-07T11:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Related Endpoints */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Related Endpoints</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/docs/api/orders" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <ShoppingCart className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Orders API
                  </CardTitle>
                  <CardDescription>
                    Manage orders and fulfillment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary">
                    <span className="text-sm font-medium">
                      View documentation
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/docs/api/shipments" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <Truck className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Shipments API
                  </CardTitle>
                  <CardDescription>Track and manage shipments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary">
                    <span className="text-sm font-medium">
                      View documentation
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/docs/api/warehouses" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <Package className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Warehouses API
                  </CardTitle>
                  <CardDescription>
                    Configure warehouse locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary">
                    <span className="text-sm font-medium">
                      View documentation
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/docs/api/reports" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Reports API
                  </CardTitle>
                  <CardDescription>
                    Generate analytics and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary">
                    <span className="text-sm font-medium">
                      View documentation
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container-enterprise max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need Help Getting Started?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Check out our comprehensive API getting started guide or contact our
            developer support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/docs/api/getting-started">
                <Code className="mr-2 h-5 w-5" />
                Getting Started Guide
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-transparent hover:bg-white/10 text-white border-white"
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
