import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import {
  ArrowRight,
  Cog,
  Package,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  CheckCircle2,
  Wrench,
  Factory,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Manufacturing Warehouse Management System | LogiVox WMS for Production",
  description:
    "Warehouse management for manufacturing operations. Raw materials tracking, work-in-process inventory, finished goods, and production scheduling integration.",
  keywords: [
    "manufacturing warehouse management",
    "production inventory system",
    "raw materials tracking",
    "work in process inventory",
    "manufacturing WMS",
  ],
};

export default function ManufacturingIndustryPage() {
  const manufacturingStats = [
    { value: "47%", label: "Faster Production Cycles", icon: Clock },
    { value: "$4.1M", label: "Avg Annual Savings", icon: BarChart3 },
    { value: "92%", label: "Material Availability", icon: Package },
    { value: "35%", label: "Labor Efficiency Gain", icon: Users },
  ];

  const manufacturingChallenges = [
    {
      challenge: "Raw Material Shortages",
      solution:
        "Predictive inventory with supplier integration and automated reordering",
      icon: Package,
    },
    {
      challenge: "Work-in-Process Tracking",
      solution: "Real-time WIP visibility with production floor integration",
      icon: Factory,
    },
    {
      challenge: "Production Scheduling",
      solution:
        "Integrated capacity planning with material availability optimization",
      icon: Clock,
    },
    {
      challenge: "Quality Control Integration",
      solution:
        "Automated QC workflows with defect tracking and rework management",
      icon: CheckCircle2,
    },
  ];

  const manufacturingFeatures = [
    "Raw materials inventory with vendor-managed inventory (VMI)",
    "Work-in-process (WIP) tracking with production floor integration",
    "Finished goods management with quality hold protocols",
    "Bill of materials (BOM) integration with ERP systems",
    "Kanban and lean manufacturing workflow support",
    "Supplier portal with real-time inventory visibility",
    "Production scheduling optimization with material constraints",
    "Scrap and rework tracking with cost analysis",
    "Multi-location inventory balancing and transfers",
    "Integration with MES (Manufacturing Execution Systems)",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                🏭 Manufacturing WMS
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Manufacturing Warehouse Management
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Built for Production
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                End-to-end inventory management for manufacturing operations.
                From raw materials to finished goods, optimize your entire
                production supply chain with LogiVox.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="#demo">
                    See Manufacturing Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/comparison">vs SAP/Oracle WMS</Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-green-500" />
                  <span>ERP Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-green-500" />
                  <span>MES Compatible</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Lean Manufacturing</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <Badge className="w-fit">📊 Manufacturing Impact</Badge>
                  <CardTitle className="text-2xl">
                    Results from Production Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {manufacturingStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center p-4 bg-muted/50 rounded-lg"
                      >
                        <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-primary">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Challenges */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">🏭 Manufacturing Solutions</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Solving Complex Manufacturing Inventory Challenges
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Manufacturing operations require precise inventory control across
              raw materials, work-in-process, and finished goods. LogiVox
              streamlines the entire flow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {manufacturingChallenges.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-2 text-red-600">
                        Challenge: {item.challenge}
                      </h3>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-green-600">
                          LogiVox Solution:
                        </span>{" "}
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturing Features */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">⚙️ Complete Manufacturing WMS</Badge>
              <h2 className="text-3xl font-bold mb-6">
                Everything Manufacturing Needs
              </h2>
              <div className="space-y-3">
                {manufacturingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Manufacturing Customer Success
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                    "LogiVox eliminated our raw material shortages and cut
                    production delays by 89%. Our plants now run like
                    clockwork."
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      JT
                    </div>
                    <div>
                      <div className="font-semibold">James Thompson</div>
                      <div className="text-sm text-muted-foreground">
                        VP Operations, Advanced Manufacturing Corp
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Results:
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      • 47% faster production cycles
                      <br />
                      • $3.7M annual savings
                      <br />
                      • 99.2% material availability
                      <br />• 35% labor efficiency gain
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Focus */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">🔗 ERP & MES Integration</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Seamless Production Integration
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              LogiVox integrates with your existing manufacturing systems for
              complete visibility from order to delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Cog className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">ERP Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with SAP, Oracle, NetSuite, and other ERP systems for
                  real-time data sync
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Factory className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">MES Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Production floor integration for work-in-process tracking and
                  quality management
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Analytics & Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Predictive analytics for demand planning and production
                  optimization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="demo"
        className="py-16 bg-gradient-to-r from-primary/5 to-primary/10"
      >
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Optimize Manufacturing Operations?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join 200+ manufacturing companies using LogiVox to streamline
                their production supply chain. See it work with your BOMs and
                processes.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>30-minute manufacturing-focused demo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>See BOM integration and WIP tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>ROI analysis for your production facility</span>
                </div>
              </div>
            </div>
            <div>
              <LeadCaptureForm
                variant="demo-request"
                title="Get Manufacturing WMS Demo"
                description="See LogiVox manufacturing features with your production data"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
