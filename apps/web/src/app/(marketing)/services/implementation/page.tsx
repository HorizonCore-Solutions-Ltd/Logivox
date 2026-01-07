import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowRight,
  Rocket,
  Users,
  FileCheck,
  Settings,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Implementation Services | LogiVox WMS",
  description:
    "Expert WMS implementation services. From planning to go-live, our certified team ensures successful deployment with minimal disruption.",
};

export default function ImplementationPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <Rocket className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Expert WMS Implementation Services
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Deploy your warehouse management system with confidence. Our
              certified implementation team guides you from planning through
              go-live and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=implementation">
                  Schedule Consultation <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/resources/case-studies">View Success Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Approach */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Our Proven Implementation Methodology
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A structured 5-phase approach that minimizes risk and ensures
              on-time, on-budget delivery
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              {
                phase: "1",
                title: "Discovery & Planning",
                description:
                  "Requirements gathering, process mapping, and project planning",
                duration: "2-3 weeks",
                icon: FileCheck,
              },
              {
                phase: "2",
                title: "System Configuration",
                description: "WMS setup, integrations, and customizations",
                duration: "3-4 weeks",
                icon: Settings,
              },
              {
                phase: "3",
                title: "Data Migration",
                description: "Legacy data cleansing, mapping, and migration",
                duration: "1-2 weeks",
                icon: TrendingUp,
              },
              {
                phase: "4",
                title: "Training & UAT",
                description: "User training and acceptance testing",
                duration: "2-3 weeks",
                icon: Users,
              },
              {
                phase: "5",
                title: "Go-Live & Support",
                description: "Deployment and post-go-live stabilization",
                duration: "1-2 weeks",
                icon: Rocket,
              },
            ].map((phase) => (
              <Card key={phase.phase} className="relative">
                <CardHeader>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                    {phase.phase}
                  </div>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <phase.icon className="h-5 w-5" />
                    </div>
                    {phase.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-primary-600">
                    {phase.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg font-semibold mb-2">
              Typical Timeline: 8-12 weeks from kickoff to go-live
            </p>
            <p className="text-muted-foreground">
              Timeline varies based on complexity and customization requirements
            </p>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What's Included</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive implementation services with everything you need for
              success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Dedicated Implementation Manager",
              "Requirements Analysis Workshop",
              "Process Flow Documentation",
              "System Configuration & Setup",
              "Data Migration Services",
              "API & ERP Integration",
              "Custom Workflow Development",
              "Warehouse Layout Configuration",
              "User & Admin Training (40+ hours)",
              "User Acceptance Testing (UAT)",
              "Go-Live Support (on-site available)",
              "Post-Go-Live Stabilization (30 days)",
              "Knowledge Transfer Sessions",
              "Best Practices Documentation",
              "Performance Optimization",
              "Change Management Support",
              "Executive Status Reporting",
              "Risk Mitigation Planning",
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Options */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Implementation Packages</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the level of support that matches your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Essential",
                price: "Starting at $25K",
                description: "Perfect for single-warehouse operations",
                features: [
                  "Remote implementation",
                  "Standard configuration",
                  "Data migration assistance",
                  "Virtual training (20 hours)",
                  "30-day post go-live support",
                  "Email & phone support",
                ],
                timeline: "8-10 weeks",
                ideal: "1 warehouse, <50 users",
              },
              {
                name: "Professional",
                price: "Starting at $50K",
                description: "Most popular for growing businesses",
                features: [
                  "Remote + on-site implementation",
                  "Advanced configuration",
                  "Full data migration",
                  "Comprehensive training (40 hours)",
                  "Custom integrations (up to 3)",
                  "60-day post go-live support",
                  "Dedicated project manager",
                  "Priority support",
                ],
                timeline: "10-12 weeks",
                ideal: "2-5 warehouses, <200 users",
                featured: true,
              },
              {
                name: "Enterprise",
                price: "Custom Pricing",
                description: "For complex, multi-site deployments",
                features: [
                  "Full on-site implementation",
                  "Enterprise configuration",
                  "Complex data migration",
                  "Extended training program",
                  "Unlimited integrations",
                  "Custom development included",
                  "90-day post go-live support",
                  "24/7 support during go-live",
                  "Executive steering committee",
                  "Change management program",
                ],
                timeline: "12-16 weeks",
                ideal: "5+ warehouses, 200+ users",
              },
            ].map((pkg) => (
              <Card
                key={pkg.name}
                className={
                  pkg.featured ? "border-2 border-primary-600 shadow-lg" : ""
                }
              >
                {pkg.featured && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary-600">
                    {pkg.price}
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Timeline: {pkg.timeline}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ideal for: {pkg.ideal}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={pkg.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={`/contact?service=implementation&package=${pkg.name.toLowerCase()}`}
                    >
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Track Record</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Proven success across hundreds of implementations
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { metric: "98%", label: "On-Time Delivery Rate" },
              { metric: "95%", label: "Customer Satisfaction" },
              { metric: "500+", label: "Successful Implementations" },
              { metric: "< 2 weeks", label: "Average Time to ROI" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.metric}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Schedule a consultation with our implementation experts to
                discuss your requirements and create a custom deployment plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=implementation">
                    Schedule Consultation{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
