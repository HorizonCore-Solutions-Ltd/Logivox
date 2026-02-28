import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "The Complete IoT & Automation Playbook: Sensors, Sortation, and Smart Warehousing | LogiVox",
  description:
    "How environmental sensors, RFID portals, cross-belt sorters, and AS/RS cranes connect to form a self-monitoring, self-optimising warehouse — and how LogiVox ties it all together into one platform.",
  keywords: [
    "IoT warehouse management",
    "smart warehouse automation",
    "sortation system software",
    "AS RS crane management",
    "cross belt sorter WMS",
    "warehouse environmental monitoring",
    "RFID portal integration",
    "conveyor management system",
    "warehouse IoT sensors",
    "automated warehouse 2026",
    "cold chain compliance software",
    "warehouse sensor telemetry",
  ],
};

const stats = [
  {
    value: "99.3%",
    label: "Sortation success rate",
    note: "Across CONVEYOR, SORTER & AS/RS",
  },
  {
    value: "100%",
    label: "Cold-chain audit pass rate",
    note: "Automated compliance reports",
  },
  {
    value: "8-hr",
    label: "Live throughput history",
    note: "AreaChart with average reference",
  },
  {
    value: "< 30s",
    label: "IoT breach to alert",
    note: "Threshold crossed → toast notification",
  },
];

const layers = [
  {
    color: "bg-teal-50 border-teal-200",
    badge: "bg-teal-100 text-teal-800",
    icon: "🌡️",
    title: "Environmental Sensors",
    subtitle: "Temperature · Humidity · Cold-chain compliance",
    body: "Temperature and humidity sensors report readings every minute. LogiVox stores each reading against the device, timestamps it, and compares it to your configured min/max thresholds. The moment a threshold is crossed, a real-time alert fires to supervisors — before product spoils. The Environmental Monitoring dashboard shows a live LineChart per sensor with reference lines at your exact threshold values so operators can see not just that a breach occurred, but how far and for how long.",
    metrics: [
      "Compliance status per sensor (Compliant / Warning / Breach)",
      "Overall facility compliance % with trend",
      "Sensor-by-sensor threshold breach history",
      "Automated compliance reports for audits",
    ],
  },
  {
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    icon: "📡",
    title: "RFID Portal Integration",
    subtitle: "Reader health · Scan rates · Inventory accuracy",
    body: "Every RFID portal reports its operational status, scan rate per hour, and a live feed of recent tag reads to the LogiVox RFID Portal dashboard. Supervisors see per-reader cards showing online/offline status, hourly scan count, and network health score. The scan feed table shows each tag ID, time of scan, and associated item — so inventory updates happen automatically as goods pass through portals, not at the end of a manual count.",
    metrics: [
      "Per-reader status (Online / Offline / Degraded)",
      "Scan rate/hr with 8-point hourly trend chart",
      "Network health % per reader",
      "Live tag scan feed with item linkage",
    ],
  },
  {
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    icon: "⚖️",
    title: "Weight & Scale Telemetry",
    subtitle: "Pass/fail rates · Variance tracking · Discrepancy alerts",
    body: "Weight stations report every verification event to LogiVox — expected weight, actual weight, variance, and pass/fail result. The Weight/Scale Telemetry dashboard shows pass/fail rates per scale as stacked bar charts and a facility-wide PieChart. The live verification feed table shows every event with the expected vs actual weight and the variance amount. Stations with falling pass rates trigger visual alerts before shipments leave — catching overages, shortages, and packaging errors at the point of dispatch.",
    metrics: [
      "Pass/fail rate per scale with progress bar",
      "Facility-wide PieChart of verification outcomes",
      "Live event feed: expected vs actual weight + variance",
      "Alert when station pass rate drops below threshold",
    ],
  },
];

const sortationSystems = [
  {
    icon: "⚙️",
    type: "CONVEYOR",
    name: "Conveyor Lines",
    desc: "Inbound and outbound conveyor lines are monitored for utilisation %, items processed per hour, and success rate. Any deviation from target throughput surfaces in the sortation dashboard within 15 seconds.",
  },
  {
    icon: "🔀",
    type: "SORTER",
    name: "Cross-Belt / Shoe Sorters",
    desc: "Every sort decision is tracked. The sortation system logs task type (SORT / RE-SORT / EXCEPTION), outcome, and which sorter lane processed the item. Success rate below 97% triggers a yellow flag on the device card.",
  },
  {
    icon: "🏗️",
    type: "AS/RS",
    name: "AS/RS Cranes",
    desc: "Automated storage and retrieval cranes for high-bay racks. LogiVox tracks STORE and RETRIEVE tasks, cycle times, and last maintenance date. A crane in MAINTENANCE status shows an orange card alert to supervisors immediately.",
  },
];

