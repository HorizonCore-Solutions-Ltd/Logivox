import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, AlertTriangle, Check, Info } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Inbound & Inventory User Guide | Flowstock Help Center',
  description: 'Detailed documentation on using the Inbound, Receiving, and Smart Slotting features.',
};

export default function InboundGuidePage() {
  return (
    <div className="container max-w-5xl py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
        <aside className="hidden lg:block space-y-4">
          <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
            Contents
          </div>
          <nav className="space-y-2 text-sm">
             <a href="#getting-started" className="block text-primary hover:underline">Getting Started</a>
             <a href="#receiving-workflow" className="block text-muted-foreground hover:text-primary transition-colors">Receiving Workflow</a>
             <a href="#cross-docking" className="block text-muted-foreground hover:text-primary transition-colors">Cross-Docking</a>
             <a href="#smart-slotting" className="block text-muted-foreground hover:text-primary transition-colors">Smart Slotting</a>
             <a href="#troubleshooting" className="block text-muted-foreground hover:text-primary transition-colors">Troubleshooting</a>
          </nav>
        </aside>

        <main className="space-y-8">
           <div className="mb-6">
            <Button variant="ghost" className="pl-0 gap-2 mb-4" asChild>
              <Link href="/resources/help">
                <ArrowLeft className="h-4 w-4" />
                Help Center
              </Link>
            </Button>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Inbound & Inventory Module Guide
            </h1>
            <p className="text-xl text-muted-foreground">
              Learn how to efficiently receive, inspect, and store inventory using Flowstock's advanced inbound tools.
            </p>
          </div>

          <section id="getting-started" className="scroll-mt-24 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight border-b pb-2">Getting Started</h2>
            <p>
              The <strong>Inbound & Inventory</strong> module is designed for warehouse staff. It is mobile-optimized but can also be used on desktop workstations.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Prerequisites</AlertTitle>
              <AlertDescription>
                Ensure you have the "Warehouse Operator" or "Admin" role to access receiving functions.
              </AlertDescription>
            </Alert>
          </section>

          <section id="receiving-workflow" className="scroll-mt-24 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight border-b pb-2">The Receiving Workflow</h2>
            <p>
              Receiving typically starts with a Purchase Order (PO) or an Advance Shipping Notice (ASN).
            </p>
            <ol className="list-decimal pl-6 space-y-2 marker:font-bold">
              <li>Navigate to <strong>Inventory &gt; Inbound</strong>.</li>
              <li>Select the incoming shipment from the list or scan the PO barcode.</li>
              <li>Scan each item's barcode as you unload.</li>
              <li>Verify the quantity. Over-receiving will trigger a manager approval workflow.</li>
              <li>Enter Lot/Expiry date if prompted (for perishable goods).</li>
            </ol>
             <Card className="mt-4">
              <CardHeader className="bg-muted/50 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Pro Tip: Bulk Receiving
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                If you trust the vendor's pallet configuration, you can receive entire License Plates (LPNs) at once instead of scanning individual cartons.
              </CardContent>
            </Card>
          </section>

          <section id="cross-docking" className="scroll-mt-24 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight border-b pb-2">Cross-Docking</h2>
            <p>
              When you receive an item that is currently backordered, the system will trigger a <strong>Cross-Dock Alert</strong>.
            </p>
            <div className="flex gap-4 items-start bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-400">Action Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  Do not put this item away! The scanner will direct you to a staging lane (e.g., STAGE-01). Move the goods directly to shipping.
                </p>
              </div>
            </div>
          </section>

          <section id="smart-slotting" className="scroll-mt-24 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight border-b pb-2">Smart Slotting</h2>
            <p>
              Once received, items must be put away. The "Inbound Brain" suggests the optimal bin location.
            </p>
            <ul className="grid gap-2">
              <li className="flex gap-2 bg-muted/40 p-2 rounded">
                 <Check className="h-4 w-4 text-green-500 mt-1" />
                 <span><strong>Velocity:</strong> Fast movers go to golden zones (waist-height, near shipping).</span>
              </li>
               <li className="flex gap-2 bg-muted/40 p-2 rounded">
                 <Check className="h-4 w-4 text-green-500 mt-1" />
                 <span><strong>Dimensions:</strong> Heavy items go to bottom racks.</span>
              </li>
            </ul>
             <p className="mt-4">
              To override a suggestion, scan a different valid bin location. The system will learn from your override over time.
            </p>
          </section>

          <section id="troubleshooting" className="scroll-mt-24 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight border-b pb-2">Troubleshooting</h2>
            <div className="grid gap-4">
               <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Scanner not picking up barcode?</h4>
                <p className="text-sm text-muted-foreground">Ensure the cursor is focused on the input field. Check if the barcode is damaged. You can manually type the SKU if necessary.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">"Location Full" error?</h4>
                <p className="text-sm text-muted-foreground">The system thinks the bin is at capacity. If visual inspection shows space, you can perform a "Cycle Count" to correct the system inventory.</p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
