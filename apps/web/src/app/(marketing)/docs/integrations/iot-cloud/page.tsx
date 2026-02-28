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
  Cloud,
  Radio,
  Wifi,
  Thermometer,
  Activity,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "IoT & Cloud Sensor Integration Guide | LogiVox Documentation",
  description:
    "Connect AWS IoT Core, Azure IoT Hub, and Google Cloud IoT with LogiVox WMS. Stream temperature, humidity, weight, and vibration sensor data for cold chain and predictive maintenance.",
};

export default function IoTPage() {
  const providers = [
    {
      name: "AWS IoT Core",
      type: "Cloud Platform",
      auth: "IAM / X.509 Certificates",
      complexity: "High",
      emoji: "☁️",
      notes:
        "Device telemetry, device shadow state, and rule engine integration via MQTT or HTTP.",
    },
    {
      name: "Azure IoT Hub",
      type: "Cloud Platform",
      auth: "SAS Token / X.509",
      complexity: "High",
      emoji: "🔵",
      notes:
        "Bi-directional device communication, device twin sync, and IoT Edge gateway support.",
    },
    {
      name: "Google Cloud IoT",
      type: "Cloud Platform",
      auth: "JWT / X.509",
      complexity: "High",
      emoji: "🔴",
      notes:
        "Pub/Sub sensor event streaming and device management via Cloud IoT Core.",
    },
    {
      name: "Temperature Sensors",
      type: "Environmental",
      auth: "MQTT / HTTP",
      complexity: "Low",
      emoji: "🌡️",
      notes:
        "Wireless temperature loggers (Testo, Hanwell, Vaisala) for cold chain monitoring.",
    },
    {
      name: "Weight Sensors",
      type: "Industrial",
      auth: "Modbus / OPC-UA",
      complexity: "Medium",
      emoji: "⚖️",
      notes:
        "Pallet scales and automated weighing systems integrated via industrial protocols.",
    },
    {
      name: "Vibration Sensors",
      type: "Predictive Maintenance",
      auth: "MQTT / Modbus",
      complexity: "Medium",
      emoji: "📳",
      notes:
        "Conveyor and motor vibration monitoring for predictive maintenance alerts.",
    },
  ];

  const syncedData = [
    {
      title: "Temperature Readings",
      description:
        "Ambient and product-level temperature from cold storage zones",
      direction: "Sensor → LogiVox",
    },
    {
      title: "Humidity Levels",
      description:
        "Relative humidity monitoring for sensitive pharmaceutical and food inventory",
      direction: "Sensor → LogiVox",
    },
    {
      title: "Weight Measurements",
      description: "Real-time pallet/tote weight from automated scales",
      direction: "Sensor → LogiVox",
    },
    {
      title: "Vibration Data",
      description:
        "Conveyor and motor vibration for condition-based maintenance",
      direction: "Sensor → LogiVox",
    },
    {
      title: "Device Shadow / Twin",
      description:
        "Device configuration and status sync with cloud IoT platforms",
      direction: "Bidirectional",
    },
    {
      title: "Alert Thresholds",
      description:
        "Trigger WMS alerts when sensor values exceed configured limits",
      direction: "LogiVox → Operators",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Choose IoT Platform",
      description:
        "Select cloud provider (AWS, Azure, Google) or deploy LogiVox IoT Gateway for local MQTT broker.",
    },
    {
      step: 2,
      title: "Provision Device Certificates",
      description:
        "Generate X.509 certificates or SAS tokens for secure device authentication.",
    },
    {
      step: 3,
      title: "Configure MQTT Topics",
      description:
        "Map sensor MQTT topics (e.g., warehouse/zone-a/temp) to LogiVox metrics and zones.",
    },
    {
      step: 4,
      title: "Register Sensors in LogiVox",
      description:
        "Add devices to LogiVox IoT Registry with sensor type, location, and alert thresholds.",
    },
    {
      step: 5,
      title: "Define Alert Rules",
      description:
        "Set threshold rules (Temp > 5°C, Humidity < 30%, Vibration > 2.5 mm/s) for automatic alerts.",
    },
    {
      step: 6,
      title: "Test Sensor Data Flow",
      description:
        "Publish test MQTT messages and verify they appear in LogiVox IoT Dashboard.",
    },
    {
      step: 7,
      title: "Enable Production Mode",
      description:
        "Activate live sensor streaming. Monitor device health and last-seen status in IoT Dashboard.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-cyan-900 via-blue-800 to-cyan-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-cyan-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-cyan-600 flex items-center justify-center">
              <Cloud className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-cyan-700 text-cyan-100">
                IoT & Cloud Sensors
              </Badge>
              <h1 className="text-4xl font-bold">IoT Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-cyan-100 max-w-3xl">
            Real-time sensor telemetry for cold chain compliance, predictive
            maintenance, and environmental monitoring across your warehouse
            network.
          </p>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">
            Supported IoT Platforms & Sensors
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
          <h2 className="text-2xl font-bold mb-6">What Gets Streamed</h2>
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
                <div className="h-8 w-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
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
          <h2 className="text-2xl font-bold mb-6">API Example</h2>
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Ingest Sensor Data
                </CardTitle>
                <CardDescription>POST /api/iot/telemetry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Publish temperature reading"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">/api/iot/telemetry</span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"device_id"</span>:{" "}
                    <span className="text-yellow-300">"temp-sensor-01"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"zone"</span>:{" "}
                    <span className="text-yellow-300">"COLD_STORAGE_A"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"metric"</span>:{" "}
                    <span className="text-yellow-300">"temperature"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"value"</span>:{" "}
                    <span className="text-orange-300">3.2</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"unit"</span>:{" "}
                    <span className="text-yellow-300">"celsius"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"timestamp"</span>:{" "}
                    <span className="text-yellow-300">
                      "2026-02-27T14:32:00Z"
                    </span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                  <div className="mt-4 text-slate-400">
                    {"// Alert triggered if > 5°C"}
                  </div>
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
            <AlertTitle>Cloud IoT Platform Required</AlertTitle>
            <AlertDescription>
              AWS IoT Core, Azure IoT Hub, and Google Cloud IoT require active
              cloud subscriptions. LogiVox can also operate with on-premise MQTT
              broker for air-gapped environments.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-cyan-600 to-blue-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to connect your sensors?
          </h2>
          <p className="text-cyan-100 mb-6">
            Digital twin monitoring for cold chain and predictive maintenance
            starts here.
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
              <Link href="/contact">Talk to IoT Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
