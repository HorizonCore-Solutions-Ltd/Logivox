import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, Truck, Printer, Globe, CheckCircle2, ArrowRight, AlertTriangle, Code } from "lucide-react";

export const metadata: Metadata = {
  title: "Carrier Integration Guide | LogiVox Documentation",
  description:
    "Connect FedEx, UPS, DHL, Royal Mail, DPD, and 50+ carriers to LogiVox WMS. Rate shopping, label generation, and real-time tracking.",
};

export default function CarriersPage() {
  const providers = [
    { name: "FedEx", region: "Global", auth: "OAuth 2.0", complexity: "Medium", emoji: "🟣", notes: "FedEx Ship Manager API — rate estimates, label generation, Ground/ Express/ Freight services." },
    { name: "UPS", region: "Global", auth: "OAuth 2.0", complexity: "Medium", emoji: "🟤", notes: "UPS Shipping API — Ground, Next Day Air, and international services with quantum view tracking." },
    { name: "DHL Express", region: "International", auth: "API Key", complexity: "Medium", emoji: "🟡", notes: "DHL Express API — worldwide express shipping with customs document generation." },
    { name: "Royal Mail", region: "UK", auth: "OAuth 2.0", complexity: "Medium", emoji: "🇬🇧", notes: "Royal Mail Click & Drop API — UK domestic and international tracked services." },
    { name: "DPD", region: "Europe", auth: "API Key", complexity: "Medium", emoji: "🔴", notes: "DPD API — European parcel network with Predict delivery notifications." },
    { name: "USPS", region: "US", auth: "API Key", complexity: "Low", emoji: "🦅", notes: "USPS Web Tools — domestic label generation and tracking for Priority Mail and First Class." },
    { name: "ShipStation", region: "Global Aggregator", auth: "API Key", complexity: "Low", emoji: "⚓", notes: "Multi-carrier shipping platform — aggregates FedEx, UPS, USPS, and 100+ carriers." },
  ];

  const syncedData = [
    { title: "Rate Shopping", description: "Fetch real-time shipping rates from multiple carriers for price comparison", direction: "LogiVox → Carriers" },
    { title: "Label Generation", description: "Create shipping labels (PDF / ZPL) with tracking numbers", direction: "LogiVox → Carrier" },
    { title: "Tracking Events", description: "Pull real-time shipment status (in-transit, delivered, exception)", direction: "Carrier → LogiVox" },
    { title: "Address Validation", description: "Validate and normalize shipping addresses pre-dispatch", direction: "LogiVox → Carrier" },
    { title: "Manifest Creation", description: "End-of-day manifests and SCAN forms for carrier pickup", direction: "LogiVox → Carrier" },
    { title: "Customs Documents", description: "Generate commercial invoices and customs declarations for international shipments", direction: "LogiVox → Carrier" },
  ];

  const steps = [
    { step: 1, title: "Enable Carrier Connector", description: "In LogiVox → Settings → Integrations → Carriers, select your carrier (FedEx, UPS, DHL, etc.) and enable." },
    { step: 2, title: "Enter Carrier Account Credentials", description: "Add your carrier account number, meter number (FedEx), and API credentials (OAuth client ID/secret or API key)." },
    { step: 3, title: "Configure Services", description: "Enable specific shipping services (Ground, Next Day, International Express) and set default service rules." },
    { step: 4, title: "Set Label Preferences", description: "Choose label format (PDF or ZPL), label size (4×6 or A4), and printer routing options." },
    { step: 5, title: "Configure Rate Shopping Logic", description: "Define rules for rate selection: cheapest, fastest, or custom matrix based on weight/destination." },
    { step: 6, title: "Test with Sample Shipment", description: "Create a test order, generate a label, and void the shipment to verify credentials and label format." },
    { step: 7, title: "Enable Production Mode", description: "Activate live label generation. Monitor shipping costs and tracking compliance in Carrier Dashboard." },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/docs/integrations" className="text-yellow-300 hover:text-white text-sm">
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-yellow-600 flex items-center justify-center">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-yellow-700 text-yellow-100">Carriers & Shipping</Badge>
              <h1 className="text-4xl font-bold">Carrier Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-yellow-100 max-w-3xl">
            Multi-carrier shipping made simple. Rate shop, generate labels, and track packages globally with a unified API.
          </p>
        </div>
      </section>

      {/* Supported Carriers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported Carriers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{p.complexity}</Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">{p.region}</Badge>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Auth:</span> {p.auth}</p>
                  <p>{p.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Gets Synced */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">What Gets Synchronised</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {syncedData.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{item.direction}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Snippet */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code className="h-4 w-4" /> Rate Shop & Create Label</CardTitle>
                <CardDescription>POST /api/shipping/rate-shop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">{"// Get rates from all carriers"}</div>
                  <div className="mt-2"><span className="text-purple-400">POST</span> <span className="text-blue-400">/api/shipping/rate-shop</span></div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4"><span className="text-blue-300">"origin"</span>: <span className="text-yellow-300">"US_WAREHOUSE_A"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"destination"</span>: {"{"} <span className="text-blue-300">"zip"</span>: <span className="text-yellow-300">"90210"</span> {"}"},</div>
                  <div className="ml-4"><span className="text-blue-300">"weight"</span>: <span className="text-orange-300">5.5</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"service_level"</span>: <span className="text-yellow-300">"ground"</span></div>
                  <div className="text-slate-400">{"}"}</div>
                  <div className="mt-4 text-slate-400">{"// Response: cheapest rate = UPS Ground"}</div>
                  <div className="mt-4 text-green-400">{"// Create label"}</div>
                  <div className="mt-2"><span className="text-purple-400">POST</span> <span className="text-blue-400">/api/shipping/labels</span></div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4"><span className="text-blue-300">"carrier"</span>: <span className="text-yellow-300">"UPS"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"service"</span>: <span className="text-yellow-300">"GROUND"</span>,</div>
                  <div className="ml-4"><span className="text-blue-300">"tracking_number"</span>: <span className="text-yellow-300">"1Z999AA10123456784"</span></div>
                  <div className="text-slate-400">{"}"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Alert */}
      <section className="py-10 bg-white">
        <div className="container-enterprise max-w-3xl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Carrier Credentials Required</AlertTitle>
            <AlertDescription>
              You must have an active carrier account (FedEx, UPS, etc.) to use their APIs. LogiVox does not provide carrier services — we integrate with your existing accounts.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-yellow-600 to-amber-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to automate your shipping?</h2>
          <p className="text-yellow-100 mb-6">Connect all your carriers in under 10 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">Start Free Trial<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" asChild>
              <Link href="/contact">Talk to Shipping Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
