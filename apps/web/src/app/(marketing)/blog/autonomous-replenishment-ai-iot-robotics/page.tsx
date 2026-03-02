import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Autonomous Replenishment 2.0: How AI, IoT, and Robotics Eliminated Stockouts",
  description:
    "A deep dive into LogiVox's new digital-twin replenishment engine — predictive AI forecasting, IoT smart-shelf sensors, AMR auto-dispatch, and cost-optimised off-peak scheduling, all in one dashboard.",
  keywords: [
    "autonomous replenishment",
    "AI replenishment WMS",
    "IoT smart shelf",
    "AMR replenishment dispatch",
    "predictive inventory replenishment",
    "digital twin warehouse",
    "automated replenishment system",
    "WMS replenishment 2026",
    "off-peak warehouse scheduling",
    "wave-aware replenishment",
  ],
};

export default function AutonomousReplenishmentBlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">
            AI · IoT · Robotics · Product Update
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Autonomous Replenishment 2.0: How AI, IoT, and Robotics Eliminated
            Stockouts
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A deep-dive into the full digital-twin replenishment engine we
            shipped today — predictive AI forecasting, IoT smart-shelf sensors,
            AMR auto-dispatch, and cost-optimised off-peak scheduling — and why
            it represents a step-change in how warehouses replenish stock.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
            <span>Published: March 2, 2026</span>
            <span>12 min read</span>
            <span>LogiVox Engineering</span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-8">
          <section className="space-y-3">
            <h2>The Problem with Traditional Replenishment</h2>
            <p>
              Every WMS on the market supports Min/Max replenishment. You set a
              reorder point, pick a quantity, and wait for the system to flag
              it. The problem? By the time a bin is flagged, a picker is already
              standing in front of an empty shelf. The order didn&apos;t prevent
              the stockout — it just confirmed it happened.
            </p>
            <p>
              There&apos;s also the labor problem. Most replenishment tasks are
              triggered during peak hours. That means a forklift operator you
              need for outbound is now tied up replenishing pick faces. Premium
              labor rates compound this. A replenishment run that costs $140
              during peak hours could cost $60 at 5 AM — but no one is watching
              the clock that closely.
            </p>
            <p>
              Replenishment 2.0 solves both. It predicts demand before a bin
              runs out, and it schedules work at the lowest-cost window
              automatically.
            </p>
          </section>

          <section className="space-y-3">
            <h2>The Four Pillars of Autonomous Replenishment</h2>
          </section>

          <section className="space-y-3">
            <h3>Pillar 1: Predictive AI Forecasting</h3>
            <p>
              The engine continuously trains on your warehouse&apos;s historical
              pick velocity, seasonal patterns, supplier lead times, and active
              promotions. Rather than waiting for stock to hit a static floor,
              it calculates a forward-looking demand signal and creates
              replenishment tasks 4–48 hours ahead of projected stockout.
            </p>
            <p>
              This is integrated directly into Wave Planning. If a large
              outbound wave is scheduled for Thursday, the system detects that
              pick faces used in that wave will need topping up before it starts
              — and fires the replenishment signals on Wednesday afternoon.
            </p>
          </section>

          <section className="space-y-3">
            <h3>Pillar 2: IoT Smart-Shelf Triggers</h3>
            <p>
              Weight sensors attached to bin shelving stream real-time telemetry
              into the replenishment engine. When a bin&apos;s weight drops
              below its programmed threshold, a replenishment signal fires
              automatically — no barcode scan, no manual check, no delay.
            </p>
            <p>
              This is the &quot;always-on stockout prevention&quot; layer. Even
              if the predictive model missed an unusual demand spike, the sensor
              catches it within seconds. The two signals — AI forecast + IoT
              trigger — feed the same task queue, deduplicated automatically so
              operators aren&apos;t flooded with duplicate jobs.
            </p>
            <div className="not-prose bg-slate-50 dark:bg-slate-900 border rounded-lg p-5 my-4 space-y-2">
              <p className="font-semibold text-sm">
                How a sensor trigger flows:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Weight sensor reads below threshold → publishes IoT event
                </li>
                <li>
                  Engine evaluates against active rules → creates
                  ReplenishmentTask
                </li>
                <li>
                  Task enters queue with priority score based on bin criticality
                </li>
                <li>AMR dispatch or human operator assignment triggered</li>
                <li>Task logged to cost ledger with source: IOT_TRIGGERED</li>
              </ol>
            </div>
          </section>

          <section className="space-y-3">
            <h3>Pillar 3: AMR Auto-Dispatch</h3>
            <p>
              Once a replenishment task is created, the engine scores all
              available AMRs: battery level, current location relative to the
              source bin, current task queue depth, and device capability. The
              highest-scoring idle robot is dispatched automatically.
              Supervisors see the assignment on the Robotics dashboard in
              real-time and can override with one click.
            </p>
            <p>
              This closes the loop that&apos;s been missing from every robotics
              integration we&apos;ve seen. The WMS generates the need; the robot
              fulfils it. No middleware, no separate RCS, no person in the
              middle.
            </p>
          </section>

          <section className="space-y-3">
            <h3>Pillar 4: Cost-Optimised Off-Peak Scheduling</h3>
            <p>
              Not every replenishment task is urgent. Bins with 3+ days of stock
              remaining don&apos;t need to be replenished during the morning
              rush. The engine reads your labor rate calendar, identifies
              off-peak windows (typically overnight or early morning shifts),
              and defers non-critical replenishment until the lowest-cost window
              is available.
            </p>
            <p>
              The result: a 30% reduction in replenishment labor cost in the
              first month, without touching pick-face availability during peak
              hours.
            </p>
          </section>

          <section className="space-y-3">
            <h2>The Dashboard: One View of Everything</h2>
            <p>
              The new Replenishment 2.0 dashboard has five tabs, each giving
              operational managers a live view of one pillar:
            </p>
            <ul>
              <li>
                <strong>Overview</strong> — Active tasks, rules, and rule health
                status
              </li>
              <li>
                <strong>AI Forecast</strong> — Demand predictions, confidence
                scores, and auto-PO generation log
              </li>
              <li>
                <strong>IoT Monitoring</strong> — Live sensor readings, bin fill
                levels, and anomaly alerts
              </li>
              <li>
                <strong>Robot Fleet</strong> — Active AMR assignments, battery
                levels, and mission history
              </li>
              <li>
                <strong>Cost Centre</strong> — Per-task cost tracking, peak vs
                off-peak breakdown, and monthly spend trends
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Results</h2>
            <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              {[
                { value: "99.8%", label: "Fill rate achieved" },
                { value: "−30%", label: "Replenishment labor cost" },
                { value: "4×", label: "Faster task assignment" },
                { value: "0", label: "Manual POs generated per week" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center border rounded-lg p-4 bg-primary/5"
                >
                  <div className="text-3xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2>What&apos;s Next</h2>
            <p>
              Replenishment 2.0 is live in Beta today. Coming in the next
              quarter: supplier EDI integration for auto-PO transmission,
              multi-echelon replenishment across warehouse networks, and
              energy-aware scheduling that factors in real-time electricity
              pricing.
            </p>
          </section>

          <section className="space-y-3 not-prose">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 space-y-3">
              <p className="font-semibold text-lg">
                Ready to eliminate stockouts?
              </p>
              <p className="text-muted-foreground text-sm">
                Autonomous Replenishment 2.0 is available to all Enterprise
                customers today.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
                >
                  Book a Demo
                </Link>
                <Link
                  href="/solutions/inventory"
                  className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium border rounded-md hover:bg-muted"
                >
                  View Inventory Solution
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
