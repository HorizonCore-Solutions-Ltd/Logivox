"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Clock, ArrowRight, Search, TrendingUp, Bookmark } from "lucide-react"

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("All Posts")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Sample blog posts - will be replaced with real data later
  const featuredPost = {
    slug: "zero-trust-security-enterprise-inventory",
    title: "Implementing Zero-Trust Security in Enterprise Inventory Management",
    excerpt: "Learn how zero-trust architecture transforms security in modern inventory systems, protecting your data at every level.",
    author: "LogiVox Security Team",
    date: "2025-10-10",
    readTime: "8 min read",
    category: "Security",
    image: "/blog/security.jpg"
  }

  const blogPosts = [
    {
      slug: "business-owner-wishlist-premium-features",
      title: "Business Owner's Wishlist: Premium Features That Transform Your WMS",
      excerpt: "If I owned a warehouse business, here are the 15 premium features I'd demand from my WMS to maximize ROI and competitive advantage. Real talk from an owner's perspective.",
      author: "LogiVox Product Team",
      date: "2026-01-05",
      readTime: "15 min read",
      category: "Business",
      trending: true,
      featured: true
    },
    {
      slug: "multi-tenant-architecture-best-practices",
      title: "Multi-Tenant Architecture: Best Practices for SaaS Platforms",
      excerpt: "Explore proven patterns for building scalable multi-tenant applications with complete data isolation.",
      author: "Engineering Team",
      date: "2026-01-02",
      readTime: "6 min read",
      category: "Architecture",
      trending: true
    },
    {
      slug: "voice-enabled-warehouse-operations",
      title: "Voice-Enabled Warehouse Operations: The Future is Here",
      excerpt: "How voice technology is revolutionizing warehouse operations with hands-free picking, packing, and inventory management.",
      author: "Product Team",
      date: "2026-01-01",
      readTime: "8 min read",
      category: "Technology",
      trending: true
    },
    {
      slug: "real-time-inventory-tracking",
      title: "Real-Time Inventory Tracking with WebSockets",
      excerpt: "How we built real-time synchronization across thousands of concurrent users without compromising performance.",
      author: "LogiVox Engineering",
      date: "2025-12-28",
      readTime: "10 min read",
      category: "Technology"
    },
    {
      slug: "erp-integration-oracle-sap",
      title: "Seamless ERP Integration: Oracle, SAP, and NetSuite",
      excerpt: "A comprehensive guide to integrating your warehouse management system with major ERP platforms.",
      author: "Integration Team",
      date: "2025-12-25",
      readTime: "12 min read",
      category: "Integrations"
    },
    {
      slug: "ai-powered-inventory-forecasting",
      title: "AI-Powered Inventory Forecasting: Reduce Stockouts by 40%",
      excerpt: "Discover how machine learning and AI are revolutionizing inventory management and demand forecasting.",
      author: "AI Research Team",
      date: "2025-12-20",
      readTime: "7 min read",
      category: "AI & ML",
      trending: true
    },
    {
      slug: "offline-first-progressive-web-apps",
      title: "Building Offline-First PWAs for Enterprise",
      excerpt: "Best practices for creating progressive web applications that work seamlessly offline with service workers.",
      author: "Frontend Team",
      date: "2025-12-15",
      readTime: "9 min read",
      category: "Development"
    },
    {
      slug: "database-optimization-strategies",
      title: "Database Optimization Strategies for Scale",
      excerpt: "Learn how we optimize PostgreSQL for handling millions of inventory transactions with sub-second response times.",
      author: "Database Team",
      date: "2025-12-10",
      readTime: "11 min read",
      category: "Performance"
    },
    {
      slug: "returns-management-best-practices",
      title: "Returns Management Best Practices for E-commerce",
      excerpt: "Streamline your reverse logistics process with efficient RMA workflows and automated processing.",
      author: "Operations Team",
      date: "2025-12-05",
      readTime: "8 min read",
      category: "Operations"
    },
    {
      slug: "wave-picking-optimization",
      title: "Wave Picking Optimization: Increase Efficiency by 50%",
      excerpt: "Advanced strategies for optimizing wave picking operations and reducing pick times in large warehouses.",
      author: "Warehouse Experts",
      date: "2025-12-01",
      readTime: "10 min read",
      category: "Operations"
    }
  ]

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "All Posts" || post.category === selectedCategory
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [
    "All Posts",
    "Technology",
    "Architecture",
    "AI & ML",
    "Integrations",
    "Development",
    "Performance",
    "Operations",
    "Security"
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary">Blog & Insights</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              The LogiVox Blog
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Explore the latest in warehouse technology, best practices, and 
              innovations in logistics and supply chain management.
            </p>

            {/* Search Bar */}
            <div className="pt-4">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 border-b sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="container-enterprise">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {category === "All Posts" && <Badge variant="secondary" className="ml-2">{blogPosts.length}</Badge>}
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
      <section className="py-16">
        <div className="container-enterprise">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {selectedCategory === "All Posts" ? "Latest Articles" : selectedCategory}
              </h2>
              <p className="text-muted-foreground">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card key={post.slug} className="flex flex-col hover:shadow-lg transition-all group">
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 h-48 flex items-center justify-center overflow-hidden">
                  <Badge className="absolute top-4 left-4">{post.category}</Badge>
                  {post.trending && (
                    <Badge className="absolute top-4 right-4 bg-orange-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <CardHeader className="flex-1">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  <CardTitle className="text-xl mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  
                  <CardDescription className="leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">{post.author}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`}>
                          Read
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {filteredPosts.length >= 9 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          )}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No articles found matching your search.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("All Posts") }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="text-center max-w-2xl mx-auto">
              <CardTitle className="text-3xl mb-4">
                Stay Updated with LogiVox
              </CardTitle>
              <CardDescription className="text-base mb-6">
                Get the latest articles, product updates, and industry insights delivered directly to your inbox. 
                Join 5,000+ warehouse professionals.
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
              <p className="text-xs text-muted-foreground mt-4">
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </CardHeader>
          </Card>
        </div>
      </section>
    </>
  )
}
