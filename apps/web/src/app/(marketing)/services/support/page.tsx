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
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Shield,
  Headphones,
  Zap,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "24/7 Support Center | LogiVox WMS",
  description:
    "Enterprise-grade support with guaranteed SLA. Get help when you need it with 24/7/365 support from WMS experts.",
};

export default function SupportPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <Headphones className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              24/7 Enterprise Support
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get help when you need it. Our WMS experts are available around
              the clock to keep your operations running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=support">
                  Contact Support <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/help">Browse Knowledge Base</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Choose Your Support Level
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From essential email support to dedicated 24/7 priority assistance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Standard Support",
                price: "Included",
                description: "Essential support for all customers",
                features: [
                  "Email support (24-hour response)",
                  "Knowledge base access",
                  "Community forum access",
                  "Bug fixes & security patches",
                  "Monthly system updates",
                  "Self-service portal",
                ],
                sla: "24-hour response time",
                availability: "Business hours (9am-5pm)",
                icon: Mail,
              },
              {
                name: "Premium Support",
                price: "$499/month",
                description: "Enhanced support for growing operations",
                features: [
                  "Phone & email support (4-hour response)",
                  "Chat support during business hours",
                  "Priority bug resolution",
                  "Monthly system health checks",
                  "Quarterly business reviews",
                  "Configuration assistance",
                  "Performance monitoring",
                  "Access to support engineers",
                ],
                sla: "4-hour response, 24-hour resolution target",
                availability: "Business hours (6am-8pm)",
                icon: Phone,
                featured: true,
              },
              {
                name: "Enterprise Support",
                price: "$1,999/month",
                description: "Mission-critical 24/7 support",
                features: [
                  "24/7/365 phone, email & chat support",
                  "1-hour response time (critical issues)",
                  "Dedicated support engineer",
                  "Named technical account manager",
                  "Proactive system monitoring",
                  "Weekly health reports",
                  "Direct escalation to engineering",
                  "On-site support (when needed)",
                  "Custom SLA available",
                  "Emergency hotline",
                ],
                sla: "1-hour response for critical issues",
                availability: "24/7/365 - Always available",
                icon: Shield,
              },
            ].map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.featured ? "border-2 border-primary-600 shadow-lg" : ""
                }
              >
                {tier.featured && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <tier.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    {tier.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-primary-600">
                    {tier.price}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      SLA: {tier.sla}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tier.availability}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={`/contact?service=support&tier=${tier.name.toLowerCase().replace(" ", "-")}`}
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

      {/* Support Channels */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Multiple Ways to Get Help
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the channel that works best for you
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Phone,
                title: "Phone Support",
                description: "Speak directly with our support engineers",
                action: "+1 (555) 123-4567",
                available: "24/7 for Enterprise, Business hours for Premium",
              },
              {
                icon: MessageSquare,
                title: "Live Chat",
                description: "Get instant help through our chat widget",
                action: "Start Chat",
                available: "Business hours (Premium+)",
              },
              {
                icon: Mail,
                title: "Email Support",
                description: "Send detailed inquiries and screenshots",
                action: "support@logivox.ai",
                available: "All tiers, 24-hour response",
              },
              {
                icon: Headphones,
                title: "Support Portal",
                description: "Submit tickets and track progress",
                action: "Open Portal",
                available: "Self-service, all tiers",
              },
            ].map((channel, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <channel.icon className="h-5 w-5" />
                    </div>
                    {channel.title}
                  </CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-primary-600 mb-2">
                    {channel.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {channel.available}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Issue Priority Levels */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Service Level Agreements
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Clear response times based on issue severity
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                priority: "Critical",
                description: "System down, warehouse stopped",
                color: "red",
                standard: "24 hours",
                premium: "4 hours",
                enterprise: "1 hour",
                icon: AlertTriangle,
              },
              {
                priority: "High",
                description: "Major feature not working",
                color: "orange",
                standard: "48 hours",
                premium: "8 hours",
                enterprise: "2 hours",
                icon: Zap,
              },
              {
                priority: "Medium",
                description: "Minor feature issue",
                color: "yellow",
                standard: "5 days",
                premium: "24 hours",
                enterprise: "4 hours",
                icon: Clock,
              },
              {
                priority: "Low",
                description: "Questions, feature requests",
                color: "blue",
                standard: "7 days",
                premium: "48 hours",
                enterprise: "8 hours",
                icon: MessageSquare,
              },
            ].map((level) => (
              <Card key={level.priority}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div
                      className={`inline-flex p-2 rounded-lg bg-${level.color}-100 text-${level.color}-700 flex-shrink-0`}
                    >
                      <level.icon className="h-5 w-5" />
                    </div>
                    {level.priority}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {level.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standard:</span>
                      <span className="font-medium">{level.standard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Premium:</span>
                      <span className="font-medium">{level.premium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enterprise:</span>
                      <span className="font-semibold text-primary-600">
                        {level.enterprise}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What You Get</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive support beyond just answering questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">Technical Support</h3>
              <ul className="space-y-3">
                {[
                  "Bug investigation and resolution",
                  "Performance troubleshooting",
                  "Configuration assistance",
                  "Integration support",
                  "API guidance",
                  "System health monitoring",
                  "Log analysis",
                  "Root cause analysis",
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Proactive Services</h3>
              <ul className="space-y-3">
                {[
                  "Regular system health checks",
                  "Performance optimization recommendations",
                  "Quarterly business reviews",
                  "Early access to new features",
                  "Beta testing opportunities",
                  "Security vulnerability alerts",
                  "Best practices guidance",
                  "Version upgrade assistance",
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <CardContent className="p-12 text-center">
              <Phone className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Need Help Now?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Our support team is standing by to help you resolve any issues
                and keep your warehouse running smoothly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=support">
                    Contact Support <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/help">Browse Knowledge Base</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
