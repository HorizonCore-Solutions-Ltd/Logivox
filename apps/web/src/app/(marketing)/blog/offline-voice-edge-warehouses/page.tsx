import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline Voice at the Edge: Keep Picking When Wi-Fi Drops",
  description:
    "Designing resilient voice + scanning that work on the floor without network, with smart sync when you’re back online.",
};

const sections = [
  {
    heading: "Why offline voice matters",
    body:
      "Warehouses are noisy RF environments. If Wi‑Fi blinks during a pick, workers shouldn’t stall. Offline-capable voice and scanning keep teams moving and sync when connectivity returns.",
  },
  {
    heading: "Design pillars",
    list: [
      "Edge recognition for commands that don’t need server round-trips",
      "Local task cache with optimistic updates and conflict resolution",
      "Deferred sync queue with visibility and retry controls",
      "Graceful degradation: guidance + confirmation even when offline",
    ],
  },
  {
    heading: "How LogiVox approaches this",
    list: [
      "Voice UI that runs client-side with clear permission and state cues",
      "Task lists cached locally with versioning to avoid double-picks",
      "Offline-safe scans with queued confirmations and replay",
      "Sync guards to prevent out-of-order updates when back online",
    ],
  },
  {
    heading: "Rollout steps",
    list: [
      "Pilot offline mode in a limited zone; measure pick continuity and conflict rate",
      "Map which commands must be online vs. can be edge-executed",
      "Tune sync intervals and retry limits based on your RF environment",
      "Train teams using the voice cheat sheet so they trust the states (listening, queued, synced)",
    ],
  },
];

export default function BlogOfflineVoiceEdgePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container-enterprise max-w-4xl py-12 space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">Technology</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Offline Voice at the Edge: Keep Picking When Wi-Fi Drops
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Design resilient voice + scanning that keep working on the floor without network, and sync cleanly once you’re back online.
          </p>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Published: Feb 23, 2026</span>
            <span>8 min read</span>
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
          <h3 className="text-xl font-semibold">Plan your pilot</h3>
          <p className="text-muted-foreground">
            Start in one zone, measure continuity and conflicts, then expand. We’ll help you set up offline queues, retries, and training.
          </p>
          <div className="flex gap-3">
            <Link
              href="/services/support"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Talk to support
            </Link>
            <Link
              href="/voice-browser"
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
            >
              Voice cheat sheet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
