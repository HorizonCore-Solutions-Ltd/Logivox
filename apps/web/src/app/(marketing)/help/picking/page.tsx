import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, MapPin, CheckSquare, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Picking Guide | Flowstock Help",
  description:
    "Learn how to efficiently pick orders in Flowstock using pick lists, wave picking, and mobile scanners.",
};

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    icon: <ShoppingBag className="h-5 w-5" />,
    content:
      "Flowstock's picking module optimises the order fulfilment process by generating efficient pick lists, grouping orders into waves, and guiding warehouse staff to the exact bin location for each item.",
  },
  {
    id: "pick-lists",
    title: "Creating Pick Lists",
    icon: <CheckSquare className="h-5 w-5" />,
    content:
      "Pick lists are automatically generated when orders are released for picking. You can also manually create pick lists for specific orders or use wave picking to batch multiple orders together for maximum efficiency.",
    steps: [
      "Go to Dashboard → Fulfilment → Pick Lists",
      "Click Release Orders to auto-generate pick lists",
      "Or click New Pick List to manually select orders",
      "Assign the pick list to a picker or let staff self-assign",
      "The picker receives the optimised route through the warehouse",
    ],
  },
  {
    id: "wave-picking",
    title: "Wave Picking",
    icon: <Zap className="h-5 w-5" />,
    content:
      "Wave picking batches multiple orders into a single pick run, reducing travel time by up to 60%. Flowstock groups orders by warehouse zone, shipping carrier, or due time. To enable wave picking, go to Settings → Fulfilment.",
    steps: [
      "Enable Wave Picking in Settings → Fulfilment",
      "Configure wave parameters (max orders, zone grouping)",
      "Go to Fulfilment → Wave Management",
      "Create a new wave or let the system auto-assign",
      "Release the wave to generate consolidated pick lists",
    ],
  },
  {
    id: "bin-locations",
    title: "Bin Location Guidance",
    icon: <MapPin className="h-5 w-5" />,
    content:
      "Each pick list includes the exact bin location for every item (e.g., A4-3-2 = Aisle 4, Rack 3, Shelf 2). The route is optimised to minimise travel distance. Pickers can use the mobile app or printed pick lists and scan each item to confirm.",
  },
];

export default function HelpPickingPage() {
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
          <span className="font-medium">Picking</span>
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
                  href="/dashboard/fulfillment"
                  className="block text-sm text-primary hover:underline"
                >
                  → Open Fulfilment
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
                <Badge variant="outline">Picking</Badge>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShoppingBag className="h-8 w-8" />
                Picking Orders
              </h1>
              <p className="text-xl text-muted-foreground">
                Efficiently pick and fulfil customer orders with smart pick
                lists and wave picking.
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
