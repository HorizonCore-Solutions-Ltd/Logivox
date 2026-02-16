import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import {
  ArrowRight,
  Shield,
  Heart,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  FileText,
  Users,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Healthcare Warehouse Management System | LogiVox WMS for Medical Supply Chain",
  description:
    "HIPAA-compliant warehouse management for hospitals, pharmacies, and medical distributors. Lot tracking, temperature monitoring, and FDA compliance built-in.",
  keywords: [
    "healthcare warehouse management",
    "hospital inventory system",
    "pharmacy warehouse software",
    "medical supply chain management",
    "HIPAA compliant WMS",
  ],
};

export default function HealthcareIndustryPage() {
  const healthcareStats = [
    { value: "99.97%", label: "Lot Tracking Accuracy", icon: Shield },
    { value: "$3.2M", label: "Avg Annual Savings", icon: BarChart3 },
    { value: "2 Hours", label: "Faster Recall Response", icon: Clock },
    { value: "100%", label: "FDA Compliance", icon: CheckCircle2 },
  ];

  const healthcareChallenges = [
    {
      challenge: "Lot & Serial Number Tracking",
      solution:
        "Automatic lot tracking with expiration management and FEFO rotation",
      icon: FileText,
    },
    {
      challenge: "Temperature Monitoring",
      solution:
        "Real-time cold chain monitoring with alerts and compliance reporting",
      icon: Thermometer,
    },
    {
      challenge: "FDA Recalls & Audits",
      solution: "Instant recall traceability and audit-ready documentation",
      icon: AlertTriangle,
    },
    {
      challenge: "HIPAA Compliance",
      solution: "Full data encryption, access controls, and audit trails",
      icon: Shield,
    },
  ];

  const healthcareFeatures = [
    "Lot and serial number tracking with full traceability",
    "Temperature monitoring and cold chain management",
    "FDA 21 CFR Part 11 compliance for electronic records",
    "HIPAA-compliant data encryption and access controls",
    "Automated FEFO (First Expired, First Out) rotation",
    "Recall management with instant batch identification",
    "UDI (Unique Device Identification) barcode support",
    "DEA controlled substance tracking and reporting",
    "cGMP-compliant warehouse operations workflows",
    "Integration with hospital EHR/HIS systems",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                🏥 Healthcare WMS
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                HIPAA-Compliant Warehouse Management
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  for Healthcare
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Specialized WMS for hospitals, pharmacies, and medical
                distributors. Built-in lot tracking, temperature monitoring, and
                FDA compliance that healthcare operations demand.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="#demo">
                    Get Healthcare Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/comparison">vs Other Healthcare WMS</Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>FDA 21 CFR Part 11</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  <span>SOC 2 Type II</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <Badge className="w-fit">📊 Healthcare Impact</Badge>
                  <CardTitle className="text-2xl">
                    Real Results from Medical Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {healthcareStats.map((stat) => (
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

      {/* Healthcare Challenges */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <Badge className="mb-4">🏥 Healthcare-Specific Solutions</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Solving Critical Healthcare Warehouse Challenges
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Healthcare warehouses face unique compliance, traceability, and
              safety requirements. LogiVox is purpose-built for the medical
              supply chain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {healthcareChallenges.map((item, index) => (
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

      {/* Healthcare Features */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">✅ Complete Healthcare WMS</Badge>
              <h2 className="text-3xl font-bold mb-6">
                Everything Healthcare Warehouses Need
              </h2>
              <div className="space-y-3">
                {healthcareFeatures.map((feature, index) => (
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
                    Healthcare Customer Success
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                    "LogiVox transformed our hospital supply chain. Lot tracking
                    that used to take hours now happens automatically. Our last
                    FDA audit was flawless."
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      DM
                    </div>
                    <div>
                      <div className="font-semibold">Dr. Maria Rodriguez</div>
                      <div className="text-sm text-muted-foreground">
                        Supply Chain Director, Regional Medical Center
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Results:
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      • 99.9% lot tracking accuracy
                      <br />
                      • $1.8M annual savings
                      <br />• Zero recall incidents
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                Ready for Healthcare-Grade WMS?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join 150+ healthcare facilities using LogiVox for
                HIPAA-compliant, FDA-ready warehouse operations. See it in
                action with your data.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>30-minute personalized healthcare demo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>See lot tracking and compliance features</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Custom ROI analysis for your facility</span>
                </div>
              </div>
            </div>
            <div>
              <LeadCaptureForm
                variant="demo-request"
                title="Get Healthcare WMS Demo"
                description="See LogiVox healthcare features with your facility's data"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
