import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Video, CheckCircle2, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Getting Started with LogiVox WMS | Help Center",
  description: "Quick start guides and tutorials to help you set up and configure your LogiVox warehouse management system.",
}

export default function GettingStartedPage() {
  const articles = [
    {
      title: "Setting Up Your First Warehouse",
      slug: "setup-first-warehouse",
      description: "Complete walkthrough of creating and configuring your first warehouse location",
      readTime: "5 min",
      difficulty: "Beginner",
      popular: true
    },
    {
      title: "Adding Users and Assigning Roles",
      slug: "add-users-roles",
      description: "Learn how to invite team members and configure role-based access control",
      readTime: "3 min",
      difficulty: "Beginner",
      popular: true
    },
    {
      title: "Configuring Warehouse Locations",
      slug: "configure-locations",
      description: "Set up zones, aisles, racks, and bin locations for optimal warehouse organization",
      readTime: "8 min",
      difficulty: "Beginner",
      popular: true
    },
    {
      title: "Importing Your Initial Inventory",
      slug: "import-inventory",
      description: "Import existing inventory data from CSV or via API integration",
      readTime: "6 min",
      difficulty: "Beginner"
    },
    {
      title: "Setting Up Mobile Devices",
      slug: "setup-mobile-devices",
      description: "Configure tablets, scanners, and mobile devices for warehouse operations",
      readTime: "4 min",
      difficulty: "Beginner"
    },
    {
      title: "Creating Your First Receiving Order",
      slug: "first-receiving-order",
      description: "Step-by-step guide to receiving goods into your warehouse",
      readTime: "7 min",
      difficulty: "Beginner"
    },
    {
      title: "Understanding the Dashboard",
      slug: "dashboard-overview",
      description: "Navigate the main dashboard and understand key metrics",
      readTime: "4 min",
      difficulty: "Beginner"
    },
    {
      title: "Configuring Barcode Scanners",
      slug: "barcode-scanners",
      description: "Set up and connect barcode scanners for efficient scanning operations",
      readTime: "5 min",
      difficulty: "Intermediate"
    },
    {
      title: "Setting Up Shipping Carriers",
      slug: "shipping-carriers",
      description: "Integrate with FedEx, UPS, USPS, and other shipping carriers",
      readTime: "10 min",
      difficulty: "Intermediate"
    },
    {
      title: "Customizing Your Workflow",
      slug: "customize-workflow",
      description: "Adapt LogiVox to match your specific warehouse processes",
      readTime: "12 min",
      difficulty: "Advanced"
    }
  ]

  const quickStartSteps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up and verify your email address"
    },
    {
      step: 2,
      title: "Add Your Warehouse",
      description: "Configure warehouse details and locations"
    },
    {
      step: 3,
      title: "Import Inventory",
      description: "Upload your existing product catalog"
    },
    {
      step: 4,
      title: "Invite Your Team",
      description: "Add users and assign appropriate roles"
    },
    {
      step: 5,
      title: "Start Receiving",
      description: "Begin processing incoming shipments"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50 to-white border-b py-12">
        <div className="container-enterprise">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/help" className="hover:text-primary">Help Center</Link>
            <span>/</span>
            <span>Getting Started</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold">Getting Started</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mb-6">
            Everything you need to set up LogiVox and start managing your warehouse operations efficiently.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search getting started guides..."
                className="w-full rounded-lg border border-input bg-background px-10 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            {/* Category Quick Links */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary-100">
                All Guides
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Beginner
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Intermediate
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Advanced
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Popular
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Path */}
      <section className="py-12 bg-muted/30">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Quick Start (30 minutes)</h2>
            <div className="grid gap-4">
              {quickStartSteps.map((step) => (
                <Card key={step.step}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-12">
        <div className="container-enterprise">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">All Getting Started Guides</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>Video tutorials available</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/getting-started/${article.slug}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={article.difficulty === "Beginner" ? "secondary" : article.difficulty === "Intermediate" ? "default" : "outline"}>
                        {article.difficulty}
                      </Badge>
                      {article.popular && (
                        <Badge variant="destructive">Popular</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{article.readTime} read</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 bg-muted/30">
        <div className="container-enterprise">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Learn More?</h2>
              <p className="text-muted-foreground mb-6">
                Once you've completed the getting started guides, explore advanced features and best practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/help/features">
                    Explore Features <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/docs">
                    API Documentation
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
