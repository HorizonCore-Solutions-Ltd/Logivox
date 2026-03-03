import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipments API Reference | Flowstock Docs",
  description:
    "API reference for the Flowstock Shipments API — create, track, and manage shipments.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/shipments",
    summary: "List Shipments",
    description: "Returns a paginated list of shipments with optional filters.",
    params: [
      {
        name: "status",
        type: "string",
        required: false,
        desc: "PENDING | IN_TRANSIT | DELIVERED | EXCEPTION | RETURNED",
      },
      {
        name: "carrier",
        type: "string",
        required: false,
        desc: "Filter by carrier (fedex, ups, dhl, usps)",
      },
      {
        name: "dateFrom",
        type: "ISO 8601",
        required: false,
        desc: "Filter by creation date",
      },
      {
        name: "warehouseId",
        type: "string",
        required: false,
        desc: "Filter by origin warehouse",
      },
      { name: "page", type: "integer", required: false, desc: "Page number" },
      {
        name: "limit",
        type: "integer",
        required: false,
        desc: "Results per page (max: 100)",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/shipments",
    summary: "Create Shipment",
    description: "Create a new shipment and optionally purchase a label.",
    body: [
      {
        name: "orderId",
        type: "string",
        required: false,
        desc: "Associated sales order UUID",
      },
      {
        name: "carrier",
        type: "string",
        required: true,
        desc: "Carrier code: fedex | ups | dhl | usps | custom",
      },
      {
        name: "serviceCode",
        type: "string",
        required: true,
        desc: "Carrier service code (e.g., GROUND, EXPRESS_2DAY)",
      },
      {
        name: "toAddress",
        type: "object",
        required: true,
        desc: "Recipient address {name, address1, city, state, zip, country}",
      },
      {
        name: "packages",
        type: "array",
        required: true,
        desc: "Array of packages [{weight, length, width, height}]",
      },
      {
        name: "purchaseLabel",
        type: "boolean",
        required: false,
        desc: "Whether to purchase label immediately (default: false)",
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/shipments/:id",
    summary: "Get Shipment",
    description: "Retrieve a single shipment by ID, including tracking events.",
    params: [
      { name: "id", type: "string", required: true, desc: "Shipment UUID" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/shipments/:id/label",
    summary: "Download Shipping Label",
    description: "Returns the shipping label as a PDF or PNG.",
    params: [
      { name: "id", type: "string", required: true, desc: "Shipment UUID" },
      {
        name: "format",
        type: "string",
        required: false,
        desc: "pdf (default) | png | zpl",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/shipments/:id/track",
    summary: "Refresh Tracking",
    description: "Force a tracking refresh from the carrier.",
    params: [
      { name: "id", type: "string", required: true, desc: "Shipment UUID" },
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/shipments/:id/void",
    summary: "Void Label",
    description:
      "Void a purchased shipping label. Only possible within the carrier's void window (typically 24h).",
    params: [
      { name: "id", type: "string", required: true, desc: "Shipment UUID" },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  POST: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  PATCH:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function ShipmentsApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Docs
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Shipments API</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Shipments API</h1>
              <p className="text-muted-foreground">
                Create, track, and manage shipments programmatically
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge>v1.0</Badge>
            <Badge variant="outline">REST</Badge>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            Authorization: Bearer {"<your-api-key>"}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Endpoints</h2>
          {ENDPOINTS.map((ep) => (
            <div
              key={`${ep.method}-${ep.path}`}
              className="border rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 bg-muted/50 px-5 py-4">
                <span
                  className={`font-mono text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-sm font-medium">{ep.path}</code>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold">{ep.summary}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ep.description}
                  </p>
                </div>
                {ep.params && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Parameters
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b text-xs text-muted-foreground">
                          <th className="pb-2 pr-4">Name</th>
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 pr-4">Required</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map((p) => (
                          <tr key={p.name} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs">
                              {p.name}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {p.type}
                            </td>
                            <td className="py-2 pr-4">
                              {p.required ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  required
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  optional
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {p.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {ep.body && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Request Body
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b text-xs text-muted-foreground">
                          <th className="pb-2 pr-4">Field</th>
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 pr-4">Required</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.body.map((p) => (
                          <tr key={p.name} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs">
                              {p.name}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {p.type}
                            </td>
                            <td className="py-2 pr-4">
                              {p.required ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  required
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  optional
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {p.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="border rounded-xl p-6 bg-muted/30 space-y-3">
          <h2 className="text-lg font-semibold">Need help?</h2>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/docs">Back to Docs</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
