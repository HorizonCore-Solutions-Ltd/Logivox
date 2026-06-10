import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart2, Download, Clock, Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Reporting Guide | LogiVox Help",
  description: "Learn how to create, schedule, and export reports in LogiVox.",
};

const REPORT_TYPES = [
  {
    name: "Inventory Summary",
    desc: "Current stock levels, valuations, and movement summary across all warehouses.",
  },
  {
    name: "Sales Performance",
    desc: "Order volume, revenue, fulfilment rates, and top products over a time period.",
  },
  {
    name: "Shipping Analysis",
    desc: "Carrier performance, on-time delivery rates, shipping costs, and exception rates.",
  },
  {
    name: "Pick Performance",
    desc: "Picker productivity, accuracy rates, and time-per-pick metrics.",
  },
  {
    name: "CAPA Summary",
    desc: "Open CAPAs by status, category, and owner with overdue tracking.",
  },
  {
    name: "Financial Overview",
    desc: "Invoice status, outstanding receivables, and billing summary.",
  },
  {
    name: "Custom Report",
    desc: "Build a report with any combination of fields and filters.",
  },
];

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    icon: <BarChart2 className="h-5 w-5" />,
    content:
      "The Reports module lets you generate, schedule, and export data from across your LogiVox account. Reports can be downloaded as CSV, PDF, or XLSX, or sent automatically to your inbox on a schedule.",
  },
  {
    id: "generating",
    title: "Generating a Report",
    icon: <Download className="h-5 w-5" />,
    steps: [
      "Navigate to Dashboard → Reports",
      "Click Generate Report",
      "Select the report type",
      "Set the date range and any filters (warehouse, category, etc.)",
      "Choose your output format (CSV, PDF, XLSX)",
      "Click Generate — the report will appear in your downloads list when ready",
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling Reports",
    icon: <Clock className="h-5 w-5" />,
    content:
      "Save a report configuration and set a schedule to receive it automatically by email.",
    steps: [
      "Configure a report as above",
      "Click Save as Template instead of Generate",
      "Set a cron schedule (e.g., Every Monday at 8am)",
      "Add email recipients",
      "Click Save Template",
    ],
  },
  {
    id: "filters",
    title: "Filters & Customisation",
    icon: <Filter className="h-5 w-5" />,
    content:
      "Most reports support advanced filtering. You can filter by warehouse, date range, product category, customer, carrier, status, and more. Saved templates remember your filter settings.",
  },
];

export default function HelpReportingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/help">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Help
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Reporting</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
                On this page
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground py-1"
                >
                  {s.title}
                </a>
              ))}
              <div className="border-t pt-4 mt-4 space-y-2">
                <Link
                  href="/dashboard/reports"
                  className="block text-sm text-primary hover:underline"
                >
                  → Open Reports
                </Link>
                <Link
                  href="/help"
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Help center
                </Link>
              </div>
            </div>
          </aside>
          <article className="lg:col-span-3 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Help Article</Badge>
                <Badge variant="outline">Reporting</Badge>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart2 className="h-8 w-8" />
                Reporting
              </h1>
              <p className="text-xl text-muted-foreground">
                Generate, schedule, and export comprehensive warehouse reports.
              </p>
            </div>

            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="space-y-4 scroll-mt-24"
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                )}
                {section.steps && (
                  <ol className="list-decimal list-inside space-y-2">
                    {section.steps.map((step, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground leading-relaxed"
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}

            <section id="types" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-semibold">Available Report Types</h2>
              <div className="grid gap-3">
                {REPORT_TYPES.map((rt) => (
                  <div key={rt.name} className="border rounded-lg p-4">
                    <p className="font-medium text-sm">{rt.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border rounded-xl p-6 bg-muted/30 space-y-3">
              <h2 className="text-lg font-semibold">Still need help?</h2>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/help">Help Center</Link>
                </Button>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
