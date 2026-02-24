import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copilot Over Your SOPs: In-Line Guidance That Teams Trust",
  description:
    "A tenant-aware copilot that surfaces your SOPs and work instructions at the exact moment of work—no more tab hunting.",
};

const sections = [
  {
    heading: "The problem: tribal knowledge and tab-hunting",
    body:
      "Warehouse teams juggle SOP PDFs, tribal notes, and LMS modules. When pressure is on, people guess. A copilot that pulls the right step from your own SOPs—in the flow of work—cuts errors and training time.",
  },
  {
    heading: "What tenant-aware copilot means",
    list: [
      "Uses only your organization’s SOPs, work instructions, and configs",
      "Context-aware: tenant, warehouse, role, task type (pick, pack, replenish)",
      "Inline delivery: shows guidance inside the page the user is on, not a separate tab",
      "Citations and links back to the source SOP so trust stays high",
    ],
  },
  {
    heading: "How we build it in LogiVox",
    list: [
      "Secure doc ingestion with per-tenant isolation; no cross-tenant bleed",
      "Chunking + RAG tuned for procedures (steps, cautions, prerequisites)",
      "UI surfaces the most relevant step with a short answer and a link to the source",
      "Auditable: every answer can log the source doc and version for compliance",
    ],
  },
  {
    heading: "Rollout plan",
    list: [
      "Start with 10-20 SOPs for a single process (e.g., high-volume pick paths)",
      "Map triggers to pages: pick confirmation screen, QC fail flow, return grading",
      "Set guardrails: max answer length, mandatory citations, profanity/PII filters",
      "Measure: error rate, time-to-first-pick for new hires, and escalation volume",
    ],
  },
  {
    heading: "What success looks like",
    list: [
      "New hire productive in days, not weeks",
      "Lower QC fails on complex items because the right caution is inline",
      "Supervisors see fewer interruptions and clearer audit of guidance used",
    ],
  },
];

export default function BlogCopilotSOPsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">AI & ML</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Copilot Over Your SOPs: In-Line Guidance That Teams Trust
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A tenant-aware copilot that surfaces your SOPs and work instructions at the exact moment of work—no more tab hunting.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Published: Feb 23, 2026</span>
            <span>7 min read</span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2>{section.heading}</h2>
              {section.body && <p>{section.body}</p>}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 space-y-3">
          <h3 className="text-xl font-semibold">Pilot in your warehouse</h3>
          <p className="text-muted-foreground">
            Pick one process, ingest the SOPs, and turn on inline guidance with citations. Track error reduction and ramp time.
          </p>
          <div className="flex gap-3">
            <Link
              href="/services/support"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Talk to support
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
            >
              Implementation guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
