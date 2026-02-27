import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  Cpu,
  Zap,
  BarChart3,
  Shield,
  Clock,
  TrendingUp,
  Network,
  Activity,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Robotics & Automation Integration | LogiVox WMS",
  description:
    "Orchestrate AMR fleets, AGVs, cobots, cross-belt sorters, conveyors, and AS/RS cranes from one unified command centre. LogiVox delivers enterprise robotics integration without the enterprise price tag.",
  keywords: [
    "warehouse robotics software",
    "AMR fleet management",
    "autonomous mobile robot WMS",
    "AGV warehouse management",
    "automated guided vehicle software",
    "cobot warehouse integration",
    "AS/RS control system",
    "automated storage retrieval system software",
    "sortation system WMS",
    "cross-belt sorter management",
    "conveyor management software",
    "warehouse automation platform",
    "robot dispatch software",
    "AI fleet orchestration",
    "WMS robotics integration",
    "automated warehouse management system",
    "robotics as a service warehouse",
    "goods to person WMS",
    "GTP warehouse software",
    "warehouse automation ROI",
  ],
  openGraph: {
    title: "Robotics & Automation Integration — LogiVox",
    description:
      "One platform to orchestrate every robot, sorter, and conveyor in your warehouse. Real-time battery tracking, AI dispatch, 95%+ sortation success rates.",
    type: "website",
  },
};

const AMR_CAPABILITIES = [
  {
    icon: Bot,
    title: "AI-Powered Fleet Dispatch",
    description:
      "LogiVox automatically matches queued tasks to the best available device based on battery level, device type, current location, and task priority — no manual assignment required.",
    metric: "4× task throughput vs manual dispatch",
  },
  {
    icon: Activity,
    title: "Real-Time Fleet Monitoring",
    description:
      "Live battery level bars, utilisation percentages, and task counts for every AMR, AGV, and cobot on your floor. Spot underperforming units before they become a bottleneck.",
    metric: "15-second auto-refresh across entire fleet",
  },
  {
    icon: Cpu,
    title: "Multi-Device Type Support",
    description:
      "AMRs, AGVs, cobots, robot arms — all managed from one fleet command centre. Device-type-aware dispatch prevents sending a pallet jack to a cobot task.",
    metric: "Supports AMR · AGV · COBOT · ROBOT_ARM",
  },
  {
    icon: Shield,
    title: "Manual Override & Safety",
    description:
      "Supervisors can manually dispatch any idle device with a point-and-click interface. Full task history per device for audit trails and insurance compliance.",
    metric: "One-click override, full audit trail",
  },
];

const SORTATION_CAPABILITIES = [
  {
    icon: Network,
    title: "Conveyor & Sorter Control",
    description:
      "Monitor cross-belt sorters, shoe sorters, and conveyor lines from a single dashboard. Utilisation bars, per-device success rates, and live status indicators.",
    metric: "99%+ sortation accuracy tracked per device",
  },
  {
    icon: BarChart3,
    title: "8-Hour Throughput Analytics",
    description:
      "Area chart showing items processed per hour across all sortation systems. Average throughput reference line highlights drop-off before shift supervisors are notified.",
    metric: "Peak throughput identification in seconds",
  },
  {
    icon: Layers,
    title: "AS/RS Crane Integration",
    description:
      "Automated storage and retrieval cranes tracked with the same dashboard — utilisation, task count, success rate, and last maintenance date all visible at a glance.",
    metric: "100% task success rate on verified installations",
  },
  {
    icon: Clock,
    title: "Live Activity Feed",
    description:
      "Real-time stream of completed, in-progress, and failed sortation tasks with cycle times. Supervisors see failures the instant they happen, not in the next shift report.",
    metric: "Sub-second failure notification",
  },
];

