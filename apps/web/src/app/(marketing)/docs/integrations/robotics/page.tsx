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
  Bot,
  CheckCircle2,
  ArrowRight,
  Boxes,
  AlertTriangle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Robotics Integration Guide | LogiVox Documentation",
  description:
    "Connect AutoStore, Dematic, Locus AMR, and Geek+ robotics systems to LogiVox. Bi-directional WCS integration for task dispatch and fleet monitoring.",
};

export default function RoboticsIntegrationPage() {
  const providers = [
    {
      name: "AutoStore",
      type: "AS/RS Grid",
      auth: "REST API",
      complexity: "Enterprise",
      emoji: "🤖",
      notes:
        "AutoStore grid WCS — task dispatch to ports, bin retrieval, and throughput metrics.",
    },
    {
      name: "Dematic iQ WCS",
      type: "Material Handling",
      auth: "Custom XML/SOAP",
      complexity: "Enterprise",
      emoji: "🏭",
      notes:
        "Conveyor, sorter, and AGV orchestration via Dematic iQ Warehouse Control System.",
    },
    {
      name: "Locus Robotics",
      type: "AMR Fleet",
      auth: "REST API",
      complexity: "High",
      emoji: "🤖",
      notes:
        "Locus AMR fleet — dispatch pick jobs, monitor bot status, and receive completion events.",
    },
    {
      name: "Geek+",
      type: "Goods-to-Person",
      auth: "REST API",
      complexity: "High",
      emoji: "📦",
      notes:
        "Geek+ shelf-moving robots — pod dispatch, sort-to-light integration, and station management.",
    },
    {
      name: "Fetch Robotics",
      type: "AMR Transport",
      auth: "OAuth 2.0",
      complexity: "High",
      emoji: "🚗",
      notes:
        "Autonomous mobile robots for pallet/cart transport — workflow automation via Fetch Cloud.",
    },
  ];

  const syncedData = [
    {
      title: "Pick Tasks",
      description: "Dispatch picking jobs to robot fleet from LogiVox waves",
      direction: "LogiVox → WCS",
    },
    {
      title: "Replenishment Jobs",
      description: "Trigger automated replenishment when pick faces are low",
      direction: "LogiVox → WCS",
    },
    {
      title: "Robot Status",
      description:
        "Monitor battery, location, task queue, and errors in real-time",
      direction: "WCS → LogiVox",
    },
    {
      title: "Completion Events",
      description:
        "Receive task acknowledgement, pick confirmation, and error codes",
      direction: "WCS → LogiVox",
    },
    {
      title: "Inventory Movements",
      description: "Sync bin/pod transfers and putaway locations",
      direction: "Bidirectional",
    },
    {
      title: "Throughput Metrics",
      description: "Track picks per hour, cycle time, and fleet utilization",
      direction: "WCS → LogiVox",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Enable Robotics Connector",
      description:
        "In LogiVox → Settings → Integrations → Robotics, select your WCS provider (AutoStore, Locus, etc.) and enable.",
    },
    {
      step: 2,
      title: "Obtain WCS API Credentials",
      description:
        "Get the REST API endpoint URL and API key or OAuth credentials from your robotics supplier.",
    },
    {
      step: 3,
      title: "Configure Endpoint",
      description:
        "Enter WCS URL, credential, and webhook endpoint for bi-directional communication.",
    },
    {
      step: 4,
      title: "Map Zones & Task Types",
      description:
        "Map LogiVox warehouse zones to WCS stations/ports, and define task types (pick, replenish, transport).",
    },
    {
      step: 5,
      title: "Test Job Dispatch",
      description:
        "Create a test pick wave in LogiVox and verify that tasks appear in the WCS queue.",
    },
    {
      step: 6,
      title: "Monitor Fleet Dashboard",
      description:
        "View robot status, task queue depth, and error logs in LogiVox Robotics Dashboard.",
    },
    {
      step: 7,
      title: "Enable Production Mode",
      description:
        "Activate live task dispatch and real-time status sync. Monitor fleet health continuously.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-teal-900 via-cyan-800 to-teal-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-teal-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-teal-600 flex items-center justify-center">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-teal-700 text-teal-100">
                Robotics & Automation
              </Badge>
              <h1 className="text-4xl font-bold">Robotics Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-teal-100 max-w-3xl">
            Connect your warehouse robotics fleet to LogiVox for unified task
            orchestration and real-time fleet monitoring.
          </p>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">
            Supported Robotics Systems
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
                  <Badge variant="secondary" className="text-xs w-fit">
                    {p.type}
                  </Badge>
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

      {/* Setup Steps */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-8">Setup Steps</h2>
          <div className="space-y-4 max-w-3xl">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
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
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">API Trigger Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Dispatch Pick Task
                </CardTitle>
                <CardDescription>
                  POST /api/integrations/robotics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Dispatch picking task to AMR fleet"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">
                      /api/integrations/robotics
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"provider"</span>:{" "}
                    <span className="text-yellow-300">"LOCUS_ROBOTICS"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"taskType"</span>:{" "}
                    <span className="text-yellow-300">"PICK"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"waveId"</span>:{" "}
                    <span className="text-yellow-300">"WAVE-001"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"station"</span>:{" "}
                    <span className="text-yellow-300">"PICK_STATION_A"</span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                  <div className="mt-4 text-slate-400">{"// Response"}</div>
                  <div className="mt-1 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"jobId"</span>:{" "}
                    <span className="text-yellow-300">"job_xyz789"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"status"</span>:{" "}
                    <span className="text-yellow-300">"dispatched"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"assignedRobots"</span>: [
                    <span className="text-yellow-300">"BOT-42"</span>,{" "}
                    <span className="text-yellow-300">"BOT-73"</span>]
                  </div>
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
            <AlertTitle>Enterprise Implementation</AlertTitle>
            <AlertDescription>
              Robotics integrations require on-site commissioning and
              coordination with your WCS vendor. Contact LogiVox Professional
              Services for a scoped implementation plan.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-teal-600 to-cyan-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to connect your robot fleet?
          </h2>
          <p className="text-teal-100 mb-6">
            Our robotics team will guide you through WCS integration.
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
              <Link href="/contact">Talk to Robotics Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
