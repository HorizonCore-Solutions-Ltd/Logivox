import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, Code, Puzzle, Zap, Database, Globe, Shield } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Custom Development Services | LogiVox WMS",
  description: "Tailored WMS solutions for unique requirements. Custom integrations, workflows, and features built by our expert development team.",
}

export default function CustomDevelopmentPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <Code className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Custom Development Services
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Extend LogiVox to meet your unique requirements. Our development team builds custom features, integrations, and workflows tailored to your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=custom-development">
                  Discuss Your Project <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs/api">View API Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Development Services */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What We Can Build</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From simple customizations to complex enterprise integrations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Puzzle,
                title: "Custom Integrations",
                description: "Connect LogiVox to any system",
                examples: [
                  "ERP systems (custom/proprietary)",
                  "E-commerce platforms",
                  "Carrier APIs",
                  "Accounting software",
                  "CRM systems",
                  "Manufacturing systems",
                ],
              },
              {
                icon: Zap,
                title: "Custom Workflows",
                description: "Automate your unique processes",
                examples: [
                  "Industry-specific workflows",
                  "Custom approval chains",
                  "Automated routing rules",
                  "Custom notifications",
                  "Special handling procedures",
                  "Compliance workflows",
                ],
              },
              {
                icon: Database,
                title: "Data Extensions",
                description: "Capture additional data fields",
                examples: [
                  "Custom product attributes",
                  "Extended order fields",
                  "Special inventory tracking",
                  "Custom reporting metrics",
                  "Industry-specific data",
                  "Compliance tracking fields",
                ],
              },
              {
                icon: Globe,
                title: "Custom Portals",
                description: "Build branded customer experiences",
                examples: [
                  "Supplier portals",
                  "Customer self-service",
                  "Vendor management",
                  "Partner portals",
                  "Mobile apps",
                  "White-label solutions",
                ],
              },
              {
                icon: Shield,
                title: "Custom Reports",
                description: "Insights specific to your business",
                examples: [
                  "Executive dashboards",
                  "Industry-specific KPIs",
                  "Compliance reports",
                  "Financial analyses",
                  "Operational metrics",
                  "Predictive analytics",
                ],
              },
              {
                icon: Code,
                title: "API Development",
                description: "Build on our platform",
                examples: [
                  "Custom API endpoints",
                  "Webhook integrations",
                  "Batch processing jobs",
                  "Real-time sync services",
                  "Event-driven automation",
                  "Microservices",
                ],
              },
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <service.icon className="h-5 w-5" />
                    </div>
                    {service.title}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.examples.map((example, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Development Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Agile methodology with transparent progress tracking
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Discovery",
                description: "Requirements gathering, technical feasibility assessment, and scope definition",
                deliverable: "Technical specification document",
              },
              {
                step: "2",
                title: "Design",
                description: "Architecture design, UI/UX mockups, and integration planning",
                deliverable: "Design documents & prototypes",
              },
              {
                step: "3",
                title: "Development",
                description: "Agile development with 2-week sprints and regular demos",
                deliverable: "Working software increments",
              },
              {
                step: "4",
                title: "Deployment",
                description: "Testing, staging deployment, training, and production go-live",
                deliverable: "Live custom solution",
              },
            ].map((phase) => (
              <Card key={phase.step}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 rounded-full bg-primary-600 text-white items-center justify-center font-bold text-lg flex-shrink-0">
                      {phase.step}
                    </div>
                    {phase.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{phase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-primary-600">Deliverable: {phase.deliverable}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Models */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Flexible Engagement Models</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the pricing structure that fits your project
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                model: "Fixed Price",
                description: "Best for well-defined projects",
                price: "Starting at $10K",
                features: [
                  "Fixed scope & timeline",
                  "Predictable costs",
                  "Milestone-based payments",
                  "Includes testing & deployment",
                  "30-day warranty",
                ],
                ideal: "Small to medium projects with clear requirements",
              },
              {
                model: "Time & Materials",
                description: "Flexible for evolving requirements",
                price: "$150-$200/hour",
                features: [
                  "Pay only for time used",
                  "Flexible scope changes",
                  "Weekly progress reports",
                  "Dedicated development team",
                  "Ongoing support available",
                ],
                ideal: "Complex projects with evolving needs",
                featured: true,
              },
              {
                model: "Retainer",
                description: "Ongoing development partnership",
                price: "$8K-$15K/month",
                features: [
                  "Guaranteed developer hours",
                  "Priority scheduling",
                  "Continuous improvements",
                  "Dedicated team member",
                  "Included support & maintenance",
                ],
                ideal: "Long-term development needs",
              },
            ].map((pricing) => (
              <Card key={pricing.model} className={pricing.featured ? "border-2 border-primary-600 shadow-lg" : ""}>
                {pricing.featured && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    MOST FLEXIBLE
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pricing.model}</CardTitle>
                  <div className="text-2xl font-bold text-primary-600">{pricing.price}</div>
                  <CardDescription>{pricing.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {pricing.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <p className="text-sm font-semibold mb-2">Ideal for:</p>
                    <p className="text-sm text-muted-foreground">{pricing.ideal}</p>
                  </div>
                  <Button className="w-full" variant={pricing.featured ? "default" : "outline"} asChild>
                    <Link href={`/contact?service=custom-development&model=${pricing.model.toLowerCase().replace(' ', '-')}`}>
                      Get Quote
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Development Team</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Deep WMS Expertise",
                description: "Our developers built LogiVox from the ground up. We know every corner of the system.",
              },
              {
                title: "Industry Experience",
                description: "10+ years of warehouse management and logistics domain expertise across multiple industries.",
              },
              {
                title: "Modern Tech Stack",
                description: "Built with Next.js, TypeScript, PostgreSQL, and modern cloud-native architecture.",
              },
              {
                title: "Agile Methodology",
                description: "2-week sprints with regular demos ensure you see progress and can provide feedback early.",
              },
              {
                title: "Quality Assurance",
                description: "Comprehensive testing including unit tests, integration tests, and user acceptance testing.",
              },
              {
                title: "Ongoing Support",
                description: "We support what we build. Custom features are maintained just like core product features.",
              },
            ].map((benefit, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
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
              <Code className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Have a Custom Requirement?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Let's discuss how we can build a solution tailored to your unique needs. Schedule a free consultation with our development team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=custom-development">
                    Schedule Consultation <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                  <Link href="/docs/api">Explore API</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
