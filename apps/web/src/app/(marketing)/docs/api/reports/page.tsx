import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports API Reference | Flowstock Docs",
  description:
    "API reference for the Flowstock Reports API — generate, schedule, and export reports.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/reports",
    status: "200",
    badge: "stable",
    summary: "List Reports",
    description: "Returns a paginated list of saved reports and templates.",
    params: [
      {
        name: "page",
        type: "integer",
        required: false,
        desc: "Page number (default: 1)",
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        desc: "Results per page (default: 20, max: 100)",
      },
      {
        name: "type",
        type: "string",
        required: false,
        desc: "Filter by report type (INVENTORY, SALES, SHIPPING, FINANCIAL)",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/reports/generate",
    status: "202",
    badge: "stable",
    summary: "Generate Report",
    description:
      "Queues a report for generation. Returns a job ID to poll for completion.",
    body: [
      {
        name: "type",
        type: "string",
        required: true,
        desc: "Report type: INVENTORY | SALES | SHIPPING | FINANCIAL | CUSTOM",
      },
      {
        name: "dateFrom",
        type: "ISO 8601",
        required: false,
        desc: "Start date for the report period",
      },
      {
        name: "dateTo",
        type: "ISO 8601",
        required: false,
        desc: "End date for the report period",
      },
      {
        name: "format",
        type: "string",
        required: false,
        desc: "Output format: CSV (default) | PDF | XLSX | JSON",
      },
      {
        name: "warehouseId",
        type: "string",
        required: false,
        desc: "Filter by warehouse UUID",
      },
      {
        name: "filters",
        type: "object",
        required: false,
        desc: "Additional key-value filters",
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/reports/jobs/:jobId",
    status: "200",
    badge: "stable",
    summary: "Get Report Job Status",
    description:
      "Poll the status of a report generation job. When status is COMPLETE, a download URL is provided.",
    params: [
      {
        name: "jobId",
        type: "string",
        required: true,
        desc: "Job ID returned from POST /reports/generate",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/reports",
    status: "201",
    badge: "stable",
    summary: "Save Report Template",
    description: "Saves a report configuration as a reusable template.",
    body: [
      { name: "name", type: "string", required: true, desc: "Template name" },
      { name: "type", type: "string", required: true, desc: "Report type" },
      {
        name: "schedule",
        type: "string",
        required: false,
        desc: "Cron expression for scheduled generation",
      },
      {
        name: "recipients",
        type: "string[]",
        required: false,
        desc: "Email addresses to send report to",
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  POST: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  PATCH:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function ReportsApiPage() {
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
          <span className="font-medium">Reports API</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Reports API</h1>
              <p className="text-muted-foreground">
                Generate, schedule, and export warehouse reports
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge>v1.0</Badge>
            <Badge variant="outline">REST</Badge>
            <Badge variant="secondary">JSON</Badge>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            Authorization: Bearer {"<your-api-key>"}
          </div>
          <p className="text-sm text-muted-foreground">
            All API requests require a valid API key in the Authorization
            header. Generate your API key in{" "}
            <Link
              href="/dashboard/settings"
              className="text-primary hover:underline"
            >
              Settings → API Keys
            </Link>
            .
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Endpoints</h2>
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 bg-muted/50 px-5 py-4">
                <span
                  className={`font-mono text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-sm font-medium">{ep.path}</code>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {ep.badge}
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold">{ep.summary}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ep.description}
                  </p>
                </div>
                {ep.params && ep.params.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Query Parameters
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
                {ep.body && ep.body.length > 0 && (
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
          <p className="text-sm text-muted-foreground">
            Contact our developer support team or browse community discussions.
          </p>
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