const DEVICE_TYPES = [
  { type: "AMR", icon: "🤖", label: "Autonomous Mobile Robot", desc: "Goods-to-person, replenishment, putaway" },
  { type: "AGV", icon: "🚗", label: "Automated Guided Vehicle", desc: "Heavy pallet transport, long-aisle runs" },
  { type: "COBOT", icon: "🦾", label: "Collaborative Robot", desc: "Packing station assistance, pick support" },
  { type: "ROBOT_ARM", icon: "🦿", label: "Robot Arm / Articulated", desc: "Palletising, depalletising, kitting" },
  { type: "CONVEYOR", icon: "⚙️", label: "Conveyor System", desc: "Inbound induction, outbound dispatch lines" },
  { type: "SORTER", icon: "🔀", label: "Cross-Belt / Shoe Sorter", desc: "Order sorting, returns processing" },
  { type: "AS_RS", icon: "🏗️", label: "AS/RS Crane", desc: "High-density automated storage and retrieval" },
];

const COMPETITOR_GAPS = [
  { competitor: "SAP EWM", gap: "Robot integration requires separate SAP automation module (+$80K/yr). No unified fleet dashboard." },
  { competitor: "Manhattan Associates", gap: "MHE integration via third-party MFC layer. No native AMR dispatch or sortation analytics." },
  { competitor: "Oracle WMS", gap: "Robotics automation not included in standard WMS tier. Custom integrations billed separately." },
  { competitor: "Standalone RCS", gap: "Robot control systems operate in silos — no connection to WMS inventory, picks, or order data." },
];

const STATS = [
  { value: "4×", label: "throughput increase vs manual dispatch" },
  { value: "95%+", label: "sortation success rate on live deployments" },
  { value: "15s", label: "fleet status refresh interval" },
  { value: "7", label: "automation device types supported natively" },
  { value: "100%", label: "WMS-native — no third-party middleware required" },
  { value: "30 days", label: "average time to full fleet onboarding" },
];

