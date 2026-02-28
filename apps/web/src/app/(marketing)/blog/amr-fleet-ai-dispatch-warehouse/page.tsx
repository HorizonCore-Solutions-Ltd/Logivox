import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Robots in the Warehouse: Inside Our AMR Fleet Orchestration & AI Dispatch",
  description:
    "How LogiVox matches queued tasks to the best available robot using battery level, device type, and real-time location — and why that matters for warehouse throughput at scale.",
  keywords: [
    "AMR fleet management software",
    "warehouse robotics platform",
    "autonomous mobile robot WMS",
    "AGV warehouse integration",
    "AI robot dispatch",
    "sortation system software",
    "conveyor management",
    "AS RS crane management",
    "cobot warehouse",
    "warehouse automation 2026",
  ],
};

export default function AMRFleetBlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-violet-600">
            AI & ML · Robotics
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Robots in the Warehouse: Inside Our AMR Fleet Orchestration & AI
            Dispatch
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            How LogiVox matches queued tasks to the best available robot using
            battery level, device type, and real-time location — and why that
            matters for throughput at scale.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
            <span>Published: Feb 27, 2026</span>
            <span>9 min read</span>
            <span>LogiVox Engineering</span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-8">
          <section className="space-y-3">
            <h2>Why Robotic Fleet Management Is Still Mostly Broken</h2>
            <p>
              Most warehouses that have invested in AMRs, AGVs, or cobots are
              managing them through vendor-specific apps that don&apos;t talk to
              the WMS. A picker finishes a wave, the AMR fleet dashboard shows
              the next available robot, but there&apos;s no connection between
              the two systems. Task assignment still happens via a supervisor
              looking at two screens and making a judgement call.
            </p>
            <p>
              LogiVox solves this by treating robots as first-class citizens in
              the same system as your picking waves, inventory, and labor
              management. Tasks flow from WMS operations directly to robot
              queues. Dispatch suggestions are generated automatically. And
              supervisors can override or manually assign at any time from a
              single interface.
            </p>
          </section>

          <section className="space-y-3">
            <h2>The Four Device Types LogiVox Manages</h2>
            <div className="not-prose grid md:grid-cols-2 gap-4 my-4">
              {[
                {
                  icon: "🤖",
                  label: "AMR (Autonomous Mobile Robot)",
                  desc: "Self-navigating robots for pick-and-place, tote transport, and replenishment tasks. LogiVox tracks battery level, current aisle location, and utilisation % in real-time.",
                },
                {
                  icon: "🚗",
                  label: "AGV (Automated Guided Vehicle)",
                  desc: "Fixed-path vehicles for pallet transport between staging and storage. Task assignment and route confirmation handled through the fleet API.",
                },
                {
                  icon: "🦾",
                  label: "Cobot (Collaborative Robot)",
                  desc: "Human-robot packing station assistants. LogiVox tracks utilisation across each packing station and alerts when a cobot needs maintenance intervention.",
                },
                {
                  icon: "🦿",
                  label: "Robot Arm",
                  desc: "Fixed-station arms for quality inspection, depalletising, and high-speed sortation. Success rate tracking per arm with maintenance scheduling built in.",
                },
              ].map((d, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-muted/40 p-4 flex gap-3"
                >
                  <span className="text-2xl mt-0.5">{d.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{d.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {d.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2>How AI Dispatch Works</h2>
            <p>
              When a task enters the queue with status QUEUED, the LogiVox fleet
              engine evaluates all IDLE devices against three criteria:
            </p>
            <ol>
              <li>
                <strong>Device type match</strong> — an AMR pick-and-carry task
                should never be sent to a COBOT arm.
              </li>
              <li>
                <strong>Battery sufficiency</strong> — devices below 20% battery
                are excluded from dispatch suggestions. Devices below 10% are
                flagged for immediate charging regardless of queue pressure.
              </li>
              <li>
                <strong>Utilisation headroom</strong> — devices consistently
                running above 90% utilisation are de-prioritised in dispatch to
                prevent premature maintenance triggers.
              </li>
            </ol>
            <p>
              The result is a ranked list of dispatch suggestions — not just
              &quot;assign to the next available robot&quot; but &quot;assign to
              the AMR with the best combination of battery, utilisation
              headroom, and task-type compatibility.&quot; Supervisors see this
              list in the AI Dispatch Suggestions tab and can accept any
              recommendation with one click, or override with a manual
              assignment.
            </p>
          </section>

          <section className="space-y-3">
            <h2>The Fleet Status Grid</h2>
            <p>
              Every device in the fleet appears as a card in the Fleet Status
              Grid. Each card shows:
            </p>
            <ul>
              <li>Device type icon + name</li>
              <li>
                Current status badge (Active green / Idle grey / Charging yellow
                / Maintenance orange)
              </li>
              <li>
                Battery level with a colour-coded progress bar and icon (full /
                medium / low / warning / charging)
              </li>
              <li>Utilisation % for the current shift</li>
              <li>Current location and tasks completed today</li>
            </ul>
            <p>
              IDLE devices show a &quot;Dispatch Task&quot; button that opens a
              manual assignment dialog. Supervisors can specify task type,
              source location, destination, and priority level (1–10). This
              covers the edge cases where the automatic suggestion engine
              doesn&apos;t have a queued task ready but a supervisor wants to
              proactively position a robot.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Analytics: Seeing Fleet Performance Over Time</h2>
            <p>
              The Analytics tab in the Fleet Command Center shows a horizontal
              bar chart of tasks completed per device, colour-coded by
              utilisation tier:
            </p>
            <ul>
              <li>
                <strong>Violet (≥80% utilisation)</strong> — high performers,
                check maintenance schedule
              </li>
              <li>
                <strong>Light violet (50–80%)</strong> — balanced, target
                operating zone
              </li>
              <li>
                <strong>Grey (&lt;50%)</strong> — underutilised, review task
                routing or charging cycles
              </li>
            </ul>
            <p>
              This makes it immediately obvious which robots are being
              overworked and which are sitting idle too often — without building
              a separate BI dashboard or running SQL queries.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Sortation Systems: The Other Half of the Automation Story</h2>
            <p>
              AMRs and AGVs handle horizontal movement. Sortation systems —
              cross-belt sorters, conveyors, and AS/RS cranes — handle vertical
              throughput and high-speed routing. LogiVox manages both through
              the Sortation & Conveyor Control module.
            </p>
            <p>
              The sortation dashboard tracks items processed per hour across all
              systems with an 8-hour area chart, an average throughput reference
              line, and per-device success rates. Any device with a success rate
              below 97% is automatically flagged in yellow. Maintenance-status
              devices show an orange card. The live Activity Feed shows every
              individual task event (SORT, CONVEY, RETRIEVE, STORE) as it
              completes — with a timestamp, device name, and pass/fail
              indicator.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Getting Robots Into LogiVox</h2>
            <p>
              LogiVox connects to robotic systems via the Automation Devices
              API. Each device is registered with a device type (AMR / AGV /
              COBOT / ROBOT_ARM / CONVEYOR / SORTER / AS_RS), a home location,
              and its initial status. From that point, the fleet engine polls
              device status every 15 seconds and dispatches tasks automatically
              as they enter the queue.
            </p>
            <p>
              For warehouses using best-of-breed robotics (Locus, 6 River,
              Geek+, Fetch, AutoStore), our integration team configures REST
              webhooks from the vendor&apos;s fleet management API to the
              LogiVox device control endpoint, so status updates (task complete,
              battery level, fault codes) flow back automatically.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border bg-violet-50 border-violet-200 p-6 space-y-3">
          <h3 className="text-xl font-semibold text-violet-900">
            See the Fleet Command Center in action
          </h3>
          <p className="text-muted-foreground">
            Book a demo and we&apos;ll walk through AI dispatch suggestions,
            battery monitoring, and sortation throughput tracking live on your
            data.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Book a Demo →
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
            >
              See All Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
