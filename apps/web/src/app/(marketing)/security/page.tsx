import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import { 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Users,
  Database,
  ArrowRight,
  Award,
  Globe,
  Zap,
  Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Compliance - SOC 2, ISO 27001, HIPAA | LogiVox",
  description: "Enterprise-grade security with SOC 2 Type II, ISO 27001, HIPAA compliance. Bank-level encryption, zero-trust architecture, and 24/7 monitoring.",
  keywords: ["SOC 2", "ISO 27001", "HIPAA compliance", "warehouse security", "data protection"],
};

const certifications = [
  {
    name: "SOC 2 Type II",
    description: "Annual third-party audits verify our security controls meet the highest standards",
    icon: Award,
    status: "Certified",
    year: "2025",
  },
  {
    name: "ISO 27001",
    description: "International standard for information security management systems",
    icon: Shield,
    status: "Certified", 
    year: "2024",
  },
  {
    name: "HIPAA",
    description: "Healthcare data protection compliance for medical device warehouses",
    icon: FileText,
    status: "Compliant",
    year: "2024",
  },
  {
    name: "GDPR",
    description: "European data protection regulation compliance for global operations",
    icon: Globe,
    status: "Compliant",
    year: "2024",
  },
  {
    name: "CCPA",
    description: "California Consumer Privacy Act compliance for US operations",
    icon: Lock,
    status: "Compliant",
    year: "2025",
  },
];

const securityFeatures = [
  {
    category: "Data Protection",
    icon: Lock,
    features: [
      {
        name: "AES-256 Encryption",
        description: "All data encrypted at rest and in transit using bank-grade encryption",
        implemented: true,
      },
      {
        name: "Zero-Trust Architecture",
        description: "Every request verified, nothing trusted by default",
        implemented: true,
      },
      {
        name: "Multi-Region Backups",
        description: "Daily encrypted backups across 3 geographic regions",
        implemented: true,
      },
      {
        name: "Data Residency Controls",
        description: "Choose where your data is stored and processed",
        implemented: true,
      },
    ],
  },
  {
    category: "Access Control",
    icon: Users,
    features: [
      {
        name: "Multi-Factor Authentication",
        description: "Required MFA with TOTP, SMS, and biometric options",
        implemented: true,
      },
      {
        name: "Single Sign-On (SSO)",
        description: "SAML 2.0 integration with your identity provider",
        implemented: true,
      },
      {
        name: "Role-Based Permissions",
        description: "Granular permissions with principle of least privilege",
        implemented: true,
      },
      {
        name: "Session Management",
        description: "Automatic session timeout and concurrent session limits",
        implemented: true,
      },
    ],
  },
  {
    category: "Monitoring & Incident Response",
    icon: Eye,
    features: [
      {
        name: "24/7 Security Monitoring",
        description: "Real-time threat detection and automated response",
        implemented: true,
      },
      {
        name: "Audit Logging",
        description: "Comprehensive audit trails for all user actions",
        implemented: true,
      },
      {
        name: "Intrusion Detection",
        description: "AI-powered anomaly detection and alerting",
        implemented: true,
      },
      {
        name: "Incident Response Plan",
        description: "Documented procedures with <1 hour response time",
        implemented: true,
      },
    ],
  },
  {
    category: "Infrastructure Security",
    icon: Server,
    features: [
      {
        name: "Cloud Security",
        description: "AWS security best practices with VPC isolation",
        implemented: true,
      },
      {
        name: "DDoS Protection",
        description: "Automatic scaling and traffic filtering",
        implemented: true,
      },
      {
        name: "Penetration Testing",
        description: "Quarterly third-party security assessments",
        implemented: true,
      },
      {
        name: "Vulnerability Management",
        description: "Continuous scanning with automated patching",
        implemented: true,
      },
    ],
  },
];

const complianceFrameworks = [
  {
    name: "Healthcare (HIPAA)",
    requirements: [
      "Patient data encryption",
      "Audit logging",
      "Access controls",
      "Business associate agreements",
    ],
    industries: ["Medical Devices", "Pharmaceutical", "Healthcare Supply Chain"],
  },
  {
    name: "Financial Services",
    requirements: [
      "PCI DSS compliance",
      "Fraud detection",
      "Transaction monitoring", 
      "Financial audit trails",
    ],
    industries: ["Banks", "Credit Unions", "Payment Processors"],
  },
  {
    name: "Government & Defense",
    requirements: [
      "FedRAMP authorization",
      "NIST cybersecurity framework",
      "Multi-level security",
      "Classified data handling",
    ],
    industries: ["Federal Agencies", "Defense Contractors", "State & Local Gov"],
  },
];

