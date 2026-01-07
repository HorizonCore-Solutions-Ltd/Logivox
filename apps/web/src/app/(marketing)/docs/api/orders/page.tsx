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
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Copy,
  Code,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Orders API | LogiVox Documentation",
  description:
    "Complete API reference for order management. Create orders, track fulfillment status, and manage order lifecycle.",
};

export default function OrdersAPIPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/v2/orders",
      description: "List all orders",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      method: "GET",
      path: "/v2/orders/:id",
      description: "Get specific order details",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      method: "POST",
      path: "/v2/orders",
      description: "Create new order",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      method: "PUT",
      path: "/v2/orders/:id",
      description: "Update order",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      method: "POST",
      path: "/v2/orders/:id/cancel",
      description: "Cancel order",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      method: "POST",
      path: "/v2/orders/:id/fulfill",
      description: "Mark order as fulfilled",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const orderStatuses = [
    { status: "pending", description: "Order created, awaiting processing" },
    {
      status: "confirmed",
      description: "Order confirmed and queued for fulfillment",
    },
    { status: "picking", description: "Items being picked from warehouse" },
    { status: "packing", description: "Items being packed for shipment" },
    { status: "ready_to_ship", description: "Order ready for carrier pickup" },
    { status: "shipped", description: "Order shipped to customer" },
    { status: "delivered", description: "Order delivered successfully" },
    { status: "cancelled", description: "Order cancelled" },
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
            <span>Orders</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h1 className="text-5xl font-bold">Orders API</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Manage the complete order lifecycle from creation to fulfillment.
            Create orders, track status, and automate your order processing.
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

      {/* Order Statuses */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Order Status Lifecycle</h2>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {orderStatuses.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <code className="font-semibold text-primary-600">
                        {item.status}
                      </code>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Create Order */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Create New Order</h2>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-600 font-mono">
                    POST
                  </Badge>
                  <code className="font-mono">/v2/orders</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Create a new order for fulfillment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Automatic Inventory Allocation</AlertTitle>
                <AlertDescription>
                  When you create an order, inventory is automatically reserved
                  for the order items, updating the quantity_reserved field.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "order_number": "ORD-2026-001",
  "warehouse_id": "wh_123",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  },
  "shipping_address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "items": [
    {
      "sku": "WIDGET-001",
      "quantity": 2,
      "price": 24.99
    },
    {
      "sku": "GADGET-002",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "shipping_method": "standard",
  "notes": "Handle with care - fragile items",
  "metadata": {
    "source": "shopify",
    "shopify_order_id": "12345"
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl -X POST https://api.logivox.com/v2/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d @order.json`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "id": "ord_xyz789",
  "order_number": "ORD-2026-001",
  "warehouse_id": "wh_123",
  "status": "pending",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  },
  "shipping_address": {
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "items": [
    {
      "id": "item_001",
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "quantity": 2,
      "price": 24.99,
      "subtotal": 49.98
    },
    {
      "id": "item_002",
      "sku": "GADGET-002",
      "name": "Deluxe Gadget",
      "quantity": 1,
      "price": 49.99,
      "subtotal": 49.99
    }
  ],
  "totals": {
    "subtotal": 99.97,
    "shipping": 8.99,
    "tax": 9.00,
    "total": 117.96
  },
  "created_at": "2026-01-07T12:00:00Z",
  "updated_at": "2026-01-07T12:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get Order */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Get Order Details</h2>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-600 font-mono">
                    GET
                  </Badge>
                  <code className="font-mono">/v2/orders/:id</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Retrieve complete order information including fulfillment status
                and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Path Parameters</h4>
                <div className="p-3 border rounded-lg">
                  <code className="font-mono text-primary-600">id</code>
                  <span className="text-muted-foreground ml-4">Order ID</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl https://api.logivox.com/v2/orders/ord_xyz789 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "id": "ord_xyz789",
  "order_number": "ORD-2026-001",
  "warehouse_id": "wh_123",
  "status": "shipped",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  },
  "items": [
    {
      "id": "item_001",
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "quantity": 2,
      "price": 24.99,
      "picked_quantity": 2,
      "packed_quantity": 2
    }
  ],
  "shipments": [
    {
      "id": "shp_abc123",
      "carrier": "FedEx",
      "service": "Ground",
      "tracking_number": "123456789012",
      "status": "in_transit",
      "shipped_at": "2026-01-07T14:00:00Z",
      "estimated_delivery": "2026-01-10T23:59:59Z"
    }
  ],
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2026-01-07T12:00:00Z"
    },
    {
      "status": "picking",
      "timestamp": "2026-01-07T13:00:00Z"
    },
    {
      "status": "packing",
      "timestamp": "2026-01-07T13:30:00Z"
    },
    {
      "status": "shipped",
      "timestamp": "2026-01-07T14:00:00Z"
    }
  ],
  "created_at": "2026-01-07T12:00:00Z",
  "updated_at": "2026-01-07T14:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fulfill Order */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Fulfill Order</h2>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-600 font-mono">
                    POST
                  </Badge>
                  <code className="font-mono">/v2/orders/:id/fulfill</code>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Mark order as fulfilled and create shipment record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "tracking_number": "123456789012",
  "carrier": "FedEx",
  "service": "Ground",
  "notify_customer": true,
  "items": [
    {
      "item_id": "item_001",
      "quantity": 2
    },
    {
      "item_id": "item_002",
      "quantity": 1
    }
  ]
}`}
                </pre>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Automated Customer Notifications</AlertTitle>
                <AlertDescription>
                  When notify_customer is true, LogiVox automatically sends a
                  shipping confirmation email with tracking information.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Example Request</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`curl -X POST https://api.logivox.com/v2/orders/ord_xyz789/fulfill \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tracking_number": "123456789012",
    "carrier": "FedEx",
    "service": "Ground",
    "notify_customer": true
  }'`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "id": "ord_xyz789",
  "status": "shipped",
  "shipment": {
    "id": "shp_abc123",
    "tracking_number": "123456789012",
    "carrier": "FedEx",
    "service": "Ground",
    "tracking_url": "https://fedex.com/track/123456789012",
    "shipped_at": "2026-01-07T14:00:00Z"
  },
  "notification_sent": true,
  "updated_at": "2026-01-07T14:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Related Endpoints */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Related Endpoints</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/docs/api/inventory" className="group">
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <Package className="h-5 w-5 text-primary-600" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Inventory API
                  </CardTitle>
                  <CardDescription>
                    Manage stock levels and products
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container-enterprise max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Integrate Orders?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Start automating your order fulfillment with our powerful API.
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
