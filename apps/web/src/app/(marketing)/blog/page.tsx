import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Clock, ArrowRight, Search } from "lucide-react"

export const metadata = {
  title: "Blog",
  description: "Insights, updates, and best practices for enterprise stock booking and inventory management.",
}

export default function BlogPage() {
  // Sample blog posts - will be replaced with real data later
  const featuredPost = {
    slug: "zero-trust-security-enterprise-inventory",
    title: "Implementing Zero-Trust Security in Enterprise Inventory Management",
    excerpt: "Learn how zero-trust architecture transforms security in modern inventory systems, protecting your data at every level.",
    author: "FlowStock Security Team",
    date: "2025-10-10",
    readTime: "8 min read",
    category: "Security",
    image: "/blog/security.jpg"
  }

  const blogPosts = [
    {
      slug: "multi-tenant-architecture-best-practices",
      title: "Multi-Tenant Architecture: Best Practices for SaaS Platforms",
      excerpt: "Explore proven patterns for building scalable multi-tenant applications with complete data isolation.",
      author: "Engineering Team",
      date: "2025-10-08",
      readTime: "6 min read",
      category: "Architecture"
    },
    {
      slug: "real-time-inventory-tracking",
      title: "Real-Time Inventory Tracking with WebSockets",
      excerpt: "How we built real-time synchronization across thousands of concurrent users without compromising performance.",
      author: "FlowStock Engineering",
      date: "2025-10-05",
      readTime: "10 min read",
      category: "Technology"
    },
    {
      slug: "erp-integration-oracle-sap",
      title: "Seamless ERP Integration: Oracle, SAP, and NetSuite",
      excerpt: "A comprehensive guide to integrating your stock booking system with major ERP platforms.",
      author: "Integration Team",
      date: "2025-10-01",
      readTime: "12 min read",
      category: "Integrations"
    },
    {
      slug: "ai-powered-inventory-forecasting",
      title: "AI-Powered Inventory Forecasting: The Future is Here",
      excerpt: "Discover how machine learning and AI are revolutionizing inventory management and demand forecasting.",
      author: "AI Research Team",
      date: "2025-09-28",
      readTime: "7 min read",
      category: "AI & ML"
    },
    {
      slug: "offline-first-progressive-web-apps",
      title: "Building Offline-First PWAs for Enterprise",
      excerpt: "Best practices for creating progressive web applications that work seamlessly offline with service workers.",
      author: "Frontend Team",
      date: "2025-09-25",
      readTime: "9 min read",
      category: "Development"
    },
    {
      slug: "database-optimization-strategies",
      title: "Database Optimization Strategies for Scale",
      excerpt: "Learn how we optimize PostgreSQL for handling millions of inventory transactions with sub-second response times.",
      author: "Database Team",
      date: "2025-09-20",
      readTime: "11 min read",
      category: "Performance"
    }
  ]

  const categories = [
    "All Posts",
    "Security",
    "Architecture",
    "Technology",
    "Integrations",
    "AI & ML",
    "Development",
    "Performance"
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary">Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Insights & Updates
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Explore the latest in enterprise technology, best practices, and 
              innovations in stock booking and inventory management.
            </p>

            {/* Search Bar */}
            <div className="pt-4">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container-enterprise">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All Posts" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container-enterprise">
          <div className="mb-8">
            <Badge variant="secondary">Featured Post</Badge>
          </div>
          
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-muted h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center p-8">
                  <Badge className="mb-4">{featuredPost.category}</Badge>
                  <p className="text-muted-foreground">Featured image placeholder</p>
                </div>
              </div>
              
              <CardHeader className="p-8">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {featuredPost.readTime}
                  </span>
                </div>
                
                <CardTitle className="text-3xl mb-4">
                  {featuredPost.title}
                </CardTitle>
                
                <CardDescription className="text-base leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </CardDescription>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{featuredPost.author}</span>
                  <Button asChild>
                    <Link href={`/blog/${featuredPost.slug}`}>
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </div>
          </Card>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container-enterprise">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Latest Articles</h2>
            <p className="text-muted-foreground">
              Stay updated with the latest insights from our team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.slug} className="flex flex-col hover:shadow-lg transition-shadow">
                <div className="bg-muted h-48 flex items-center justify-center">
                  <Badge>{post.category}</Badge>
                </div>
                
                <CardHeader className="flex-1">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  <CardTitle className="text-xl mb-3">
                    {post.title}
                  </CardTitle>
                  
                  <CardDescription className="leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">{post.author}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`}>
                        Read More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24">
        <div className="container-enterprise">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center max-w-2xl mx-auto">
              <CardTitle className="text-3xl mb-4">
                Subscribe to Our Newsletter
              </CardTitle>
              <CardDescription className="text-base mb-6">
                Get the latest articles, insights, and product updates delivered to your inbox.
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="lg">
                  Subscribe
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  )
}
