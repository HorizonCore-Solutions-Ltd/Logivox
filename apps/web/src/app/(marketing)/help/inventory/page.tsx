import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowLeft,
  Search,
  BarChart2,
  AlertCircle,
  Plus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory Management Guide | Flowstock Help",
  description:
    "Learn how to manage your inventory in Flowstock — adding products, tracking stock, setting reorder points, and more.",
};

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    icon: <BarChart2 className="h-5 w-5" />,
    content:
      "The Inventory module is the heart of Flowstock. It tracks all your products, their stock levels across multiple warehouses, and helps you stay ahead of stock-outs with intelligent reorder alerts.",
  },
  {
    id: "adding",
    title: "Adding Products",
    icon: <Plus className="h-5 w-5" />,
    content:
      "To add a new product, go to Inventory → Products and click New Product. You'll need to provide a SKU (unique product code), name, and at least one warehouse location. Optional fields include barcode, dimensions, weight, cost price, and sale price.",
    steps: [
      "Navigate to Dashboard → Inventory → Products",
      "Click the New Product button",
      "Fill in the SKU and product name (required)",
      "Set the initial stock quantity and warehouse",
      "Set a reorder point to trigger low stock alerts",
      "Click Save to create the product",
    ],
  },
  {
    id: "adjustments",
    title: "Stock Adjustments",
    icon: <AlertCircle className="h-5 w-5" />,
    content:
      "Stock adjustments let you correct inventory counts due to damage, theft, counting errors, or other reasons. Every adjustment is logged with a reason code for audit purposes.",
    steps: [
      "Go to the product detail page",
      "Click Adjust Stock",
      "Enter the adjustment quantity (positive or negative)",
      "Select a reason code",
      "Add optional notes",
      "Confirm the adjustment",
    ],
  },
  {
    id: "search",
    title: "Searching & Filtering",
    icon: <Search className="h-5 w-5" />,
    content:
      "Flowstock provides powerful search and filtering capabilities. You can search by SKU, name, barcode, or supplier. Filter by warehouse, category, stock status, or date added.",
  },
];

export default function HelpInventoryPage() {
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
          <span className="font-medium">Inventory</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          {/* Table of contents */}
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
                  href="/dashboard/inventory"
                  className="block text-sm text-primary hover:underline"
                >
                  → Open Inventory
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

          {/* Content */}
          <article className="lg:col-span-3 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Help Article</Badge>
                <Badge variant="outline">Inventory</Badge>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Package className="h-8 w-8" />
                Inventory Management
              </h1>
              <p className="text-xl text-muted-foreground">
                A complete guide to managing products and stock levels in
                Flowstock.
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
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
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
              <p className="text-sm text-muted-foreground">
                Contact our support team or browse related articles.
              </p>
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
