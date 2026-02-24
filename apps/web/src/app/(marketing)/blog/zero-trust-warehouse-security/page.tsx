import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zero-Trust Everywhere: Scopes, Audits, and Reliable Webhooks",
  description:
    "Per-warehouse scopes, audit streaming, and resilient webhooks with retries and dead letters for modern WMS security.",
};

const sections = [
  {
    heading: "Zero-trust for warehouse systems",
    body: "A modern WMS touches carriers, ERPs, e-commerce, and IoT. Each integration is an attack surface. Zero-trust means least privilege per warehouse, per integration, with auditable actions and reliable event delivery.",
  },
  {
    heading: "Scope everything",
    list: [
      "Per-warehouse access scopes so clients and 3PL tenants only see their data",
      "Per-integration keys with narrow permissions (read-only vs. mutation)",
      "Role-based UI controls to keep sensitive actions locked down",
    ],
  },
  {
    heading: "Make audits first-class",
    list: [
      "Stream audit events to your SIEM (login, config changes, integration secrets)",
      "Retention policies that satisfy SOC2/ISO but keep noise manageable",
      "Human-friendly audit views for supervisors to spot risky changes",
    ],
  },
  {
    heading: "Webhooks that don’t fall over",
    list: [
      "HMAC signing with rotation to prove integrity",
      "Retries with backoff plus dead-letter queues for failed deliveries",
      "Per-webhook delivery logs so teams can see payload, status, and latency",
      "Circuit-breakers and alerting when targets 4xx/5xx or timeout",
    ],
  },
  {
    heading: "How to adopt in LogiVox",
    list: [
      "Define scopes for warehouses and integrations; assign roles to users",
      "Enable webhook signing and review delivery logs for your endpoints",
      "Wire audit streaming to your SIEM and set retention",
      "Test retries and DLQs in a sandbox tenant before production",
    ],
  },
];

export default function BlogZeroTrustSecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">Security</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Zero-Trust Everywhere: Scopes, Audits, and Reliable Webhooks
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Per-warehouse scopes, audit streaming, and resilient webhooks with
            retries and dead letters for modern WMS security.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Published: Feb 23, 2026</span>
            <span>10 min read</span>
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
          <h3 className="text-xl font-semibold">Lock it down</h3>
          <p className="text-muted-foreground">
            Define scopes, enable signing, and review delivery logs. Stream
            audits to your SIEM. Test retries and DLQs before you go live.
          </p>
          <div className="flex gap-3">
            <Link
              href="/services/support"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Talk to security
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
