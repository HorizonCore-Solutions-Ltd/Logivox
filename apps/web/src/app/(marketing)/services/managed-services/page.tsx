import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, Shield, Server, BarChart3, HeadphonesIcon, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Managed Services | LogiVox WMS",
  description: "Let us manage your WMS infrastructure. Focus on your business while our experts handle deployment, monitoring, and optimization.",
}

export default function ManagedServicesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Managed WMS Services
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Focus on growing your business, not managing infrastructure. Our team handles everything from deployment to daily operations and continuous optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=managed-services">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#services">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section id="services" className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete WMS Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We handle every aspect of your WMS so you don't have to
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Server,
                title: "Infrastructure Management",
                items: [
                  "Cloud hosting & scaling",
                  "Database administration",
                  "Backup & disaster recovery",
                  "Security patching",
                  "Performance tuning",
                  "Capacity planning",
                ],
              },
              {
                icon: Shield,
                title: "Security & Compliance",
                items: [
                  "24/7 security monitoring",
                  "Vulnerability assessments",
                  "Compliance management",
                  "Penetration testing",
                  "Incident response",
                  "Audit support",
                ],
              },
              {
                icon: BarChart3,
                title: "Performance Monitoring",
                items: [
                  "Real-time system monitoring",
                  "Proactive issue detection",
                  "Performance analytics",
                  "Usage trend analysis",
                  "Capacity forecasting",
                  "Monthly health reports",
                ],
              },
              {
                icon: HeadphonesIcon,
                title: "24/7 Support",
                items: [
                  "Round-the-clock availability",
                  "Dedicated support team",
                  "1-hour response time",
                  "Issue resolution tracking",
                  "User support included",
                  "Emergency escalation",
                ],
              },
              {
                icon: TrendingUp,
                title: "Continuous Optimization",
                items: [
                  "Workflow optimization",
                  "Configuration tuning",
                  "Integration maintenance",
                  "Feature enablement",
                  "Best practices consulting",
                  "ROI improvement",
                ],
              },
              {
                icon: Clock,
                title: "Proactive Maintenance",
                items: [
                  "Scheduled system updates",
                  "Feature rollouts",
                  "Integration health checks",
                  "Data quality monitoring",
                  "Preventive maintenance",
                  "Change management",
                ],
              },
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <service.icon className="h-5 w-5" />
                    </div>
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.items.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Managed Service Plans</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the level of management that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Essentials",
                price: "$2,999/month",
                description: "Core managed services for single-site operations",
                features: [
                  "Cloud hosting & infrastructure",
                  "Daily backups",
                  "Security monitoring",
                  "System updates & patches",
                  "Business hours support",
                  "Monthly health reports",
                  "99.5% uptime SLA",
                ],
                users: "Up to 50 users",
                warehouses: "1 warehouse",
              },
              {
                name: "Professional",
                price: "$6,999/month",
                description: "Comprehensive management for growing businesses",
                features: [
                  "Everything in Essentials",
                  "24/7 monitoring & support",
                  "Disaster recovery",
                  "Performance optimization",
                  "Integration management",
                  "Weekly health reports",
                  "Quarterly business reviews",
                  "Dedicated account manager",
                  "99.9% uptime SLA",
                ],
                users: "Up to 200 users",
                warehouses: "Up to 5 warehouses",
                featured: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "White-glove service for mission-critical operations",
                features: [
                  "Everything in Professional",
                  "Multi-region deployment",
                  "Custom SLA (up to 99.99%)",
                  "Dedicated support engineers",
                  "On-site support available",
                  "Custom development included",
                  "Executive business reviews",
                  "Change advisory board",
                  "Personalized roadmap",
                ],
                users: "Unlimited users",
                warehouses: "Unlimited warehouses",
              },
            ].map((tier) => (
              <Card key={tier.name} className={tier.featured ? "border-2 border-primary-600 shadow-lg" : ""}>
                {tier.featured && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary-600">{tier.price}</div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-1">{tier.users}</p>
                    <p className="text-sm text-muted-foreground">{tier.warehouses}</p>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={tier.featured ? "default" : "outline"} asChild>
                    <Link href={`/contact?service=managed-services&tier=${tier.name.toLowerCase()}`}>
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Managed Services?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Reduce IT Burden",
                description: "Free up your IT team to focus on strategic initiatives, not daily maintenance and troubleshooting.",
              },
              {
                title: "Predictable Costs",
                description: "Fixed monthly pricing eliminates unexpected infrastructure and support costs.",
              },
              {
                title: "Expert Management",
                description: "Leverage our WMS expertise without hiring specialized in-house staff.",
              },
              {
                title: "Faster Time to Value",
                description: "We handle setup and optimization, so you can go live faster and see ROI sooner.",
              },
              {
                title: "Guaranteed Uptime",
                description: "SLA-backed availability ensures your warehouse operations never stop.",
              },
              {
                title: "Continuous Improvement",
                description: "Benefit from ongoing optimization and best practices without extra effort.",
              },
            ].map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
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
            <h2 className="text-3xl font-bold mb-4">Proven Results</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { metric: "99.9%", label: "Average Uptime" },
              { metric: "< 15 min", label: "Average Issue Resolution" },
              { metric: "40%", label: "IT Cost Reduction" },
              { metric: "100+", label: "Clients Managed" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.metric}</div>
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
              <h2 className="text-3xl font-bold mb-4">Ready to Let Experts Manage Your WMS?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Stop worrying about infrastructure and focus on growing your business. Schedule a consultation to learn how managed services can benefit you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=managed-services">
                    Schedule Consultation <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
