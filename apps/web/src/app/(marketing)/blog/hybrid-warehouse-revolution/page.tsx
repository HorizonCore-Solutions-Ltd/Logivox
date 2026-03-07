import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Hybrid Warehouse Revolution: Adaptive UI vs. Screenless Dogma",
  description:
    "Why forcing new hires into 'screenless' environments kills retention, and how LogiVox's Hybrid Choice model solves it.",
};

const sections = [
  {
    heading: "The 'Screenless' Trap",
    body: "For 20 years, the warehouse voice industry has been dominated by a dogma: 'Screens expand distraction.' Vendors like Honeywell and Vocollect pushed proprietary, screenless hardware that costs $2,000+ per unit. While efficient for 10-year veterans, it's a nightmare for new hires. Imagine starting a new job and being blindfolded on day one.",
  },
  {
    heading: "The 'Screen-Heavy' Trap",
    body: "Conversely, modern Android-based systems (Zebra) often just port a WMS app to a small screen. Users spend 40% of their time staring at a 4-inch display, verifying scans, which defeats the purpose of 'heads-up' operation.",
  },
  {
    heading: "Enter LogiVox: The Adaptive UI",
    body: "We built LogiVox on a simple premise: The UI should adapt to the user's proficiency, not the other way around. We call this 'Hybrid Choice'.",
    list: [
      "Level 1: Rookie Mode (Visual + Voice) - Screen confirms location, product image, and quantity. Confidence booster.",
      "Level 2: Pro Mode (Voice Dominant) - Screen dims to OLED black. Wakes only for exceptions.",
      "Level 3: Speed Mode (Pure Voice) - Screen off/pocketed. Maximum throughput.",
    ],
  },
  {
    heading: "Results: 80% Faster Onboarding",
    body: "By giving new hires visual confirmation during their first two weeks, anxiety drops and accuracy improves. Once they build muscle memory, they naturally transition to Pro and Speed modes. No expensive proprietary hardware required—just standard Android/iOS devices.",
  },
];

export default function BlogHybridWarehouseVoicePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container max-w-4xl py-12 space-y-10 mx-auto px-4">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Industry Insights
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            The Hybrid Warehouse Revolution: Adaptive UI vs. Screenless Dogma
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl">
            Why forcing new hires into "screenless" environments kills
            retention, and how LogiVox's model solves it.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-slate-200 w-fit pr-10">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img
                src="/avatars/default.png"
                alt="Author"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-slate-900">LogiVox Team</p>
              <p>March 4, 2026 • 6 min read</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate prose-lg max-w-none">
          {sections.map((section, index) => (
            <section key={index} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {section.heading}
              </h2>
              {section.body && (
                <p className="text-slate-600 leading-relaxed">{section.body}</p>
              )}
              {section.list && (
                <ul className="mt-4 space-y-2 list-disc pl-6 text-slate-600">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-12 text-center shadow-xl">
          <h3 className="text-2xl font-bold mb-4">
            Experience the difference yourself
          </h3>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Stop paying for expensive proprietary hardware. Start your 14-day
            trial of LogiVox today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Request Demo
            </Link>
            <Link
              href="/resources/help/voice-operations-guide"
              className="border border-slate-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              Read the Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
