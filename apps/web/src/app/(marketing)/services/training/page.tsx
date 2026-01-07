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
  GraduationCap,
  Users,
  Video,
  BookOpen,
  Award,
  Target,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Training & Certification | LogiVox WMS",
  description:
    "Professional WMS training programs and certification courses. Empower your team with the skills to maximize system efficiency.",
};

export default function TrainingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-6">
              <GraduationCap className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Training & Certification Programs
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Empower your team with expert-led training. From end-users to
              administrators, we offer comprehensive programs to maximize your
              WMS investment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?service=training">
                  Schedule Training <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#programs">Browse Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Training Programs */}
      <section id="programs" className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Training Programs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Role-based training designed for your team's specific needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "End-User Training",
                duration: "2 days (16 hours)",
                price: "$499/person",
                description: "Essential training for warehouse operators",
                icon: Users,
                audience: "Warehouse staff, operators, pickers",
                topics: [
                  "System navigation & basics",
                  "Receiving operations",
                  "Picking & packing",
                  "Inventory management",
                  "Barcode scanning",
                  "Mobile device usage",
                  "Voice commands (optional)",
                  "Best practices",
                ],
                certification: "LogiVox Certified Operator",
              },
              {
                name: "Power User Training",
                duration: "3 days (24 hours)",
                price: "$899/person",
                description: "Advanced training for supervisors",
                icon: Target,
                audience: "Supervisors, team leads, coordinators",
                topics: [
                  "All end-user content",
                  "Wave planning & management",
                  "Task assignment & monitoring",
                  "Performance metrics",
                  "Exception handling",
                  "Reporting & analytics",
                  "Workflow optimization",
                  "Troubleshooting",
                ],
                certification: "LogiVox Certified Power User",
                featured: true,
              },
              {
                name: "Administrator Training",
                duration: "5 days (40 hours)",
                price: "$1,799/person",
                description: "Complete system administration",
                icon: Award,
                audience: "IT staff, system admins, managers",
                topics: [
                  "All power user content",
                  "System configuration",
                  "User management",
                  "Integration setup",
                  "Custom workflows",
                  "API usage",
                  "Security & permissions",
                  "Backup & disaster recovery",
                  "Performance tuning",
                  "Advanced reporting",
                ],
                certification: "LogiVox Certified Administrator",
              },
            ].map((program) => (
              <Card
                key={program.name}
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
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <program.icon className="h-6 w-6" />
                    </div>
                    {program.name}
                  </CardTitle>
                  <div className="text-2xl font-bold text-primary-600">
                    {program.price}
                  </div>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      Duration: {program.duration}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      For: {program.audience}
                    </p>
                    <div className="inline-flex items-center text-sm font-medium text-primary-600">
                      <Award className="h-4 w-4 mr-1" />
                      {program.certification}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Topics Covered:
                    </p>
                    <ul className="space-y-2">
                      {program.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full"
                    variant={program.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={`/contact?service=training&program=${program.name.toLowerCase().replace(" ", "-")}`}
                    >
                      Enroll Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training Formats */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Flexible Training Options
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the format that works best for your team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                format: "On-Site Training",
                icon: Users,
                description: "Instructor comes to your facility",
                benefits: [
                  "Hands-on training in your environment",
                  "Train multiple teams simultaneously",
                  "Customized to your workflows",
                  "Direct access to instructor",
                  "Team building opportunity",
                ],
                pricing: "$3,500/day + travel expenses",
                ideal: "10+ participants, new implementations",
              },
              {
                format: "Virtual Training",
                icon: Video,
                description: "Live online instructor-led sessions",
                benefits: [
                  "No travel required",
                  "Flexible scheduling",
                  "Recorded sessions included",
                  "Screen sharing & demos",
                  "Q&A sessions",
                ],
                pricing: "$1,200/day (up to 20 participants)",
                ideal: "Remote teams, budget-conscious",
                featured: true,
              },
              {
                format: "Self-Paced Online",
                icon: BookOpen,
                description: "Learn at your own pace",
                benefits: [
                  "24/7 access to materials",
                  "Video tutorials & guides",
                  "Practice exercises",
                  "Certification exams",
                  "90-day access",
                ],
                pricing: "$299/person/year",
                ideal: "Ongoing training, new hires",
              },
            ].map((option) => (
              <Card
                key={option.format}
                className={option.featured ? "border-2 border-primary-600" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
                      <option.icon className="h-5 w-5" />
                    </div>
                    {option.format}
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {option.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <p className="font-semibold text-primary-600 text-lg mb-2">
                      {option.pricing}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ideal for: {option.ideal}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    variant={option.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={`/contact?service=training&format=${option.format.toLowerCase().replace(" ", "-")}`}
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

      {/* Certification Path */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Certification Program</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Demonstrate expertise with industry-recognized credentials
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  level: "Level 1: Certified Operator",
                  requirements: "Complete End-User Training + Pass exam (80%)",
                  duration: "2 days training + 2-hour exam",
                  benefits: "Demonstrates basic system proficiency",
                  badge: "🥉",
                },
                {
                  level: "Level 2: Certified Power User",
                  requirements:
                    "Level 1 + Complete Power User Training + Pass exam (85%)",
                  duration: "3 days additional training + 3-hour exam",
                  benefits: "Qualifies for supervisor/coordinator roles",
                  badge: "🥈",
                },
                {
                  level: "Level 3: Certified Administrator",
                  requirements:
                    "Level 2 + Complete Admin Training + Pass exam (90%) + Practical assessment",
                  duration: "5 days additional training + 4-hour exam",
                  benefits: "Full system administration and configuration",
                  badge: "🥇",
                },
                {
                  level: "Level 4: Certified Architect (Coming Soon)",
                  requirements:
                    "Level 3 + 1 year experience + Multi-site implementation project",
                  duration: "Advanced program (TBD)",
                  benefits: "Design and architect enterprise deployments",
                  badge: "💎",
                },
              ].map((cert, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          <span className="text-3xl mr-3">{cert.badge}</span>
                          {cert.level}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {cert.requirements}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-1">
                          Training Duration:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cert.duration}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">
                          Career Benefits:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cert.benefits}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Additional Training Services
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Custom Training",
                description:
                  "Tailored to your specific workflows and requirements",
                price: "Custom pricing",
              },
              {
                title: "Train-the-Trainer",
                description: "Certify your internal trainers to teach others",
                price: "$2,499/person",
              },
              {
                title: "Refresher Courses",
                description: "Update skills on new features and best practices",
                price: "$199/person/day",
              },
              {
                title: "Annual Training Pass",
                description: "Unlimited access to all courses for your team",
                price: "Contact sales",
              },
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-primary-600">
                    {service.price}
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
              <GraduationCap className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Train Your Team?
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                Invest in your team's success with professional WMS training.
                Schedule a consultation to discuss your training needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=training">
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
                  <Link href="/docs">View Training Materials</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
