import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  BrainCircuit,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Introducing the Inbound Brain: How AI Transforms Receiving | LogiVox Blog",
  description:
    "Discover how our new Inbound Brain technology uses real-time logic to automate receiving, quality control, and cross-docking decisions.",
};

export default function InboundBrainBlogPost() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-12">
        <div className="container-enterprise max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/blog" className="hover:text-primary">
              Blog
            </Link>
            <span>/</span>
            <span>Product Updates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Meet the Inbound Brain: Zero-Touch Receiving Decisions
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Warehouse receiving has always been a bottleneck of manual checks
            and sticky notes. We've built an AI engine that makes every decision
            instantly.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Engineering Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>October 15, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>5 min read</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge>New Feature</Badge>
            <Badge variant="outline">AI</Badge>
            <Badge variant="outline">Receiving</Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-16">
        <div className="container-enterprise max-w-4xl prose prose-lg">
          <p className="lead text-xl text-muted-foreground">
            Every time a pallet hits your dock, your receiving team has to
            answer three questions: Is this item urgent? Does it need
            inspection? Where should it go? Today, manual lookups answer these
            questions. Tomorrow, the <strong>Inbound Brain</strong> will.
          </p>

          <h2>The Problem with Static Receiving</h2>
          <p>
            In traditional WMS, receiving is a rigid process. An item is
            received, labeled, and put away. If a customer is waiting for that
            item (backorder), the system often doesn't flag it until *after*
            it's already been stored in a high bay. This results in "double
            handling"—put away, then immediately pick.
          </p>

          <h2>How the Inbound Brain Works</h2>
          <p>
            The Inbound Brain is a real-time logic layer that intercepts every
            receipt scan. Here is the decision tree it executes in milliseconds:
          </p>

          <div className="my-8 p-6 bg-slate-50 rounded-lg border border-slate-200 not-prose">
            <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Decision Logic flow
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-none bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <strong className="block text-slate-900">
                    Urgency Check
                  </strong>
                  <span className="text-slate-600">
                    Scan active orders. Is this SKU backordered? If yes -&gt;{" "}
                    <span className="text-red-600 font-medium">
                      Flag as Cross-Dock
                    </span>
                    .
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-none bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <strong className="block text-slate-900">
                    Quality Risk Assessment
                  </strong>
                  <span className="text-slate-600">
                    Check supplier history. Is this a new vendor or one with
                    high defect rates? If yes -&gt;{" "}
                    <span className="text-amber-600 font-medium">
                      Trigger QC Inspection
                    </span>
                    .
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-none bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <strong className="block text-slate-900">
                    Putaway Optimization
                  </strong>
                  <span className="text-slate-600">
                    If cleared for storage, calculate optimal bin based on
                    velocity and size.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <h2>Feature Spotlight: Smart QC Triggers</h2>
          <p>
            Not all items need the same level of scrutiny. The Inbound Brain
            dynamically adjusts inspection rates. A trusted supplier might only
            get a 5% sampling rate, while a probationary supplier gets 100%
            inspection. This ensures your quality team focuses on actual risks,
            not routine paperwork.
          </p>

          <h2>Feature Spotlight: Auto-Consolidation</h2>
          <p>
            If you receive a partial pallet of Widget A, and you already have a
            half-full bin of Widget A, the system will direct the new stock to
            that existing bin (layout permitting). This keeps your warehouse
            tidy and maximizes storage density without manual planning.
          </p>

          <div className="mt-12 p-8 bg-primary/5 rounded-xl border border-primary/10 not-prose text-center">
            <h3 className="text-2xl font-bold mb-4">See It In Action</h3>
            <p className="mb-6 text-muted-foreground">
              Ready to stop "dumb" receiving and start smart operations? The
              Inbound Brain is available now for all Enterprise plans.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/solutions/cross-docking">Explore Solution</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
