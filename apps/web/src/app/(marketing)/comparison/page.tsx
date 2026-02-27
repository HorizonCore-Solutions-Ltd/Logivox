import type { Metadata } from "next";
import { CompetitiveComparison } from "@/components/marketing/competitive-comparison";
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import { ConversionCTA } from "@/components/marketing/conversion-cta";

export const metadata: Metadata = {
  title: "LogiVox vs SAP vs Manhattan vs Oracle WMS Comparison",
  description:
    "Compare LogiVox to SAP WM, Manhattan Associates, Oracle WMS, and other warehouse management systems. See why modern warehouses choose LogiVox.",
  keywords: [
    "warehouse management system comparison",
    "LogiVox vs SAP",
    "LogiVox vs Manhattan Associates",
    "LogiVox vs Oracle WMS",
    "WMS comparison chart",
    "best warehouse management software",
    "WMS with yard management",
    "WMS with AMR integration",
    "WMS with robotics fleet management",
    "WMS sortation control",
    "automated warehouse management system comparison",
    "warehouse automation software comparison",
    "WMS with IoT sensor integration",
    "SAP EWM alternative",
    "Manhattan WMS alternative",
    "Oracle WMS alternative",
    "cloud WMS comparison",
    "modern WMS platform",
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

      {/* Detailed Comparison Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Warehouses Switch to LogiVox
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Legacy WMS systems were built for a different era. LogiVox is
              purpose-built for modern warehouse operations with voice AI,
              real-time analytics, and instant deployment.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-red-600">
                Legacy WMS Problems
              </h3>

              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Expensive Total Cost
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    $500K+ implementations, plus consultants, customizations,
                    and ongoing maintenance fees
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Slow Implementation
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    12-36 month implementations that disrupt operations and
                    delay ROI
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Limited Mobile Support
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Desktop-first design that doesn't work well on warehouse
                    floors
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    No Voice Operations
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Workers still tied to handheld scanners, slowing down
                    operations
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-600">
                LogiVox Advantages
              </h3>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Transparent Pricing
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Starting at $49/user/month with no hidden fees or consultant
                    requirements
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Rapid Deployment
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    30-90 day implementation with immediate productivity gains
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Mobile-First Design
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Built for mobile devices and warehouse environments from day
                    one
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Revolutionary Voice AI
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Hands-free operations increase productivity 35% with zero
                    training time
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
            urgency="See the difference in 30 minutes"
            socialProof="500+ companies switched to LogiVox from legacy WMS"
          />

          {/* Alternative CTAs Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <ConversionCTA
              variant="roi-calculator"
              title="Calculate ROI vs Your Current WMS"
              socialProof="Average 67% cost savings vs SAP/Oracle"
            />

            <ConversionCTA
              variant="video-demo"
              title="5-Min Video: LogiVox vs Legacy WMS"
              socialProof="See real warehouse transformations"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