export default function IoTAutomationSortationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-12">
        {/* Header */}
        <div className="space-y-5">
          <p className="text-sm font-semibold text-teal-600">
            Technology · IoT · Automation
          </p>
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            The Complete IoT &amp; Automation Playbook: Sensors, Sortation, and
            Smart Warehousing
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            How environmental sensors, RFID portals, cross-belt sorters, and
            AS/RS cranes connect to form a self-monitoring, self-optimising
            warehouse — and how LogiVox ties it all together in one platform
            with no middleware required.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
            <span>Published: Feb 27, 2026</span>
            <span>13 min read</span>
            <span>LogiVox Platform Team</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 not-prose">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border bg-teal-50 border-teal-200 p-4 text-center"
            >
              <p className="text-2xl font-bold text-teal-700">{s.value}</p>
              <p className="text-sm font-semibold mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-10">
          {/* Intro */}
          <section className="space-y-3">
            <h2>Two Problems That Look Separate But Aren&apos;t</h2>
            <p>
              Most warehouses approach IoT and automation as two separate
              infrastructure investments. Sensor data goes into one system.
              Robot and conveyor data goes into another. WMS data stays in a
              third. The result is a fragmented operations picture where
              supervisors spend their shift reconciling information across tabs
              instead of acting on it.
            </p>
            <p>
              LogiVox treats every sensor reading, every robot task, every
              conveyor throughput number, and every inventory movement as events
              in the same platform. There&apos;s no middleware synchronising
              three systems. There&apos;s no ETL pipeline with a 15-minute lag.
              When a cold room temperature sensor breaches threshold, the same
              system that&apos;s tracking the inventory inside that cold room
              fires the alert — and links the affected stock automatically.
            </p>
          </section>

          {/* IoT Sensor Layers */}
          <section className="space-y-6">
            <h2>The Three IoT Sensor Layers in LogiVox</h2>
            <div className="not-prose space-y-5">
              {layers.map((layer, i) => (
                <div key={i} className={`rounded-xl border p-5 ${layer.color}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl mt-0.5">{layer.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base">{layer.title}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${layer.badge}`}
                        >
                          {layer.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {layer.body}
                  </p>
                  <ul className="space-y-1">
                    {layer.metrics.map((m, mi) => (
                      <li key={mi} className="text-sm flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Sortation Systems */}
          <section className="space-y-4">
            <h2>The Sortation &amp; Conveyor Control Module</h2>
            <p>
              While IoT sensors monitor the environment, sortation systems move
              the product. LogiVox&apos;s Sortation &amp; Conveyor Control
              module provides real-time visibility across every mechanical
              system in the facility — conveyor lines, cross-belt and shoe
              sorters, and AS/RS cranes — in a single dashboard.
            </p>
            <div className="not-prose grid md:grid-cols-3 gap-4 my-4">
              {sortationSystems.map((s, i) => (
                <div key={i} className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Throughput Chart */}
          <section className="space-y-3">
            <h2>The 8-Hour Throughput View</h2>
            <p>
              The Sortation dashboard&apos;s headline chart is an 8-hour
              AreaChart showing items processed per hour across all sortation
              systems — conveyor lines, sorters, and AS/RS cranes combined. A
              dashed reference line shows the average throughput for the window
              so operators can instantly see which hours ran above or below
              target.
            </p>
            <p>
              Below the chart, each device gets its own card. The card shows
              current status (ACTIVE / IDLE / MAINTENANCE), utilisation % with a
              progress bar, items processed today, and success rate. Any device
              with a success rate below 97% shows a yellow warning flag — before
              it becomes a problem. A per-device horizontal bar chart
              colour-codes performance: teal for ≥98% success, amber for 95–98%,
              red for below 95%.
            </p>
          </section>

          {/* Live Activity Feed */}
          <section className="space-y-3">
            <h2>Live Activity Feed: Every Sortation Event in Real Time</h2>
            <p>
              The sortation Activity Feed shows individual task events as they
              complete — SORT, CONVEY, RETRIEVE, STORE — with a device name,
              outcome icon (green check for COMPLETED, red X for FAILED, pulse
              dot for IN_PROGRESS), and a &quot;time ago&quot; timestamp updated
              every 15 seconds. Failed tasks surface immediately in red, making
              exception handling proactive rather than discovered during
              end-of-shift audits.
            </p>
          </section>

          {/* Integration Architecture */}
          <section className="space-y-3">
            <h2>How Everything Connects: One Event Bus, Not Three Systems</h2>
            <p>
              LogiVox uses a unified event model. An IoT sensor reading, a robot
              task completion, and a conveyor sort event are all stored in the
              same database with the same timestamp precision. This means:
            </p>
            <ul>
              <li>
                <strong>Causal correlation</strong> — when a conveyor sort fails
                40 minutes after a temperature sensor drifts out of range,
                LogiVox can surface both events in the same timeline.
              </li>
              <li>
                <strong>No sync lag</strong> — unlike standalone IoT platforms
                with 5–15 minute API polling, LogiVox sensor ingestion is
                real-time at the database layer.
              </li>
              <li>
                <strong>Single audit trail</strong> — compliance reports pull
                from one source of truth. There&apos;s no reconciliation step
                before a cold-chain audit.
              </li>
              <li>
                <strong>Inventory linkage</strong> — a breach event
                automatically flags the inventory records for stock located in
                the affected zone, enabling immediate quarantine decisions
                without a manual investigation.
              </li>
            </ul>
          </section>

          {/* Comparison */}
          <section className="space-y-3">
            <h2>What This Replaces</h2>
            <div className="not-prose overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left p-3 border font-semibold">
                      Capability
                    </th>
                    <th className="text-center p-3 border font-semibold">
                      Standalone IoT + WMS + YMS
                    </th>
                    <th className="text-center p-3 border font-semibold text-teal-700">
                      LogiVox
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Sensor breach to alert",
                      "5–15 min (API polling)",
                      "< 30 seconds",
                    ],
                    [
                      "Sortation data in WMS",
                      "Manual export or ETL",
                      "Native, real-time",
                    ],
                    [
                      "Cold chain audit report",
                      "Manual reconciliation from 3 systems",
                      "One-click auto-generated",
                    ],
                    [
                      "Robot task ↔ inventory link",
                      "Not connected",
                      "Native event link",
                    ],
                    [
                      "Time to integrate",
                      "3–9 months, $150K+",
                      "Included in Enterprise onboarding",
                    ],
                    [
                      "Platforms to train teams on",
                      "3–5 separate apps",
                      "One platform",
                    ],
                  ].map(([cap, old, logivox], i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}
                    >
                      <td className="p-3 border font-medium">{cap}</td>
                      <td className="p-3 border text-center text-red-600">
                        {old}
                      </td>
                      <td className="p-3 border text-center text-teal-700 font-semibold">
                        {logivox}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Who Needs This */}
          <section className="space-y-3">
            <h2>Who Benefits Most</h2>
            <ul>
              <li>
                <strong>Cold storage &amp; pharma DCs</strong> — temperature and
                humidity compliance is non-negotiable. LogiVox gives you a
                real-time dashboard and automatic audit reports without a
                separate cold-chain compliance platform.
              </li>
              <li>
                <strong>High-volume ecom fulfilment</strong> — cross-belt
                sorters processing 400+ items/hour need real-time success rate
                visibility. LogiVox flags degrading sorter performance before
                mis-sorts accumulate into returns.
              </li>
              <li>
                <strong>3PL operators with multi-tenant facilities</strong> —
                RFID portal data and weight verification logs are per-tenant,
                enabling SLA reporting per customer from a single dashboard.
              </li>
              <li>
                <strong>Automated DCs with mixed fleets</strong> — combining
                AS/RS crane data, conveyor throughput, and AMR fleet status in
                one interface eliminates the &quot;which app shows what&quot;
                problem for night-shift supervisors.
              </li>
            </ul>
          </section>

          {/* Getting Started */}
          <section className="space-y-3">
            <h2>Getting Started</h2>
            <p>
              All three IoT modules (Environmental, RFID, Weight/Scale) and the
              Sortation &amp; Conveyor Control module are included in the
              LogiVox Enterprise plan. Onboarding configures your sensor device
              list, sets threshold values per device, links RFID reader network
              IDs, and connects weight station MAC addresses — typically in a
              4-hour configuration session.
            </p>
            <p>
              For sortation systems, our integration team connects to your
              conveyor controller or sorter PLC via REST API or MQTT webhook.
              For AS/RS cranes from Dematic, Kardex, Hänel, or AutoStore, we
              provide pre-built connectors that stream task events directly into
              the LogiVox event bus.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border bg-teal-50 border-teal-200 p-6 space-y-3">
          <h3 className="text-xl font-semibold text-teal-900">
            See the full automation platform live
          </h3>
          <p className="text-muted-foreground">
            Book a demo and we&apos;ll walk through the environmental monitoring
            dashboard, RFID portal feed, sortation throughput chart, and AMR
            fleet command center on your use case.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Book a Demo →
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              See All Features
            </Link>
            <Link
              href="/blog/amr-fleet-ai-dispatch-warehouse"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← AMR Fleet Article
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
