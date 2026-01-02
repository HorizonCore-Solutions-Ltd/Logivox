import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Target, Shield, Zap, Globe } from "lucide-react"

export const metadata = {
  title: "About Us",
  description: "Learn about LogiVox - our mission, values, and the team building the future of enterprise stock booking.",
}

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "Zero-trust architecture and enterprise-grade security in everything we build."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Constantly pushing boundaries with cutting-edge technology and AI-powered solutions."
    },
    {
      icon: Users,
      title: "Customer Success",
      description: "Your success is our success. We're committed to delivering exceptional value."
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Built to serve enterprises worldwide with reliability and performance."
    }
  ]

  const team = [
    {
      name: "Executive Team",
      description: "Experienced leaders with decades of combined expertise in enterprise software and supply chain management."
    },
    {
      name: "Engineering",
      description: "World-class engineers building scalable, secure, and innovative solutions."
    },
    {
      name: "Customer Success",
      description: "Dedicated team ensuring your success with LogiVox at every step."
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary">About LogiVox</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Building the Future of
              <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Enterprise Stock Booking
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              LogiVox is transforming how enterprises manage inventory and stock booking 
              with cutting-edge technology, zero-trust security, and seamless integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container-enterprise">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To empower enterprises with intelligent, secure, and scalable stock booking 
                solutions that drive operational excellence and accelerate growth.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that modern enterprises deserve technology that works seamlessly, 
                scales effortlessly, and provides real-time insights to make better decisions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">500+</CardTitle>
                  <CardDescription>Enterprise Customers</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">50M+</CardTitle>
                  <CardDescription>Stock Items Managed</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">99.9%</CardTitle>
                  <CardDescription>Uptime SLA</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">40+</CardTitle>
                  <CardDescription>Countries Served</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary">Our Values</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              What Drives Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our core values guide everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="container-enterprise">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary">Our Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              World-Class Talent
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our diverse team brings together expertise from leading technology companies 
              and enterprise software pioneers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((group) => (
              <Card key={group.name}>
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{group.name}</CardTitle>
                  </div>
                  <CardDescription className="leading-relaxed">
                    {group.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-24 bg-muted/30">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Founded</CardTitle>
                  <CardDescription className="text-base">
                    2020 - Built from the ground up with modern technology
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Headquarters</CardTitle>
                  <CardDescription className="text-base">
                    San Francisco, California, USA
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription className="text-base">
                    SOC 2 Type II, ISO 27001, GDPR Compliant
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Backed By</CardTitle>
                  <CardDescription className="text-base">
                    Leading enterprise technology investors
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