export default function RoboticsAutomationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">

      {/* Hero */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-transparent to-teal-50/30 dark:from-violet-950/10 dark:to-teal-950/10" />
        <div className="container-enterprise relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-violet-100 text-violet-800 border-violet-300 px-4 py-1.5 text-sm">
              🤖 Robotics &amp; Automation — Pillar 4
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              One Platform.{" "}
              <span className="text-violet-600">Every Robot</span>{" "}
              on Your Floor.
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              LogiVox orchestrates your entire automation estate — AMR fleets, AGVs, cobots,
              cross-belt sorters, conveyors, and AS/RS cranes — from a single WMS-native command
              centre. No middleware. No integration fees. No separate robot control system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8" asChild>
                <Link href="/contact">
                  Book a Robotics Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/roi-calculator">Calculate Your Automation ROI</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-10 bg-violet-600 text-white">
        <div className="container-enterprise">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-violet-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Type Support */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">Device Support</Badge>
            <h2 className="text-3xl font-bold mb-4">Every Automation Device. One Dashboard.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LogiVox natively supports 7 automation device types with purpose-built dispatch logic
              for each. No generic "integration" — genuine operational intelligence per device type.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEVICE_TYPES.map((device) => (
              <Card key={device.type} className="border-violet-100 hover:border-violet-300 hover:shadow-md transition-all">
                <CardContent className="pt-5">
                  <div className="text-3xl mb-3">{device.icon}</div>
                  <div className="font-semibold text-sm text-violet-700">{device.type}</div>
                  <div className="font-bold mt-0.5">{device.label}</div>
                  <p className="text-sm text-muted-foreground mt-1">{device.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AMR Fleet Capabilities */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-300">AMR Fleet Command Centre</Badge>
              <h2 className="text-3xl font-bold mb-4">
                AI Dispatch That Actually Knows{" "}
                <span className="text-teal-600">Which Robot to Send</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Legacy WMS systems treat robots as dumb conveyor belts — they queue tasks with no
                awareness of who should execute them. LogiVox analyses battery level, device type,
                current floor location, and task urgency to match every queued task to the optimal
                available device automatically.
              </p>
              <div className="space-y-4">
                {AMR_CAPABILITIES.map((cap) => (
                  <div key={cap.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <cap.icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{cap.title}</div>
                      <p className="text-sm text-muted-foreground mt-0.5">{cap.description}</p>
                      <div className="text-xs text-teal-700 font-medium mt-1">→ {cap.metric}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-violet-50 dark:from-teal-950/20 dark:to-violet-950/20 rounded-2xl p-8 border border-teal-100">
              <div className="space-y-3">
                <div className="font-bold text-lg mb-4">Fleet Command Centre — Live View</div>
                {[
                  { name: "AMR-04", type: "AMR 🤖", battery: 87, util: 91, status: "ACTIVE", task: "Putaway Zone B" },
                  { name: "AGV-01", type: "AGV 🚗", battery: 62, util: 55, status: "IDLE", task: "Awaiting dispatch" },
                  { name: "COBOT-02", type: "Cobot 🦾", battery: 100, util: 78, status: "ACTIVE", task: "Pick Station 3" },
                  { name: "AMR-07", type: "AMR 🤖", battery: 23, util: 12, status: "CHARGING", task: "Dock Alpha-1" },
                ].map((device) => (
                  <div key={device.name} className={`rounded-lg border p-3 ${device.status === "ACTIVE" ? "bg-green-50 border-green-200" : device.status === "CHARGING" ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{device.name} <span className="text-gray-400">· {device.type}</span></span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${device.status === "ACTIVE" ? "bg-green-200 text-green-800" : device.status === "CHARGING" ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"}`}>{device.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 w-14">Battery</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                        <div className={`h-1.5 rounded-full ${device.battery < 30 ? "bg-red-400" : device.battery < 60 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${device.battery}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{device.battery}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-14">Util</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-1.5 rounded-full bg-violet-400" style={{ width: `${device.util}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{device.util}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">📍 {device.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sortation Capabilities */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-950/10 rounded-2xl p-8 border border-teal-100 order-2 lg:order-1">
              <div className="font-bold text-lg mb-4">Sortation Throughput — Last 8 Hours</div>
              <div className="space-y-2 mb-4">
                {[
                  { hour: "07:00", items: 120, pct: 23 },
                  { hour: "08:00", items: 210, pct: 40 },
                  { hour: "09:00", items: 340, pct: 65 },
                  { hour: "10:00", items: 480, pct: 91 },
                  { hour: "11:00", items: 520, pct: 100 },
                  { hour: "12:00", items: 460, pct: 88 },
                  { hour: "13:00", items: 390, pct: 75 },
                  { hour: "14:00", items: 290, pct: 55 },
                ].map((row) => (
                  <div key={row.hour} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-10">{row.hour}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded relative">
                      <div className="h-5 rounded bg-teal-500 flex items-center justify-end pr-1.5" style={{ width: `${row.pct}%` }}>
                        <span className="text-[10px] text-white font-bold">{row.items}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { device: "Sorter A01", rate: "98%", status: "ACTIVE", color: "green" },
                  { device: "Conveyor-1", rate: "99%", status: "ACTIVE", color: "green" },
                  { device: "AS/RS Cr-1", rate: "100%", status: "IDLE", color: "yellow" },
                ].map((row) => (
                  <div key={row.device} className={`bg-${row.color}-50 border border-${row.color}-200 rounded p-2 text-center`}>
                    <div className="text-xs font-medium truncate">{row.device}</div>
                    <div className={`text-sm font-bold text-${row.color}-700`}>{row.rate}</div>
                    <div className={`text-[10px] text-${row.color}-600`}>{row.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-violet-100 text-violet-800 border-violet-300">Sortation &amp; Conveyor Control</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Know Your Sortation Success Rate{" "}
                <span className="text-violet-600">Right Now, Not Tomorrow</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Cross-belt sorters, conveyors, and AS/RS cranes are the arteries of a high-volume
                warehouse. When they underperform, every downstream process suffers. LogiVox gives
                supervisors instant visibility into throughput, per-device success rates, and cycle
                times — so you identify problems in seconds, not shift reports.
              </p>
              <div className="space-y-4">
                {SORTATION_CAPABILITIES.map((cap) => (
                  <div key={cap.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <cap.icon className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{cap.title}</div>
                      <p className="text-sm text-muted-foreground mt-0.5">{cap.description}</p>
                      <div className="text-xs text-violet-700 font-medium mt-1">→ {cap.metric}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why not competitors */}
      <section className="py-20 bg-red-50/50 dark:bg-red-950/10">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-100 text-red-800 border-red-300">Competitive Gap</Badge>
            <h2 className="text-3xl font-bold mb-4">Why Legacy WMS Fails at Robotics</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Traditional warehouse systems were designed before warehouse robots existed at scale.
              Here is what your competitors charge for the equivalent functionality.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {COMPETITOR_GAPS.map((item) => (
              <Card key={item.competitor} className="border-red-200">
                <CardContent className="pt-4">
                  <div className="font-bold text-red-800 mb-1">{item.competitor}</div>
                  <p className="text-sm text-muted-foreground">{item.gap}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-lg font-semibold">
              LogiVox includes native robotics integration in{" "}
              <span className="text-violet-600">every plan</span> — no add-ons, no middleware.
            </p>
          </div>
        </div>
      </section>

      {/* Features Checklist */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">Complete Feature Set</Badge>
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Run a Lights-Out Warehouse</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {[
              "AI task-to-device matching (type + battery + location)",
              "Real-time battery level tracking with low-battery alerts",
              "Manual override dispatch for any idle device",
              "Full task history per device for audits",
              "Per-device utilisation % with progress bars",
              "8-hour throughput AreaChart with average reference line",
              "Per-sortation-device success rate (with red alert if <95%)",
              "Live activity feed (completed / failed / in-progress)",
              "AS/RS crane integration with task and success tracking",
              "Conveyor induction line monitoring",
              "Cross-belt and shoe sorter performance dashboards",
              "Multi-shift analytics with peak throughput identification",
              "Maintenance status tracking with last-maintenance date",
              "Cobot packing station monitoring",
              "AGV heavy-haul route tracking",
              "Zero middleware — WMS-native REST API integration",
              "Supports MQTT and webhook-based device telemetry",
              "Role-based access (operators see their fleet only)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-green-100 text-green-800 border-green-300">ROI Evidence</Badge>
              <h2 className="text-3xl font-bold mb-4">The Numbers Your CFO Cares About</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  headline: "4× Throughput",
                  subline: "vs. manual dispatch",
                  detail: "Removing human bottlenecks from robot task assignment delivers immediate throughput gains — without adding headcount.",
                  icon: TrendingUp,
                  color: "violet",
                },
                {
                  headline: "95%+ Accuracy",
                  subline: "sortation success rate",
                  detail: "Per-device success rate monitoring catches underperforming sorters before they generate exceptions, chargebacks, or returns.",
                  icon: Zap,
                  color: "teal",
                },
                {
                  headline: "30-Day Onboarding",
                  subline: "average fleet integration time",
                  detail: "REST API and webhook integrations mean most robot vendors are live in a single sprint — no 18-month implementation project.",
                  icon: Clock,
                  color: "green",
                },
              ].map((item) => (
                <Card key={item.headline} className={`border-${item.color}-200 bg-${item.color}-50/50 dark:bg-${item.color}-950/10`}>
                  <CardHeader>
                    <item.icon className={`h-8 w-8 text-${item.color}-600 mb-2`} />
                    <CardTitle className={`text-2xl text-${item.color}-700`}>{item.headline}</CardTitle>
                    <p className={`text-sm font-medium text-${item.color}-600`}>{item.subline}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-teal-600 text-white">
        <div className="container-enterprise text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Orchestrate Your Entire Automation Estate?
          </h2>
          <p className="text-violet-100 max-w-2xl mx-auto text-lg">
            Book a live demo and see AI fleet dispatch, sortation monitoring, and multi-device
            control in action — with your device types and your operational scenarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 px-8 font-semibold" asChild>
              <Link href="/contact">
                Book Robotics Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/solutions/yard-management">
                Explore Yard Management →
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/comparison">
                Compare vs SAP / Manhattan
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </main>
  );
}
