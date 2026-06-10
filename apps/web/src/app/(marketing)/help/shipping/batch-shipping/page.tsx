import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  Upload,
  Download,
  Zap,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Batch Shipping Guide | LogiVox Help",
  description:
    "Learn how to process multiple shipments at once using LogiVox's batch shipping feature.",
};

const SECTIONS = [
  {
    id: "overview",
    title: "What is Batch Shipping?",
    icon: <Truck className="h-5 w-5" />,
    content:
      "Batch shipping lets you process dozens or hundreds of shipments simultaneously. Instead of creating labels one at a time, you select a group of orders, choose carrier service settings, and LogiVox purchases all labels in a single operation — saving hours of processing time.",
  },
  {
    id: "how-to",
    title: "Processing a Batch",
    icon: <Zap className="h-5 w-5" />,
    steps: [
      "Navigate to Dashboard → Shipping → Batch Shipping",
      "Select orders to ship using the checkboxes, or use filters to auto-select (e.g., all STANDARD orders due today)",
      "Click Process Batch",
      "Choose a default carrier and service — or let LogiVox use the rate shopping rules",
      "Review the batch summary: total packages, estimated cost, carrier breakdown",
      "Click Confirm & Purchase Labels",
      "Labels are generated asynchronously — you'll receive a notification when complete",
      "Download all labels as a ZIP file or print directly from the batch",
    ],
  },
  {
    id: "csv-import",
    title: "CSV Import",
    icon: <Upload className="h-5 w-5" />,
    content:
      "You can also create a batch by uploading a CSV file. This is useful when orders originate outside LogiVox.",
    steps: [
      "Go to Batch Shipping → Import CSV",
      "Download the CSV template",
      "Fill in recipient address, package dimensions, weight, and carrier for each row",
      "Upload the completed CSV",
      "Review the import summary and fix any errors",
      "Click Process Batch to purchase all labels",
    ],
  },
  {
    id: "rate-shopping",
    title: "Automatic Rate Shopping",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    content:
      "Enable Rate Shopping in Settings → Shipping to automatically select the cheapest carrier and service for each package in a batch. Rate shopping compares rates from all connected carriers in real time and applies your preferred carrier rules (e.g., always use FedEx for overnight).",
  },
  {
    id: "bulk-download",
    title: "Downloading Labels",
    icon: <Download className="h-5 w-5" />,
    content:
      "After a batch is processed, you can download all labels as a single ZIP file, or select individual labels to download. Labels are available in PDF (standard) and ZPL (thermal printers). Packing slips can also be included in the download.",
  },
];

export default function HelpBatchShippingPage() {
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
          <Link
            href="/help/shipping"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Shipping
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Batch Shipping</span>
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
                  href="/dashboard/shipping"
                  className="block text-sm text-primary hover:underline"
                >
                  → Open Shipping
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
                <Badge variant="outline">Shipping</Badge>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Truck className="h-8 w-8" />
                Batch Shipping
              </h1>
              <p className="text-xl text-muted-foreground">
                Process hundreds of shipments at once and print all labels in a
                single click.
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
