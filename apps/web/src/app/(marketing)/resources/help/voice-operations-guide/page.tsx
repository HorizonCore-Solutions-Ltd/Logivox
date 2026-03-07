import { Metadata } from "next";
import Link from "next/link";
import { HybridChoiceSection } from "@/components/landing/hybrid-choice-section";

export const metadata: Metadata = {
  title: "Hybrid Voice Operations Guide | LogiVox Knowledge Base",
  description:
    "Master the Adaptive UI: Switching between Rookie (Visual), Pro (Dimmed), and Speed (Screenless) modes.",
};

export default function VoiceOperationsGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container max-w-4xl py-12 space-y-10 mx-auto px-4">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            User Guide
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Hybrid Voice Operations: The Complete Guide
          </h1>
          <p className="text-xl text-slate-600">
            Learn how to use LogiVox's unique "Adaptive UI" to train new hires
            faster and empower veterans with speed.
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate max-w-none">
          <h2>1. Understanding the Three Modes</h2>
          <p>
            Unlike legacy systems that force you into a single way of working,
            LogiVox adapts to the user's proficiency. Swipe right on the task
            screen or use voice commands to switch modes instantly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 not-prose">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                🎓 Rookie Mode
              </h3>
              <p className="text-sm text-blue-800">
                <strong>Visual + Voice.</strong> The screen displays product
                images, location maps, and large text instructions.
                <br />
                <br />
                <em>Best for:</em> New hires (Weeks 1-2).
              </p>
            </div>
            <div className="p-6 bg-purple-50 border border-purple-100 rounded-xl">
              <h3 className="font-bold text-purple-900 text-lg mb-2">
                ⚡ Pro Mode
              </h3>
              <p className="text-sm text-purple-800">
                <strong>Voice Dominant.</strong> Screen dims to OLED black to
                save battery. Wakes only for exceptions or confirmations.
                <br />
                <br />
                <em>Best for:</em> Regular staff.
              </p>
            </div>
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
              <h3 className="font-bold text-amber-900 text-lg mb-2">
                🚀 Speed Mode
              </h3>
              <p className="text-sm text-amber-800">
                <strong>Pure Voice.</strong> Screen off or pocketed. 100% audio
                interaction.
                <br />
                <br />
                <em>Best for:</em> Expert veterans.
              </p>
            </div>
          </div>

          <h2>2. Switching Modes</h2>
          <p>
            <strong>Manual Toggle:</strong> Tap the "Eye" or "Mic" icon in the
            top-right corner of the picking screen.
            <br />
            <strong>Voice Command:</strong> Say <em>"Switch to Speed Mode"</em>{" "}
            or <em>"Enable Visual Assist"</em> at any time.
          </p>

          <h2>3. Exception Handling with Smart Voice</h2>
          <p>
            When an issue arises (e.g., damaged barcode, short pick), you don't
            need to memorize a menu tree. Just speak naturally.
          </p>
          <ul>
            <li>
              <strong>Short Pick:</strong> "I only found 3 items." &rarr; System
              asks for confirmation.
            </li>
            <li>
              <strong>Damaged Label:</strong> "Barcode is ripped." &rarr; System
              asks for product check digit.
            </li>
            <li>
              <strong>Help:</strong> "Where is this?" &rarr; System provides
              navigation instructions.
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to train your team?</h3>
          <div className="flex justify-center gap-4">
            <Link
              href="/picking-tasks"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Try it now
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
