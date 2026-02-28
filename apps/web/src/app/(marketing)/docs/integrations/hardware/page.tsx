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
  Cpu,
  CheckCircle2,
  ArrowRight,
  Printer,
  Scan,
  Wifi,
  AlertTriangle,
  Code,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hardware Integration Guide | LogiVox Documentation",
  description:
    "Connect Zebra scanners, Honeywell printers, RFID readers, and industrial PLCs to LogiVox WMS. Native protocol support for ZPL, DataWedge, and OPC-UA.",
};

export default function HardwareIntegrationPage() {
  const providers = [
    {
      name: "Zebra Mobile Computers",
      category: "Scanners",
      auth: "Android Enterprise",
      complexity: "Medium",
      emoji: "🦓",
      notes:
        "TC2x, MC33 series — DataWedge or LogiVox native app for barcode capture.",
    },
    {
      name: "Zebra Label Printers",
      category: "Printers",
      auth: "Network / USB",
      complexity: "Low",
      emoji: "🖨️",
      notes: "ZT411, ZD620 — Direct ZPL print via TCP socket or CUPS.",
    },
    {
      name: "Honeywell Scanners",
      category: "Scanners",
      auth: "Bluetooth / USB",
      complexity: "Medium",
      emoji: "📡",
      notes:
        "Dolphin CT40, Voyager 1470g — HID keyboard wedge or SDK integration.",
    },
    {
      name: "Datalogic",
      category: "Scanners",
      auth: "Network / USB",
      complexity: "Medium",
      emoji: "📶",
      notes: "Memor 10, Matrix 320 — SDK or HID emulation for barcode scans.",
    },
    {
      name: "Impinj RFID",
      category: "RFID",
      auth: "LLRP / REST API",
      complexity: "High",
      emoji: "📡",
      notes:
        "Speedway R420, xArray — LLRP tag streaming to LogiVox RFID middleware.",
    },
    {
      name: "Siemens PLC / SCADA",
      category: "Automation",
      auth: "OPC-UA",
      complexity: "Enterprise",
      emoji: "⚙️",
      notes: "S7-1500 PLC — OPC-UA server for conveyor and sortation control.",
    },
    {
      name: "Allen-Bradley / Rockwell",
      category: "Automation",
      auth: "EtherNet/IP",
      complexity: "Enterprise",
      emoji: "🔧",
      notes:
        "CompactLogix, ControlLogix — EtherNet/IP for material handling systems.",
    },
  ];

  const syncedData = [
    {
      title: "Barcode Scans",
      description:
        "Capture UPC, Code 128, QR codes from handheld or fixed scanners",
      direction: "Device → LogiVox",
    },
    {
      title: "Label Print Jobs",
      description: "Push ZPL/IPL print data directly to thermal printers",
      direction: "LogiVox → Printer",
    },
    {
      title: "RFID Tag Reads",
      description: "Stream EPC tag data from fixed RFID readers at dock doors",
      direction: "RFID → LogiVox",
    },
    {
      title: "Device Health Metrics",
      description:
        "Battery level, Wi-Fi signal, error codes from mobile computers",
      direction: "Device → LogiVox",
    },
    {
      title: "PLC Control Signals",
      description:
        "Conveyor start/stop, divert commands, sortation destinations",
      direction: "Bidirectional",
    },
    {
      title: "Firmware Updates",
      description: "Push configuration profiles and OS updates via MDM",
      direction: "LogiVox → Device",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Register Device in LogiVox",
      description:
        "Navigate to Settings → Hardware → Register Device. Enter MAC address or scan device QR code.",
    },
    {
      step: 2,
      title: "Install Agent or Profile",
      description:
        "For Android: install LogiVox app via MDM. For Zebra: configure DataWedge profile. For printers: add network IP.",
    },
    {
      step: 3,
      title: "Configure Device Settings",
      description:
        "Set symbologies (Code 128, QR enabled), DPI (203 / 300), and network parameters (Wi-Fi SSID, static IP).",
    },
    {
      step: 4,
      title: "Map Device to Zone",
      description:
        "Assign the device to a warehouse zone (Receiving, Picking, Packing) for location-aware workflows.",
    },
    {
      step: 5,
      title: "Test Connectivity",
      description:
        "Perform a test scan (for scanners), print a test label (for printers), or read a test tag (for RFID).",
    },
    {
      step: 6,
      title: "Monitor Health Dashboard",
      description:
        "View real-time device status, battery levels, and error logs in LogiVox Hardware Management.",
    },
    {
      step: 7,
      title: "Scale Fleet Deployment",
      description:
        "Use MDM zero-touch provisioning to deploy 100s of devices with the same profile.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-amber-900 via-orange-800 to-amber-900 text-white py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/docs/integrations"
              className="text-amber-300 hover:text-white text-sm"
            >
              ← Integration Guides
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-amber-600 flex items-center justify-center">
              <Cpu className="h-7 w-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-amber-700 text-amber-100">
                Warehouse Hardware
              </Badge>
              <h1 className="text-4xl font-bold">Hardware Integration Guide</h1>
            </div>
          </div>
          <p className="text-xl text-amber-100 max-w-3xl">
            Connect barcode scanners, label printers, RFID readers, and
            industrial PLCs to LogiVox with native protocol support.
          </p>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <h2 className="text-2xl font-bold mb-6">Supported Hardware</h2>
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
                    {p.category}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">
                      Connection:
                    </span>{" "}
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
          <h2 className="text-2xl font-bold mb-6">What Gets Integrated</h2>
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
                <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
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
                  <Code className="h-4 w-4" /> Register Hardware Device
                </CardTitle>
                <CardDescription>
                  POST /api/integrations/hardware
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-green-400">
                    {"// Register a Zebra scanner"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-400">POST</span>{" "}
                    <span className="text-blue-400">
                      /api/integrations/hardware
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"deviceType"</span>:{" "}
                    <span className="text-yellow-300">"SCANNER"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"manufacturer"</span>:{" "}
                    <span className="text-yellow-300">"ZEBRA"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"model"</span>:{" "}
                    <span className="text-yellow-300">"TC52"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"mac Address"</span>:{" "}
                    <span className="text-yellow-300">"00:A0:C9:14:C8:29"</span>
                    ,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"zoneId"</span>:{" "}
                    <span className="text-yellow-300">"PICKING"</span>
                  </div>
                  <div className="text-slate-400">{"}"}</div>
                  <div className="mt-4 text-slate-400">{"// Response"}</div>
                  <div className="mt-1 text-slate-400">{"{"}</div>
                  <div className="ml-4">
                    <span className="text-blue-300">"deviceId"</span>:{" "}
                    <span className="text-yellow-300">"dev_abc123"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"status"</span>:{" "}
                    <span className="text-yellow-300">"registered"</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-300">"enrollmentCode"</span>:{" "}
                    <span className="text-yellow-300">"LV-TC52-9482"</span>
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
            <AlertTitle>Network Requirements</AlertTitle>
            <AlertDescription>
              Ensure scanners and printers are on the same VLAN as LogiVox
              servers. For PLC integrations, consult your controls engineer for
              firewall rules (OPC-UA port 4840, EtherNet/IP port 44818).
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-amber-600 to-orange-500 text-white">
        <div className="container-enterprise text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to connect your warehouse hardware ?
          </h2>
          <p className="text-amber-100 mb-6">
            Our hardware team will help you deploy and configure your fleet.
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
              <Link href="/contact">Talk to Hardware Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
