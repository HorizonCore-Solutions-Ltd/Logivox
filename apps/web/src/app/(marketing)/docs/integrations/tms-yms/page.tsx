import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  ArrowRight,
  Truck,
  AlertTriangle,
  Code,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title: "TMS & YMS Integration Guide | LogiVox Documentation",
  description:
    "Connect FleetOps360, Samsara, Webfleet, Trimble TMS, and MercuryGate with LogiVox WMS. Sync yard management, dock assignments, fleet telematics, and carrier management.",
};

export default function TMSYMSIntegrationPage() {
  const providers = [
    {
      name: "FleetOps360",
      auth: "API Key",
      complexity: "Medium",
      emoji: "🚛",
      notes:
        "Yard and fleet management — live vehicle positions, gate events, and dock assignments.",
    },
    {
      name: "Samsara",
      auth: "OAuth 2.0",
      complexity: "Medium",
      emoji: "📍",
      notes:
        "GPS fleet tracking, HOS compliance, and IoT sensor data from telematics platform.",
    },
    {
      name: "Webfleet (TomTom)",
      auth: "OAuth 2.0",
      complexity: "Medium",
      emoji: "🗺️",
      notes:
        "Vehicle telematics and driver behaviour analytics from TomTom Webfleet.",
    },
    {
      name: "Trimble TMS",
      auth: "OAuth 2.0",
      complexity: "High",
      emoji: "🚚",
      notes:
        "Load planning, carrier management, and freight audit with Trimble Transportation.",
    },
    {
      name: "MercuryGate TMS",
      auth: "API Key",
      complexity: "High",
      emoji: "☿",
      notes: "Cloud TMS — load tendering, track-and-trace, and carrier EDI.",
    },
  ];

  const syncedData = [
    {
      title: "Dock Appointments",
      description:
        "Inbound/outbound appointments synced to yard management system",
      direction: "Bidirectional",
    },
    {
      title: "Gate Events",
      description: "Truck check-in/check-out and live yard visibility",
      direction: "YMS → LogiVox",
    },
    {
      title: "Load Assignments",
      description: "Link shipments to specific trailers and drivers",
      direction: "LogiVox → TMS",
    },
    {
      title: "GPS Tracking",
      description: "Real-time vehicle location and ETA updates",
      direction: "TMS → LogiVox",
    },
    {
      title: "Carrier EDI",
      description:
        "ASN (856), shipment status (214), and tender (204) messages",
      direction: "Bidirectional",
    },
    {
      title: "Freight Audit",
      description: "Carrier invoices matched to shipment manifests",
      direction: "TMS → LogiVox",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Enable the TMS/YMS Connector",
      description:
        "In LogiVox → Settings → Integrations → Transportation, select your provider.",
    },
    {
      step: 2,
      title: "Generate API credentials",
      description:
        "Create an integration user in your TMS/YMS with permissions for loads, appointments, and tracking.",
    },
    {
      step: 3,
      title: "Configure webhook endpoints",
      description:
        "Set up webhooks for gate events and ETA updates to stream into LogiVox.",
    },
    {
      step: 4,
      title: "Map carriers and dock doors",
      description:
        "Match your carrier codes and physical dock locations to LogiVox warehouse zones.",
    },
    {
      step: 5,
      title: "Enable EDI message types",
      description:
        "Configure which EDI transaction sets (856, 214, 204) to exchange with carriers.",
    },
    {
      step: 6,
      title: "Test with a sample appointment",
      description:
        "Create a test inbound appointment and verify it appears in LogiVox receiving dashboard.",
    },
    {
      step: 7,
      title: "Enable production mode",
      description:
        "Activate the connector for live yard and fleet data streaming.",
    },
  ];

  const useCases = [
    {
      title: "Yard Visibility",
      description:
        "Real-time view of all trailers in your yard with live check-in/check-out events and dock door assignments.",
      icon: MapPin,
    },
    {
      title: "Dock Scheduling",
      description:
        "Optimize dock utilisation with automated appointment scheduling synced between TMS and WMS.",
      icon: Truck,
    },
    {
      title: "Carrier Compliance",
      description:
        "Track on-time performance, detention time, and carrier scorecard metrics across your network.",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-orange-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-orange-600 flex items-center justify-center">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-orange-700 text-orange-100">
                Transportation
              </Badge>
              <h1 className="text-4xl font-bold">
                TMS & Yard Management Integration
              </h1>
            </div>
          </div>
          <p className="text-xl text-orange-100 max-w-3xl">
            Connect your Transportation Management System and Yard Management
            System to LogiVox for end-to-end shipment visibility and dock
            optimisation.
          </p>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">
            Supported TMS & YMS Providers
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {p.complexity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Auth:</span>{" "}
                    {p.auth}
                  </p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {item.direction}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Common Use Cases</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <Card key={uc.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">{uc.title}</CardTitle>
                    <CardDescription>{uc.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Snippet */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Trigger Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Trigger TMS/YMS Sync
                </CardTitle>
                <CardDescription>
                  POST /api/integrations/tms-yms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Sync dock appointments from TMS"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">
                      /api/integrations/tms-yms
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">"SAMSARA"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"action"</span>:{" "}
                    <span className="text-yellow-300">"sync_appointments"</span>
                    ,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"date_range"</span>:{" "}
                    <span className="text-yellow-300">"next_7_days"</span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Alert */}
      <section className="py-10 bg-muted/30">
        <div className="container-enterprise max-w-3xl">
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertTitle>Carrier EDI Setup</AlertTitle>
            <AlertDescription>
              EDI integrations (856, 214, 204 transaction sets) require
              dedicated EDI onboarding and carrier testing. Contact your LogiVox
              integration team for EDI enablement.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-orange-600 to-orange-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to connect your TMS?
          </h2>
          <p className="text-orange-100 mb-6">
            Optimise your dock operations and carrier network today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Talk to Logistics Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
