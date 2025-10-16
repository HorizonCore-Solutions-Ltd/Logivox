import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Database, Eye, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FlowStock Privacy Policy - How we collect, use, and protect your data. GDPR and CCPA compliant.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 15, 2025'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container-enterprise flex h-16 items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-muted/50 py-16">
        <div className="container-enterprise">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Your privacy is important to us. This policy explains how FlowStock collects, uses, and protects your personal information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            
            {/* Introduction */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">1. Introduction</h2>
              </div>
              <p className="text-muted-foreground">
                FlowStock ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our enterprise stock booking and inventory management platform.
              </p>
              <p className="text-muted-foreground">
                This policy complies with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable data protection laws.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">2. Information We Collect</h2>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title</li>
                <li><strong>Business Information:</strong> Organization details, team member information, supplier/customer data</li>
                <li><strong>Inventory Data:</strong> Product information, stock levels, warehouse locations, pricing</li>
                <li><strong>Transaction Data:</strong> Booking records, inventory movements, order history</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by third-party providers)</li>
                <li><strong>Communications:</strong> Support requests, feedback, survey responses</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Automatically Collected</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Cookies & Tracking:</strong> Session cookies, preference cookies, analytics cookies (see our Cookie Policy)</li>
                <li><strong>Log Data:</strong> Access times, error logs, security events</li>
                <li><strong>Voice Data:</strong> Voice command recordings when using our voice control feature (processed locally, not stored)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>ERP Integration Data:</strong> Data synchronized from Oracle, SAP, NetSuite, or other ERP systems</li>
                <li><strong>Authentication Providers:</strong> Information from SSO providers (Google, Microsoft, etc.)</li>
                <li><strong>Payment Processors:</strong> Transaction confirmations from Stripe or other payment providers</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">3. How We Use Your Information</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">We use your information for the following purposes:</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Service Delivery</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Provide and maintain the FlowStock platform</li>
                <li>Process inventory bookings and transactions</li>
                <li>Generate reports and analytics</li>
                <li>Send automated reorder alerts and notifications</li>
                <li>Enable voice control and accessibility features</li>
                <li>Synchronize data with your ERP systems</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Communication</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Send service-related notifications and updates</li>
                <li>Respond to support requests and inquiries</li>
                <li>Provide training and onboarding assistance</li>
                <li>Send important security and compliance updates</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Improvement & Analytics</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Analyze usage patterns to improve features</li>
                <li>Conduct research and development</li>
                <li>Monitor system performance and reliability</li>
                <li>Train AI/ML models for inventory forecasting (aggregated, anonymized data only)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Security & Compliance</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Detect and prevent fraud and security threats</li>
                <li>Maintain audit logs for compliance</li>
                <li>Enforce our Terms of Service</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Marketing (with consent)</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Send promotional emails about new features</li>
                <li>Provide relevant content and resources</li>
                <li>Conduct surveys and gather feedback</li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">4. How We Share Your Information</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">We do not sell your personal information. We may share your data in the following circumstances:</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Service Providers</h3>
              <p className="text-muted-foreground">
                We work with trusted third-party service providers who assist us in operating our platform:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Cloud Infrastructure:</strong> AWS, Google Cloud, or Microsoft Azure for hosting</li>
                <li><strong>Analytics:</strong> Google Analytics, Vercel Analytics for usage insights</li>
                <li><strong>Payment Processing:</strong> Stripe for secure payment handling</li>
                <li><strong>Email Services:</strong> SendGrid, AWS SES for transactional emails</li>
                <li><strong>Monitoring:</strong> Sentry, Datadog for error tracking and performance</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Within Your Organization</h3>
              <p className="text-muted-foreground">
                Data is shared with authorized users within your organization according to your configured role-based access controls.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information if required by law, court order, or governmental request, or to protect our rights and safety.
              </p>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">5. Data Security</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">
                We implement industry-leading security measures to protect your data:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest</li>
                <li><strong>Access Control:</strong> Multi-factor authentication, role-based permissions, zero-trust architecture</li>
                <li><strong>Infrastructure:</strong> SOC 2 Type II compliant hosting, regular security audits</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring, intrusion detection, automated threat response</li>
                <li><strong>Data Isolation:</strong> Complete tenant isolation, encrypted database connections</li>
                <li><strong>Backups:</strong> Automated daily backups with point-in-time recovery</li>
                <li><strong>Incident Response:</strong> Dedicated security team, 24-hour breach notification</li>
              </ul>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold m-0">6. Your Privacy Rights</h2>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">6.1 GDPR Rights (EU Users)</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                <li><strong>Right to Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.2 CCPA Rights (California Users)</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Right to Know:</strong> What personal information we collect, use, and share</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we don't sell data)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Exercising Your Rights</h3>
              <p className="text-muted-foreground">
                To exercise any of these rights, please contact us at <a href="mailto:privacy@flowstock.com" className="text-primary hover:underline">privacy@flowstock.com</a> or use the privacy controls in your account settings. We will respond within 30 days.
              </p>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Account Data:</strong> Retained while your account is active, plus 90 days after deletion</li>
                <li><strong>Transaction Records:</strong> 7 years for tax and accounting compliance</li>
                <li><strong>Audit Logs:</strong> 3 years for security and compliance</li>
                <li><strong>Marketing Data:</strong> Until you unsubscribe or request deletion</li>
                <li><strong>Backups:</strong> 90 days in encrypted backup storage</li>
              </ul>
            </div>

            {/* International Transfers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your data may be processed in countries outside your residence. We ensure adequate protection through:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Data Processing Agreements with all service providers</li>
                <li>Compliance with EU-U.S. Data Privacy Framework principles</li>
                <li>Regional data residency options available for enterprise customers</li>
              </ul>
            </div>

            {/* Children's Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                FlowStock is a business-to-business (B2B) platform not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">10. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your experience. For detailed information, please see our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>. You can manage your cookie preferences through our cookie consent banner.
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on our platform. Your continued use of FlowStock after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-semibold mb-2">FlowStock Privacy Team</p>
                <p className="text-muted-foreground">Email: <a href="mailto:privacy@flowstock.com" className="text-primary hover:underline">privacy@flowstock.com</a></p>
                <p className="text-muted-foreground">Data Protection Officer: <a href="mailto:dpo@flowstock.com" className="text-primary hover:underline">dpo@flowstock.com</a></p>
                <p className="text-muted-foreground mt-4">
                  Address:<br />
                  FlowStock Inc.<br />
                  123 Enterprise Way<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </div>
            </div>

            {/* Related Policies */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold mb-4">Related Policies</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/terms" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Terms of Service</div>
                    <div className="text-sm text-muted-foreground">Platform usage terms</div>
                  </div>
                </Link>
                <Link href="/accessibility" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Accessibility Statement</div>
                    <div className="text-sm text-muted-foreground">WCAG 2.1 AA compliance</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
