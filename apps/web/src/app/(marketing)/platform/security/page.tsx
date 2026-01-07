"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Key,
  Eye,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Server,
  AlertTriangle,
  Fingerprint,
  Database,
} from "lucide-react";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: "Military-Grade Security",
      description:
        "AES-256 encryption (same as used by military/government), zero-trust architecture, and continuous threat monitoring.",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description:
        "AES-256 encryption for data at rest and TLS 1.3 for data in transit.",
    },
    {
      icon: Key,
      title: "Multi-Factor Authentication",
      description:
        "Require MFA with TOTP, SMS, hardware keys, or biometric authentication.",
    },
    {
      icon: Shield,
      title: "Zero Trust Architecture",
      description:
        "Never trust, always verify with continuous authentication and authorization.",
    },
    {
      icon: Eye,
      title: "Complete Audit Logging",
      description:
        "Immutable audit trails for all activities with forensic-level detail for compliance.",
    },
    {
      icon: Fingerprint,
      title: "Biometric Authentication",
      description:
        "Support for fingerprint and facial recognition on compatible devices.",
    },
    {
      icon: Server,
      title: "DDoS Protection",
      description:
        "Enterprise-grade protection against distributed denial of service attacks.",
    },
    {
      icon: Database,
      title: "Business Continuity",
      description:
        "99.99% uptime SLA with automated failover, disaster recovery, real-time backups, and multi-region redundancy.",
    },
  ];

  const complianceStandards = [
    { name: "SOC 2 Type II", description: "Audited security controls" },
    { name: "ISO 27001", description: "Information security management" },
    { name: "GDPR", description: "European data protection" },
    { name: "HIPAA", description: "Healthcare data security" },
    { name: "PCI DSS", description: "Payment card security" },
    { name: "CCPA", description: "California privacy rights" },
  ];

  const securityLayers = [
    {
      title: "Application Security",
      description:
        "Secure coding practices, regular security audits, and penetration testing",
      icon: ShieldCheck,
      features: [
        "Input validation",
        "SQL injection prevention",
        "XSS protection",
        "CSRF tokens",
      ],
    },
    {
      title: "Infrastructure Security",
      description:
        "Hardened servers, network segmentation, and intrusion detection systems",
      icon: Server,
      features: [
        "Firewall rules",
        "Network isolation",
        "IDS/IPS",
        "Regular patching",
      ],
    },
    {
      title: "Data Security",
      description:
        "Encryption, access controls, and secure backup and recovery procedures",
      icon: Database,
      features: [
        "At-rest encryption",
        "In-transit encryption",
        "Key management",
        "Secure backups",
      ],
    },
    {
      title: "Access Control",
      description:
        "Role-based permissions, least privilege principle, and session management",
      icon: Key,
      features: [
        "RBAC",
        "Least privilege",
        "Session timeout",
        "IP whitelisting",
      ],
    },
  ];

  const benefits = [
    "AI Assistant: Public (no internet) & tenant-aware for logged-in users",
    "Military-grade AES-256 encryption & zero-trust architecture",
    "99.99% uptime with advanced business continuity",
    "Protect sensitive inventory and customer data",
    "Meet regulatory compliance requirements (SOC 2, ISO 27001, GDPR)",
    "Prevent unauthorized access and data breaches",
    "Complete audit trail for security investigations",
    "Automated threat detection and response",
    "24/7 security monitoring and alerts",
    "Real-time backups with disaster recovery",
    "Multi-region redundancy and automated failover",
    "Regular security updates and patches",
    "Dedicated security team and incident response",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Enterprise Security
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Bank-level security architecture protecting your inventory data
              and operations. Built with zero-trust principles, advanced
              encryption, and continuous monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Security Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Multi-Layer Security</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive protection at every level of the stack
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meeting the highest industry standards and regulations
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {complianceStandards.map((standard) => (
              <Card key={standard.name} className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{standard.name}</CardTitle>
                  <CardDescription>{standard.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Defense in Depth</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple security layers ensure comprehensive protection
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {securityLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <Card key={layer.title}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{layer.title}</CardTitle>
                        <CardDescription className="mb-4">
                          {layer.description}
                        </CardDescription>
                        <div className="grid grid-cols-2 gap-2">
                          {layer.features.map((feature) => (
                            <div
                              key={feature}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container-enterprise">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Benefits</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Peace of Mind for Your Business
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our security-first approach protects your operations while
                enabling growth.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle>Security Dashboard</CardTitle>
                  <CardDescription>
                    Monitor security events in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Security monitoring dashboard will be available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 lg:py-28">
        <div className="container-enterprise">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              24/7 Security Operations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our security team is always watching
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: Eye,
                title: "Continuous Monitoring",
                description: "Real-time threat detection across all systems",
              },
              {
                icon: AlertTriangle,
                title: "Instant Alerts",
                description: "Immediate notification of security events",
              },
              {
                icon: ShieldCheck,
                title: "Rapid Response",
                description: "Expert team responds within minutes",
              },
              {
                icon: FileText,
                title: "Detailed Reports",
                description: "Complete incident analysis and remediation",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="text-center">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-enterprise text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Security You Can Trust</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of companies relying on LogiVox's enterprise security
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/contact">Request Security Assessment</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