export default function SecurityPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container-enterprise">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="secondary" className="mb-4">
                🔒 Security & Compliance
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Enterprise-Grade Security
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Built for Your Peace of Mind
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                SOC 2 Type II certified with ISO 27001 compliance. Your warehouse data is protected 
                with bank-level encryption, 24/7 monitoring, and zero-trust architecture.
              </p>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="text-center p-6">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600 mb-1">99.99%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </Card>
              <Card className="text-center p-6">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600 mb-1">&lt;1hr</div>
                <div className="text-sm text-muted-foreground">Incident Response</div>
              </Card>
              <Card className="text-center p-6">
                <Eye className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-600 mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Security Monitoring</div>
              </Card>
              <Card className="text-center p-6">
                <Award className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-orange-600 mb-1">5+</div>
                <div className="text-sm text-muted-foreground">Certifications</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 bg-muted/30">
          <div className="container-enterprise">
            <div className="text-center mb-12">
              <Badge className="mb-4">🏆 Certifications & Compliance</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Audited by Industry Leaders
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Independent third-party audits verify our security controls meet the highest industry standards
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {certifications.map((cert) => (
                <Card key={cert.name} className="text-center p-6 hover:shadow-lg transition-all">
                  <cert.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold mb-2">{cert.name}</h3>
                  <Badge variant="secondary" className="mb-3">
                    {cert.status} {cert.year}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cert.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-16">
          <div className="container-enterprise">
            <div className="text-center mb-12">
              <Badge className="mb-4">🛡️ Security Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Defense in Depth Protection
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Multiple layers of security controls protect your warehouse data and operations
              </p>
            </div>

            <div className="space-y-12">
              {securityFeatures.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <category.icon className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-bold">{category.category}</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {category.features.map((feature) => (
                      <Card key={feature.name} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold">{feature.name}</h4>
                          {feature.implemented ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Compliance */}
        <section className="py-16 bg-muted/30">
          <div className="container-enterprise">
            <div className="text-center mb-12">
              <Badge className="mb-4">🏢 Industry Compliance</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for Regulated Industries
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                LogiVox meets specific compliance requirements for highly regulated industries
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {complianceFrameworks.map((framework) => (
                <Card key={framework.name} className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl">{framework.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Requirements</h4>
                      <ul className="space-y-1">
                        {framework.requirements.map((req) => (
                          <li key={req} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Industries Served</h4>
                      <div className="flex flex-wrap gap-1">
                        {framework.industries.map((industry) => (
                          <Badge key={industry} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Team & Response */}
        <section className="py-16">
          <div className="container-enterprise">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge>🚨 Security Team</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  24/7 Security Operations Center
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our dedicated security team monitors threats around the clock, with 
                  automated response systems and expert incident handlers ready to protect your data.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Real-time threat monitoring active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">Average incident response: &lt;1 hour</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Certified security professionals on staff</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm">Zero data breaches since inception</span>
                  </div>
                </div>
              </div>
              <Card className="p-8">
                <h3 className="font-bold text-xl mb-4">Security Incident Response</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-red-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Detection (&lt;15 minutes)</p>
                      <p className="text-xs text-muted-foreground">AI-powered threat detection alerts our team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-yellow-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Response (&lt;1 hour)</p>
                      <p className="text-xs text-muted-foreground">Security team investigates and contains threat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Communication (&lt;4 hours)</p>
                      <p className="text-xs text-muted-foreground">Customer notification and status updates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Resolution (&lt;24 hours)</p>
                      <p className="text-xs text-muted-foreground">Full remediation and post-incident review</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="container-enterprise text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Security You Can Trust
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join 500+ warehouses that trust LogiVox with their most sensitive data. 
              Enterprise-grade security with small business simplicity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Secure Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Security Assessment</Link>
              </Button>
            </div>
            <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground mt-6">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-green-500" />
                <span>Zero breaches</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-green-500" />
                <span>24/7 monitoring</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}