import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  BarChart3,
  ScanLine,
  Truck,
  ArrowLeftRight,
  Component,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inbound & Inventory Management | Flowstock Enterprise",
  description:
    "Optimize receiving, cross-docking, and smart slotting with Flowstock's advanced inbound module.",
};

export default function InboundInventoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                New Enterprise Module
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Smart Inbound & Inventory Intelligence
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Transform your receiving dock into a strategic asset. Automate
                put-away decisions, enable cross-docking on the fly, and
                optimize warehouse density with our new Inbound Brain
                technology.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact-sales">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Smart Slotting
              </div>
              <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                The Inbound Brain
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our proprietary algorithm analyzes incoming shipments in
                real-time to determine the optimal storage location based on
                velocity, dimensions, and current stock levels. Say goodbye to
                manual put-away decisions.
              </p>
              <ul className="grid gap-2 py-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Velocity-based slotting optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Real-time capacity analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Dynamic re-slotting suggestions</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Cross-Docking
              </div>
              <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                Immediate Fulfillment
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Why store what you need to ship? Our system identifies
                backorders immediately upon receipt and directs items straight
                to the packing station, skipping storage entirely.
              </p>
              <ul className="grid gap-2 py-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Zero-touch cross-docking logic</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Reduced handling costs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Faster order turnaround times</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Capabilities at a Glance
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to manage complex inventory workflows.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Truck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Receiving Operations</CardTitle>
                <CardDescription>
                  Mobile-first receiving workflows for dock staff.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scan GS1 barcodes, verify quantities against POs, and capture
                  lot/expiry data at the point of entry. Failed inspections
                  trigger automated quarantine workflows.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Component className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Slotting</CardTitle>
                <CardDescription>
                  Data-driven location assignment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our algorithm considers item dimensions, weight constraints,
                  and pick frequency to suggest the perfect bin location,
                  maximizing warehouse density.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ArrowLeftRight className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Cross-Docking</CardTitle>
                <CardDescription>
                  Direct-to-shipping efficient routing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Items needed for open orders are flagged immediately. Skip
                  put-away and move goods directly to outbound staging lanes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ScanLine className="h-10 w-10 text-primary mb-2" />
                <CardTitle>License Plate (LPN)</CardTitle>
                <CardDescription>
                  Container-level tracking efficiency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate and track License Plate Numbers for pallets and
                  cartons. Move entire LPNs with a single scan rather than
                  item-by-item.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Inbound Analytics</CardTitle>
                <CardDescription>
                  Detailed vendor performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track vendor compliance, receipt accuracy, and dock-to-stock
                  cycle times. Identify bottlenecks in your receiving process.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Factory className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Quality Assurance</CardTitle>
                <CardDescription>
                  Integrated inspection workflows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Define custom inspection criteria by SKU or category. Enforce
                  mandatory photo capture for damaged goods before acceptance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-t">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to optimize your inbound flow?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Join high-growth brands using Flowstock to streamline their
                warehouse operations.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Button size="lg" className="w-full" asChild>
                <Link href="/auth/signup">Get Started for Free</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                No credit card required for 14-day trial.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
