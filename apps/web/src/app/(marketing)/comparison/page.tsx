import type { Metadata } from "next";
import { CompetitiveComparison } from "@/components/marketing/competitive-comparison";
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import { ConversionCTA } from "@/components/marketing/conversion-cta";

export const metadata: Metadata = {
  title: "LogiVox Platform Overview",
  description:
    "Explore how LogiVox brings core operations, intelligence, compliance, voice, and integrations into one enterprise platform.",
  keywords: [
    "LogiVox platform overview",
    "warehouse operations platform",
    "voice-led warehouse management",
    "enterprise operations software",
    "WMS with yard management",
    "WMS with AMR integration",
    "WMS with robotics fleet management",
    "warehouse automation software",
    "WMS with IoT sensor integration",
    "cloud warehouse operations platform",
    "warehouse management system with voice AI",
    "WMS with real-time analytics",
  ],
};

export default function ComparisonPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <section className="py-20 md:py-28">
        <div className="container-enterprise">
          <CompetitiveComparison />
        </div>
      </section>

      {/* Detailed Platform Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Warehouses Choose LogiVox
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              LogiVox is purpose-built for modern warehouse operations with
              voice AI, real-time analytics, auditability, and fast deployment.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-red-600">
                What LogiVox replaces
              </h3>

              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Fragmented workflows
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Separate tools for operations, quality, voice, and reporting
                    slow teams down.
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Manual execution
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Screen-heavy processes increase training time and reduce
                    floor speed.
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Weak visibility
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Teams need a clearer view of health, recovery, and audit
                    evidence.
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Limited resilience
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Recovery paths need to be visible when APIs, devices, or
                    networks fail.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-600">
                LogiVox capabilities
              </h3>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Clear operating model
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Five domains keep the product story simple and easy to
                    understand.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Rapid deployment
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Setup and validation can move quickly with the right
                    environment readiness.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Voice-led execution
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    The platform is designed to let teams work without touching
                    a screen.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Resilience and auditability
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Recovery, traceability, and AI decision visibility are built
                    into the operating model.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <LeadCaptureForm
                variant="resource-download"
                title="Get Full Comparison Guide"
                description="Download our detailed 20-page comparison report"
                leadMagnet={{
                  title: "WMS Comparison Guide 2026",
                  description:
                    "In-depth analysis of LogiVox vs 8 major WMS providers with ROI calculations",
                  icon: () => <div>📊</div>,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Multiple Conversion CTAs */}
      <section className="py-16 bg-background">
        <div className="container-enterprise space-y-8">
          {/* Primary CTA */}
          <ConversionCTA
            variant="demo-primary"
            urgency="See LogiVox in 30 minutes"
            socialProof="Enterprise teams choose LogiVox for clarity and control"
          />

          {/* Alternative CTAs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <ConversionCTA
              variant="roi-calculator"
              title="Calculate LogiVox ROI"
              socialProof="Estimate savings from speed, control, and recovery"
            />

            <ConversionCTA
              variant="video-demo"
              title="5-Min Video: LogiVox Overview"
              socialProof="See the operating model in action"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
