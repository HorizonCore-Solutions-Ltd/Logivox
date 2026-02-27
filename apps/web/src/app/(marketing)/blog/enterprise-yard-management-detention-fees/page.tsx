import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integrated Yard Management: How LogiVox Eliminates Detention Fees for Good",
  description:
    "A deep dive into how LogiVox's live yard map, automated gate check-in, and AI-driven shunter dispatch work together to eliminate truck dwell time and detention charges — with real customer numbers.",
  keywords: [
    "yard management system",
    "detention fee elimination",
    "shunter dispatch software",
    "gate log automation",
    "dock scheduling",
    "truck dwell time",
    "YMS software",
    "yard visibility",
  ],
};

export default function YardManagementBlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-600">Operations · Yard Management</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Integrated Yard Management: How LogiVox Eliminates Detention Fees for Good
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A deep dive into how our live yard map, automated gate check-in, and AI-driven shunter dispatch
            work together to eliminate truck dwell time — with real customer numbers.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
            <span>Published: Feb 27, 2026</span>
            <span>11 min read</span>
            <span>LogiVox Product Team</span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert space-y-8">

          <section className="space-y-3">
            <h2>The Hidden Cost Nobody Talks About</h2>
            <p>
              Detention fees are one of the most avoidable costs in warehouse operations — yet most distribution
              centres pay tens of thousands of dollars in them every month without realising how the charges
              accumulate. A truck that sits in your yard 45 minutes past its contracted window triggers a
              detention clock. Multiply that across 150 daily movements and you have a serious P&amp;L problem.
            </p>
            <p>
              The root cause isn&apos;t carrier inefficiency. It&apos;s the absence of a real-time system that knows
              where every trailer is, what it needs to do next, and who should move it. Most warehouses rely on
              radio calls, whiteboards, and clipboards. LogiVox replaces all of that with a live yard operating
              system — built directly into the WMS.
            </p>
          </section>

          <section className="space-y-3">
            <h2>The Four Pillars of the LogiVox Yard Management System</h2>

            <h3>1. Automated Gate Check-In</h3>
            <p>
              When a driver arrives, the gate agent opens the LogiVox Gate Check-In dialog and enters the vehicle
              number. The system instantly searches open dock appointments for a matching vehicle, auto-populates
              the appointment details, and prompts the agent to confirm security pass/fail and add any notes.
              The entire process takes under 60 seconds — down from the 8-minute average at paper-based gates.
            </p>
            <p>
              Every gate entry creates a timestamped record in the gate log, including: direction (inbound/outbound),
              vehicle type, license plate, trailer number, carrier name, driver phone, security status, and the
              linked appointment number. Supervisors get a complete security audit trail without maintaining a
              separate system.
            </p>

            <h3>2. Live Yard Map</h3>
            <p>
              The instant a vehicle checks in, its parking spot lights up on the yard map — a colour-coded grid
              showing all dock doors (blue), parking spots (grey), and staging areas (purple). Occupied positions
              show carrier name, trailer number, and appointment type. Available positions show green.
            </p>
            <p>
              This is the visibility that eliminates the 10-minute shunter search for a trailer. Supervisors
              see the entire yard from a single screen, updated every 20 seconds. No more &quot;where is the
              Walmart trailer?&quot; radio hunts.
            </p>

            <h3>3. Auto-Generated Shunter Dispatch Tasks</h3>
            <p>
              LogiVox continuously scans checked-in trailers against their appointment windows. When a trailer
              is within one hour of its scheduled dock time and still sitting in parking, a <strong>PULL_TO_DOCK</strong> task
              is automatically created and surfaced to supervisors. When a load-out is complete and the dock
              door needs to be freed, a <strong>SPOT_TRAILER</strong> task sends the driver to move the trailer to parking or
              the exit gate.
            </p>
            <p>
              Tasks approaching their detention window are escalated to URGENT status with a red badge and a
              live countdown timer showing minutes remaining. Supervisors get a header KPI card showing total
              pending tasks vs urgent tasks at all times.
            </p>

            <h3>4. One-Click Dispatch</h3>
            <p>
              Supervisors click &quot;Dispatch&quot; on any shunter task. LogiVox records the assignment, updates the
              trailer&apos;s yard location status, and links the movement to the originating dock appointment.
              No radio call. No paper trail. Complete digital dispatch log for every yard movement.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Customer Impact — Real Numbers</h2>
            <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
              {[
                { metric: "$38K/mo → $1.8K/mo", label: "Detention Costs", note: "High-volume retail DC, 24 dock doors" },
                { metric: "8 min → 45 sec", label: "Gate Check-In Time", note: "3PL facility, multi-tenant yard" },
                { metric: "98.5% OTD", label: "Peak Season OTD", note: "Maintained through 350% volume surge" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{s.metric}</p>
                  <p className="text-sm font-semibold mt-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2>How It Compares to Standalone YMS Solutions</h2>
            <p>
              Traditional yard management systems (Manhattan YMS, C3 Solutions, Yard Management Solutions Inc.)
              are sold as standalone products that require expensive middleware to connect to your WMS. Integration
              projects typically run 3–9 months and $150K–$500K in professional services. And because they
              operate as separate systems, data is always slightly out of sync.
            </p>
            <p>
              LogiVox Yard Management is native. Gate check-ins write directly to the same database as your
              dock appointments, GRNs, and inventory records. There is no middleware. There is no sync delay.
              When a trailer is checked in at the gate, the receiving team sees it immediately. When a load is
              confirmed complete in the WMS, the SPOT_TRAILER task fires automatically.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Who Needs This?</h2>
            <ul>
              <li><strong>Distribution centres with 10+ daily truck movements</strong> — the yard map and gate log alone pay for the Enterprise plan through detention savings.</li>
              <li><strong>3PL operators with multi-tenant yards</strong> — appointment auto-linking and per-entry security records satisfy insurance and liability requirements.</li>
              <li><strong>Retail DCs managing peak season surges</strong> — shunter task auto-generation keeps yard throughput high even when volume triples.</li>
              <li><strong>Operations running two or more shifts</strong> — the shift supervisor coming on at midnight gets the same live yard map view as the day manager without any handover call.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Getting Started</h2>
            <p>
              Yard Management is included in the LogiVox Enterprise plan and goes live during your onboarding
              sprint — typically within the first two weeks. Our onboarding team will configure your yard locations
              (dock doors, parking rows, staging areas), connect your existing carrier list, and train gate agents
              in a single 2-hour session.
            </p>
          </section>
        </div>

        {/* CTA Card */}
        <div className="rounded-2xl border bg-blue-50 border-blue-200 p-6 space-y-3">
          <h3 className="text-xl font-semibold text-blue-900">Stop paying detention fees</h3>
          <p className="text-muted-foreground">
            Book a demo and we&apos;ll show you the live yard map, gate check-in flow, and shunter dispatch in action.
            Most customers see ROI in the first billing cycle.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Book a Demo →
            </Link>
            <Link
              href="/solutions/yard-management"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Yard Management Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
