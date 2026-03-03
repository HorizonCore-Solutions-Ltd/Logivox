import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Warehouse, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Warehouses API Reference | Flowstock Docs",
  description:
    "API reference for the Flowstock Warehouses API — manage warehouse locations, zones, and bins.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/warehouses",
    summary: "List Warehouses",
    description: "Returns all warehouses for the authenticated organization.",
    params: [
      { name: "page", type: "integer", required: false, desc: "Page number" },
      {
        name: "limit",
        type: "integer",
        required: false,
        desc: "Results per page (max: 100)",
      },
      {
        name: "active",
        type: "boolean",
        required: false,
        desc: "Filter by active status",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/warehouses",
    summary: "Create Warehouse",
    description: "Creates a new warehouse location.",
    body: [
      { name: "name", type: "string", required: true, desc: "Warehouse name" },
      {
        name: "code",
        type: "string",
        required: true,
        desc: "Unique warehouse code (e.g., NYC-01)",
      },
      {
        name: "address",
        type: "string",
        required: false,
        desc: "Street address",
      },
      { name: "city", type: "string", required: false, desc: "City" },
      {
        name: "state",
        type: "string",
        required: false,
        desc: "State/Province",
      },
      {
        name: "country",
        type: "string",
        required: false,
        desc: "ISO 3166-1 alpha-2 country code",
      },
      {
        name: "timezone",
        type: "string",
        required: false,
        desc: "IANA timezone (e.g., America/New_York)",
      },
      {
        name: "capacity",
        type: "integer",
        required: false,
        desc: "Total storage capacity in units",
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/warehouses/:id",
    summary: "Get Warehouse",
    description: "Retrieve a single warehouse with zones and statistics.",
    params: [
      { name: "id", type: "string", required: true, desc: "Warehouse UUID" },
    ],
  },
  {
    method: "PATCH",
    path: "/api/v1/warehouses/:id",
    summary: "Update Warehouse",
    description: "Update warehouse details.",
    params: [
      { name: "id", type: "string", required: true, desc: "Warehouse UUID" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/warehouses/:id/zones",
    summary: "List Zones",
    description: "Returns all zones within a warehouse.",
    params: [
      { name: "id", type: "string", required: true, desc: "Warehouse UUID" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/warehouses/:id/inventory",
    summary: "Get Inventory",
    description:
      "Returns current inventory levels for all items in a warehouse.",
    params: [
      { name: "id", type: "string", required: true, desc: "Warehouse UUID" },
      { name: "sku", type: "string", required: false, desc: "Filter by SKU" },
      {
        name: "belowReorderPoint",
        type: "boolean",
        required: false,
        desc: "Show only items below reorder point",
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  POST: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  PATCH:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function WarehousesApiPage() {
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
          <span className="font-medium">Warehouses API</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Warehouses API</h1>
              <p className="text-muted-foreground">
                Manage warehouse locations, zones, bins, and inventory
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
