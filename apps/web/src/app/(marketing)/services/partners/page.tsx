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
  Users as HandshakeIcon,
  Globe,
  TrendingUp,
  Users,
  Award,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner Program | LogiVox WMS",
  description:
    "Join the LogiVox partner ecosystem. Build your business by implementing, reselling, and supporting LogiVox WMS solutions.",
};

export default function PartnersPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <HandshakeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Partner With LogiVox
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join our global partner network and grow your business by
              delivering world-class WMS solutions to your clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=partner-program">
                  Become a Partner <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#programs">Explore Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section id="programs" className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partner Programs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership model that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                type: "Reseller Partner",
                icon: DollarSign,
                description: "Sell LogiVox WMS to your clients",
                benefits: [
                  "Up to 30% recurring commission",
                  "Co-branded marketing materials",
                  "Sales training & enablement",
                  "Lead registration protection",
                  "Deal registration incentives",
                  "Marketing development funds",
                ],
                requirements: [
                  "Sales team of 2+ people",
                  "Warehouse/logistics market presence",
                  "Minimum annual sales target",
                ],
                commission: "20-30% recurring",
              },
              {
                type: "Implementation Partner",
                icon: Users,
                description: "Deploy LogiVox for customers",
                benefits: [
                  "Certified implementation training",
                  "Technical support & resources",
                  "Project management tools",
                  "Implementation playbooks",
                  "Referral commissions (10-15%)",
                  "Priority technical support",
                ],
                requirements: [
                  "Technical team of 3+ people",
                  "WMS implementation experience",
                  "Complete certification program",
                ],
                commission: "Project-based + 10% referral",
                featured: true,
              },
              {
                type: "Technology Partner",
                icon: Globe,
                description: "Build integrations & add-ons",
                benefits: [
                  "API access & documentation",
                  "Co-marketing opportunities",
                  "Listed in marketplace",
                  "Technical partnership support",
                  "Revenue share on joint deals",
                  "Early access to features",
                ],
                requirements: [
                  "Complementary technology product",
                  "Development capabilities",
                  "API integration completed",
                ],
                commission: "Revenue share on co-sells",
              },
            ].map((program) => (
              <Card
                key={program.type}
                className={
                  program.featured
                    ? "border-2 border-primary-600 shadow-lg"
                    : ""
                }
              >
                {program.featured && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <program.icon className="h-5 w-5" />
                    </div>
                    {program.type}
                  </CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Partner Benefits:
                    </p>
                    <ul className="space-y-2">
                      {program.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Requirements:</p>
                    <ul className="space-y-1">
                      {program.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-primary-600">
                      {program.commission}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    variant={program.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={`/contact?service=partner-program&type=${program.type.toLowerCase().replace(" ", "-")}`}
                    >
                      Apply Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Partner With Us?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Recurring Revenue",
                description:
                  "Build predictable income streams with recurring commissions on subscription renewals and upsells.",
              },
              {
                icon: Award,
                title: "Industry-Leading Product",
                description:
                  "Sell a proven WMS that customers love. 4.9/5 G2 rating with strong customer retention.",
              },
              {
                icon: Users,
                title: "Partner Enablement",
                description:
                  "Access training, certifications, sales tools, and technical resources to ensure your success.",
              },
              {
                icon: Globe,
                title: "Global Reach",
                description:
                  "Tap into enterprise and mid-market opportunities with a solution that scales from 1 to 100+ warehouses.",
              },
              {
                icon: HandshakeIcon,
                title: "Co-Marketing Support",
                description:
                  "Benefit from joint marketing campaigns, case studies, events, and lead generation programs.",
              },
              {
                icon: DollarSign,
                title: "Generous Commissions",
                description:
                  "Earn up to 30% recurring commissions plus implementation project fees and referral bonuses.",
              },
            ].map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Tiers */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partner Tiers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Grow through our tiered program and unlock additional benefits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tier: "Silver",
                badge: "🥈",
                requirements: "$50K annual revenue",
                commission: "20% base commission",
                benefits: [
                  "Partner portal access",
                  "Sales & marketing materials",
                  "Standard technical support",
                  "Quarterly business reviews",
                ],
              },
              {
                tier: "Gold",
                badge: "🥇",
                requirements: "$250K annual revenue + 2 certifications",
                commission: "25% base commission",
                benefits: [
                  "All Silver benefits",
                  "Marketing development funds ($10K)",
                  "Priority technical support",
                  "Joint customer events",
                  "Featured in partner directory",
                ],
              },
              {
                tier: "Platinum",
                badge: "💎",
                requirements: "$1M annual revenue + 5 certifications",
                commission: "30% base commission",
                benefits: [
                  "All Gold benefits",
                  "Dedicated partner manager",
                  "Marketing development funds ($50K)",
                  "Early access to features",
                  "Co-branded solutions",
                  "Executive business reviews",
                ],
              },
            ].map((tier, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">{tier.badge}</div>
                    <CardTitle className="text-2xl">
                      {tier.tier} Partner
                    </CardTitle>
                  </div>
                  <CardDescription className="text-center">
                    <p className="font-semibold mb-1">{tier.requirements}</p>
                    <p className="text-primary-600 font-bold">
                      {tier.commission}
                    </p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Success Stories */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Partner Success Stories</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                partner: "Logistics Solutions Inc.",
                type: "Implementation Partner",
                results: "Deployed 25+ implementations, $2.5M in revenue",
                quote:
                  "Partnering with LogiVox has transformed our business. The product sells itself and our clients love it.",
              },
              {
                partner: "TechWare Distribution",
                type: "Reseller Partner",
                results: "150+ licenses sold, 28% annual growth",
                quote:
                  "The recurring commission model provides stable revenue. LogiVox's partner support is outstanding.",
              },
            ].map((story, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{story.partner}</CardTitle>
                  <CardDescription>{story.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-semibold text-primary-600">
                    {story.results}
                  </p>
                  <p className="text-muted-foreground italic">
                    "{story.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <CardContent className="p-12 text-center">
              <HandshakeIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Join our partner ecosystem and start generating revenue with
                LogiVox WMS. Apply today to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=partner-program">
                    Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/partners">Find a Partner</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
