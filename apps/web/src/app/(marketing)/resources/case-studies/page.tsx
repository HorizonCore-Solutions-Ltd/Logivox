import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, TrendingUp, Package, Building2, ShoppingCart, Truck } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Customer Success Stories | LogiVox WMS",
  description: "See how leading companies transformed their warehouse operations with LogiVox WMS. Real results, measurable ROI.",
}

export default function CaseStudiesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Customer Success Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover how businesses like yours achieved measurable results with LogiVox WMS
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20">
        <div className="container-enterprise">
          <div className="grid gap-12">
            {/* Case Study 1 */}
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 p-12 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-6">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">3PL Provider</h3>
                  <p className="text-lg text-muted-foreground mb-6">Multi-Client Warehousing</p>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">250%</div>
                      <div className="text-sm text-muted-foreground">Client Growth in 12 Months</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">40%</div>
                      <div className="text-sm text-muted-foreground">Operating Cost Reduction</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">99.8%</div>
                      <div className="text-sm text-muted-foreground">Order Accuracy Rate</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-12">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">From Spreadsheets to Scalable Multi-Tenant WMS</CardTitle>
                    <CardDescription className="text-base">
                      How a regional 3PL transformed operations and tripled their client base
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">
                        A growing 3PL warehouse was managing 12 clients using spreadsheets and legacy software. They struggled with client-specific billing, inventory segregation, and couldn't onboard new clients quickly. Manual processes led to billing errors and poor visibility.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Solution</h4>
                      <p className="text-muted-foreground">
                        Implemented LogiVox's multi-tenant WMS with client-specific workflows, automated activity-based billing, and real-time client portals. Voice-enabled picking reduced training time for seasonal workers.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Results</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Grew from 12 to 42 clients in 12 months</li>
                        <li>• Reduced billing disputes by 95%</li>
                        <li>• Cut new client onboarding time from 3 weeks to 2 days</li>
                        <li>• Improved picking accuracy from 94% to 99.8%</li>
                        <li>• Automated billing saved 80 hours per month</li>
                      </ul>
                    </div>
                    <Button asChild>
                      <Link href="/contact?interest=case-study">
                        Get Similar Results <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Case Study 2 */}
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-6">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">E-Commerce Retailer</h3>
                  <p className="text-lg text-muted-foreground mb-6">High-Volume Fulfillment</p>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-green-600">3x</div>
                      <div className="text-sm text-muted-foreground">Order Volume Handled</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">60%</div>
                      <div className="text-sm text-muted-foreground">Faster Order Processing</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">$450K</div>
                      <div className="text-sm text-muted-foreground">Annual Labor Savings</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-12">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">Scaling to Meet Black Friday Demand</CardTitle>
                    <CardDescription className="text-base">
                      Processing 50K daily orders without adding warehouse space
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">
                        An online retailer processing 15K daily orders hit capacity limits during peak season. They considered expanding warehouse space but faced high costs and long lead times. Their existing WMS couldn't handle wave picking or optimize pick paths.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Solution</h4>
                      <p className="text-muted-foreground">
                        Deployed LogiVox's wave picking with zone optimization and batch picking strategies. Implemented dynamic slotting to place fast-movers closer to pack stations. Added voice-enabled picking for hands-free operations.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Results</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Increased capacity to 50K daily orders (same space)</li>
                        <li>• Reduced pick time from 6 min to 2.4 min per order</li>
                        <li>• Eliminated need for $2M warehouse expansion</li>
                        <li>• Cut temporary labor needs by 35% during peak season</li>
                        <li>• Achieved 99.6% same-day ship rate</li>
                      </ul>
                    </div>
                    <Button asChild>
                      <Link href="/contact?interest=case-study">
                        Scale Your Operations <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Case Study 3 */}
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 p-12 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mb-6">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Manufacturing</h3>
                  <p className="text-lg text-muted-foreground mb-6">Raw Materials & Finished Goods</p>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-purple-600">85%</div>
                      <div className="text-sm text-muted-foreground">Inventory Accuracy</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">50%</div>
                      <div className="text-sm text-muted-foreground">Less Stockouts</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600">$1.2M</div>
                      <div className="text-sm text-muted-foreground">Working Capital Freed</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-12">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">From 65% to 99% Inventory Accuracy</CardTitle>
                    <CardDescription className="text-base">
                      Real-time visibility eliminated production delays and stockouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">
                        A manufacturer with raw materials and finished goods inventory struggled with 65% inventory accuracy. Production lines frequently stopped due to stockouts that should have triggered reorders. Monthly physical counts consumed 200+ labor hours.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Solution</h4>
                      <p className="text-muted-foreground">
                        Implemented LogiVox with FIFO enforcement, lot tracking, and automated cycle counting. Integrated with their ERP for real-time production updates. Added barcode scanning at all transaction points and min/max reorder automation.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Results</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Inventory accuracy improved from 65% to 99%</li>
                        <li>• Production stockouts reduced from 12/month to 1/month</li>
                        <li>• Eliminated monthly physical counts (saved 2,400 hours/year)</li>
                        <li>• Reduced excess inventory by 30% ($1.2M)</li>
                        <li>• Full lot traceability for recalls achieved</li>
                      </ul>
                    </div>
                    <Button asChild>
                      <Link href="/contact?interest=case-study">
                        Improve Your Accuracy <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Case Study 4 */}
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 p-12 flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center mb-6">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Distribution Center</h3>
                  <p className="text-lg text-muted-foreground mb-6">B2B Wholesale</p>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-orange-600">70%</div>
                      <div className="text-sm text-muted-foreground">Faster Receiving</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-600">45%</div>
                      <div className="text-sm text-muted-foreground">Better Space Utilization</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-600">6 months</div>
                      <div className="text-sm text-muted-foreground">ROI Payback Period</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-12">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">Dock-to-Stock Time Cut by 70%</CardTitle>
                    <CardDescription className="text-base">
                      Cross-docking and advanced receiving transformed inbound operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">
                        A regional distributor receiving 40+ trucks daily struggled with dock congestion and slow putaway. Products sat in staging areas for hours waiting for processing. Warehouse space utilization was poor, with products stored randomly.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Solution</h4>
                      <p className="text-muted-foreground">
                        Implemented LogiVox's advanced receiving with cross-dock automation, directed putaway, and dynamic slotting. Added appointment scheduling to smooth inbound flow. Integrated with carriers for ASN-based receiving.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Results</h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Dock-to-stock time reduced from 4 hours to 1.2 hours</li>
                        <li>• Cross-dock success rate: 35% of inbound volume</li>
                        <li>• Dock detention fees reduced by $85K annually</li>
                        <li>• Space utilization improved from 65% to 92%</li>
                        <li>• Receiving accuracy improved to 99.9%</li>
                      </ul>
                    </div>
                    <Button asChild>
                      <Link href="/contact?interest=case-study">
                        Optimize Your Receiving <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-enterprise">
          <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                See how LogiVox can transform your warehouse operations. Schedule a demo and discover your potential ROI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact?service=demo">
                    Schedule a Demo <ArrowRight className="ml-2 h-5 w-5" />
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
