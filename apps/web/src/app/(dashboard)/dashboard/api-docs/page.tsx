"use client";

import * as React from "react";
import {
  Code,
  Copy,
  CheckCircle2,
  Book,
  Globe,
  Key as KeyIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function ApiDocsPage() {
  const [copiedEndpoint, setCopiedEndpoint] = React.useState<string | null>(
    null,
  );

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-domain.com";

  return (
    <DashboardSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Book className="h-8 w-8" />
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Learn how to integrate with LogiVox's REST API
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              All API requests require authentication using an API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Include your API key in the{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                Authorization
              </code>{" "}
              header:
            </p>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm relative">
              <code>Authorization: Bearer fsk_your_api_key_here</code>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-50"
                onClick={() =>
                  copyToClipboard(
                    "Authorization: Bearer fsk_your_api_key_here",
                    "auth",
                  )
                }
              >
                {copiedEndpoint === "auth" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You can create and manage API keys in the{" "}
              <a
                href="/dashboard/api-keys"
                className="text-primary hover:underline"
              >
                API Keys
              </a>{" "}
              section.
            </p>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Tabs defaultValue="inventory">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Inventory Endpoints */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>List Inventory Items</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500"
                  >
                    GET
                  </Badge>
                </div>
                <CardDescription>
                  Retrieve all inventory items for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Endpoint</p>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{baseUrl}/api/public/inventory</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-50"
                      onClick={() =>
                        copyToClipboard(
                          `${baseUrl}/api/public/inventory`,
                          "inv-list",
                        )
                      }
                    >
                      {copiedEndpoint === "inv-list" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Example Response</p>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`[
  {
    "id": "cm123...",
    "name": "Product A",
    "sku": "SKU-001",
    "availableQuantity": 150,
    "reservedQuantity": 20,
    "unit": "pcs",
    "sellingPrice": "99.99",
    "costPrice": "50.00",
    "warehouseId": "wh123...",
    "categoryId": "cat123...",
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
]`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Get Single Inventory Item</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500"
                  >
                    GET
                  </Badge>
                </div>
                <CardDescription>
                  Retrieve a specific inventory item with stock movements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Endpoint</p>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{baseUrl}/api/public/inventory/:id</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-50"
                      onClick={() =>
                        copyToClipboard(
                          `${baseUrl}/api/public/inventory/:id`,
                          "inv-get",
                        )
                      }
                    >
                      {copiedEndpoint === "inv-get" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Endpoints */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>List Bookings</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500"
                  >
                    GET
                  </Badge>
                </div>
                <CardDescription>
                  Retrieve all bookings with customer and item details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Endpoint</p>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{baseUrl}/api/public/bookings</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-50"
                      onClick={() =>
                        copyToClipboard(
                          `${baseUrl}/api/public/bookings`,
                          "book-list",
                        )
                      }
                    >
                      {copiedEndpoint === "book-list" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Query Parameters</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">status</code>
                      <span className="text-muted-foreground">
                        Filter by status (PENDING, CONFIRMED, FULFILLED,
                        CANCELLED)
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Example Response</p>
                  <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`[
  {
    "id": "bk123...",
    "bookingDate": "2025-10-20T00:00:00.000Z",
    "deliveryDate": "2025-10-25T00:00:00.000Z",
    "status": "CONFIRMED",
    "totalAmount": "2499.99",
    "notes": "Urgent delivery",
    "customer": {
      "id": "cust123...",
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "phone": "+1234567890",
      "type": "CUSTOMER"
    },
    "items": [
      {
        "id": "bi123...",
        "quantity": 25,
        "unitPrice": "99.99",
        "totalPrice": "2499.75",
        "inventoryItem": {
          "id": "inv123...",
          "name": "Product A",
          "sku": "SKU-001",
          "unit": "pcs"
        }
      }
    ],
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
]`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Endpoints */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>List Customers</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500"
                  >
                    GET
                  </Badge>
                </div>
                <CardDescription>
                  Retrieve all customers and suppliers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Endpoint</p>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{baseUrl}/api/public/customers</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-50"
                      onClick={() =>
                        copyToClipboard(
                          `${baseUrl}/api/public/customers`,
                          "cust-list",
                        )
                      }
                    >
                      {copiedEndpoint === "cust-list" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Query Parameters</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <code className="bg-muted px-2 py-1 rounded">type</code>
                      <span className="text-muted-foreground">
                        Filter by type (CUSTOMER, SUPPLIER, BOTH)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
            <CardDescription>
              API requests are rate-limited to ensure fair usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">1000</Badge>
                <span>requests per hour per API key</span>
              </div>
              <p className="text-muted-foreground">
                Rate limit headers are included in all responses:
              </p>
              <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
                <div>X-RateLimit-Limit: 1000</div>
                <div>X-RateLimit-Remaining: 999</div>
                <div>X-RateLimit-Reset: 1728993600</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Subscribe to real-time events via webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Configure webhooks in the{" "}
              <a
                href="/dashboard/webhooks"
                className="text-primary hover:underline"
              >
                Webhooks
              </a>{" "}
              section to receive real-time notifications when events occur.
            </p>
            <p className="text-sm font-medium mb-2">Available Events:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "inventory.created",
                "inventory.updated",
                "inventory.deleted",
                "inventory.low_stock",
                "booking.created",
                "booking.updated",
                "booking.fulfilled",
                "booking.cancelled",
                "customer.created",
                "customer.updated",
              ].map((event) => (
                <Badge key={event} variant="outline" className="justify-start">
                  {event}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  );
}
