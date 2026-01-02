import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'LogiVox Terms of Service - Legal terms and conditions for using our enterprise inventory management platform.',
}

export default function TermsOfServicePage() {
  const lastUpdated = 'October 15, 2025'
  const effectiveDate = 'October 15, 2025'

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
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Legal terms and conditions governing your use of the LogiVox platform.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: {lastUpdated} | Effective Date: {effectiveDate}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            
            {/* Acceptance Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-6 mb-12">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Legal Agreement</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    By accessing or using LogiVox, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                These Terms of Service ("Terms") constitute a legally binding agreement between you (either an individual or entity, "you" or "Customer") and LogiVox Inc. ("LogiVox," "we," "us," or "our") governing your access to and use of the LogiVox platform, including our website, applications, and services (collectively, the "Service").
              </p>
              <p className="text-muted-foreground">
                BY CREATING AN ACCOUNT, ACCESSING, OR USING OUR SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY.
              </p>
            </div>

            {/* Definitions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>"Service"</strong> means the LogiVox enterprise inventory management and stock booking platform</li>
                <li><strong>"Account"</strong> means your unique account created to access the Service</li>
                <li><strong>"Organization"</strong> means the business entity or group you represent</li>
                <li><strong>"User"</strong> means any individual authorized by an Organization to use the Service</li>
                <li><strong>"Content"</strong> means data, information, and materials submitted or created through the Service</li>
                <li><strong>"Subscription"</strong> means your paid access to the Service features and capabilities</li>
              </ul>
            </div>

            {/* Account Registration */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">3. Account Registration and Eligibility</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Eligibility</h3>
              <p className="text-muted-foreground">
                You must be at least 18 years old and have the legal capacity to enter into contracts to use the Service. By using LogiVox, you represent and warrant that you meet these requirements.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Creation</h3>
              <p className="text-muted-foreground">
                To use the Service, you must create an Account by providing accurate, complete, and current information. You agree to:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Provide truthful and accurate registration information</li>
                <li>• Maintain and promptly update your Account information</li>
                <li>• Keep your password secure and confidential</li>
                <li>• Notify us immediately of any unauthorized access</li>
                <li>• Accept responsibility for all activities under your Account</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Business Use Only</h3>
              <p className="text-muted-foreground">
                LogiVox is designed for business and commercial use. You may not use the Service for personal, family, or household purposes.
              </p>
            </div>

            {/* License and Access */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">4. License and Access Rights</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 License Grant</h3>
              <p className="text-muted-foreground">
                Subject to these Terms and payment of applicable fees, LogiVox grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal business operations.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Restrictions</h3>
              <p className="text-muted-foreground">You agree NOT to:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Copy, modify, or create derivative works of the Service</li>
                <li>• Reverse engineer, decompile, or disassemble the Service</li>
                <li>• Rent, lease, lend, sell, or sublicense access to the Service</li>
                <li>• Use the Service to build a competitive product or service</li>
                <li>• Remove or alter any proprietary notices or labels</li>
                <li>• Use automated systems (bots, scrapers) without authorization</li>
                <li>• Attempt to gain unauthorized access to any systems or networks</li>
                <li>• Interfere with or disrupt the Service's operation</li>
              </ul>
            </div>

            {/* Subscriptions and Payments */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">5. Subscriptions and Payments</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Subscription Plans</h3>
              <p className="text-muted-foreground">
                LogiVox offers various subscription plans with different features and pricing. Current plans and pricing are available at logivox.ai/pricing.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Billing and Payment</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Subscriptions are billed in advance on a monthly or annual basis</li>
                <li>• Payment is due immediately upon subscription or renewal</li>
                <li>• You authorize us to charge your payment method on file</li>
                <li>• All fees are non-refundable except as required by law</li>
                <li>• Prices are subject to change with 30 days' notice</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Auto-Renewal</h3>
              <p className="text-muted-foreground">
                Subscriptions automatically renew at the end of each billing period unless canceled at least 24 hours before renewal. You can cancel auto-renewal in your Account settings.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Free Trials</h3>
              <p className="text-muted-foreground">
                We may offer free trials of paid features. At the end of the trial period, you will be automatically charged for a subscription unless you cancel before the trial ends.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.5 Taxes</h3>
              <p className="text-muted-foreground">
                All fees are exclusive of applicable taxes (sales tax, VAT, GST). You are responsible for paying all applicable taxes.
              </p>
            </div>

            {/* User Content */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">6. User Content and Data</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Your Content</h3>
              <p className="text-muted-foreground">
                You retain all ownership rights to Content you submit, post, or display through the Service. By submitting Content, you grant LogiVox a worldwide, non-exclusive, royalty-free license to use, store, process, and display your Content solely to provide and improve the Service.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Content Responsibility</h3>
              <p className="text-muted-foreground">You are solely responsible for your Content and warrant that:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• You own or have the necessary rights to use and share the Content</li>
                <li>• Your Content does not violate any laws or third-party rights</li>
                <li>• Your Content does not contain malware, viruses, or harmful code</li>
                <li>• Your Content is accurate and not misleading</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Data Backup</h3>
              <p className="text-muted-foreground">
                While we perform regular backups, you are responsible for maintaining your own backup copies of your Content. LogiVox is not liable for any loss or corruption of Content.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Data Security</h3>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data. However, no system is 100% secure. See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>

            {/* Acceptable Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">7. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-3">You agree to use the Service only for lawful purposes and in accordance with these Terms. Prohibited activities include:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Violating any applicable laws or regulations</li>
                <li>• Infringing on intellectual property rights</li>
                <li>• Transmitting harmful, offensive, or inappropriate content</li>
                <li>• Harassing, threatening, or impersonating others</li>
                <li>• Collecting or harvesting user information without consent</li>
                <li>• Distributing spam, malware, or phishing attempts</li>
                <li>• Engaging in fraudulent or deceptive practices</li>
                <li>• Overloading or disrupting the Service infrastructure</li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">8.1 LogiVox Property</h3>
              <p className="text-muted-foreground">
                The Service, including all software, designs, text, graphics, logos, and trademarks, is owned by LogiVox and protected by copyright, trademark, and other intellectual property laws. All rights not expressly granted are reserved.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Trademarks</h3>
              <p className="text-muted-foreground">
                "LogiVox" and associated logos are trademarks of LogiVox Inc. You may not use our trademarks without prior written permission.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Feedback</h3>
              <p className="text-muted-foreground">
                If you provide feedback, suggestions, or ideas about the Service, you grant LogiVox a perpetual, irrevocable, worldwide, royalty-free license to use, modify, and incorporate such feedback without compensation or attribution.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">9. Third-Party Services and Integrations</h2>
              <p className="text-muted-foreground">
                LogiVox may integrate with third-party services (ERP systems, payment processors, analytics tools). Your use of third-party services is subject to their own terms and privacy policies. LogiVox is not responsible for third-party services.
              </p>
            </div>

            {/* Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">10. Privacy and Data Protection</h2>
              <p className="text-muted-foreground">
                Our collection and use of personal information is governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using the Service, you consent to our privacy practices as described in the Privacy Policy.
              </p>
            </div>

            {/* Warranties and Disclaimers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">11. Warranties and Disclaimers</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Service Warranty</h3>
              <p className="text-muted-foreground">
                LogiVox warrants that the Service will perform substantially as described in our documentation. If the Service does not conform to this warranty, your sole remedy is for LogiVox to use commercially reasonable efforts to correct the issue.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Disclaimer</h3>
              <p className="text-muted-foreground font-semibold uppercase">
                EXCEPT AS EXPRESSLY PROVIDED, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-muted-foreground mt-3">
                LogiVox does not warrant that:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• The Service will be uninterrupted or error-free</li>
                <li>• Defects will be corrected</li>
                <li>• The Service is free from viruses or harmful components</li>
                <li>• Results from using the Service will be accurate or reliable</li>
              </ul>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
              <p className="text-muted-foreground font-semibold uppercase mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOGIVOX SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="space-y-1 text-muted-foreground uppercase">
                <li>• INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                <li>• LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
                <li>• COSTS OF PROCUREMENT OF SUBSTITUTE SERVICES</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                IN NO EVENT SHALL LOGIVOX'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO LOGIVOX IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </div>

            {/* Indemnification */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless LogiVox, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Your use or misuse of the Service</li>
                <li>• Your violation of these Terms</li>
                <li>• Your violation of any third-party rights</li>
                <li>• Your Content or data submitted through the Service</li>
              </ul>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">14. Termination</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">14.1 Termination by You</h3>
              <p className="text-muted-foreground">
                You may terminate your Account at any time by contacting support or using the cancellation feature in your Account settings.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">14.2 Termination by Us</h3>
              <p className="text-muted-foreground">
                We may suspend or terminate your access immediately, without notice, for:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Violation of these Terms or applicable laws</li>
                <li>• Non-payment of fees</li>
                <li>• Fraudulent or illegal activity</li>
                <li>• Threat to the security or integrity of the Service</li>
                <li>• At our sole discretion for any or no reason</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">14.3 Effect of Termination</h3>
              <p className="text-muted-foreground">
                Upon termination:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Your license to use the Service immediately terminates</li>
                <li>• You must cease all use of the Service</li>
                <li>• We may delete your Account and Content after 30 days</li>
                <li>• You remain liable for all fees incurred before termination</li>
                <li>• Provisions that should survive termination will remain in effect</li>
              </ul>
            </div>

            {/* Dispute Resolution */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">15. Dispute Resolution and Governing Law</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">15.1 Governing Law</h3>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">15.2 Arbitration</h3>
              <p className="text-muted-foreground">
                Any disputes arising from these Terms or the Service will be resolved through binding arbitration in San Francisco, California, in accordance with the American Arbitration Association's Commercial Arbitration Rules.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">15.3 Class Action Waiver</h3>
              <p className="text-muted-foreground">
                You agree that disputes will be resolved on an individual basis, not as a class action, class arbitration, or other representative action.
              </p>
            </div>

            {/* General Provisions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">16. General Provisions</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">16.1 Changes to Terms</h3>
              <p className="text-muted-foreground">
                We may modify these Terms at any time. Material changes will be notified via email or Service notification. Continued use after changes constitutes acceptance.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">16.2 Entire Agreement</h3>
              <p className="text-muted-foreground">
                These Terms, together with our Privacy Policy and any applicable order forms, constitute the entire agreement between you and LogiVox.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">16.3 Severability</h3>
              <p className="text-muted-foreground">
                If any provision is found unenforceable, the remaining provisions will continue in full effect.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">16.4 Waiver</h3>
              <p className="text-muted-foreground">
                Failure to enforce any right or provision does not constitute a waiver of that right or provision.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">16.5 Assignment</h3>
              <p className="text-muted-foreground">
                You may not assign these Terms without our written consent. LogiVox may assign these Terms at any time.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">16.6 Force Majeure</h3>
              <p className="text-muted-foreground">
                LogiVox is not liable for failures or delays due to circumstances beyond our reasonable control.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">17. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms, please contact:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-semibold mb-2">LogiVox Legal Team</p>
                <p className="text-muted-foreground">Email: <a href="mailto:legal@logivox.ai" className="text-primary hover:underline">legal@logivox.ai</a></p>
                <p className="text-muted-foreground mt-4">
                  Address:<br />
                  LogiVox Inc.<br />
                  123 Enterprise Way<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-semibold mb-2">Acknowledgment</p>
              <p className="text-sm text-muted-foreground">
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
              </p>
            </div>

            {/* Related Policies */}
            <div className="border-t pt-8 mt-8">
              <h3 className="text-xl font-semibold mb-4">Related Policies</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/privacy" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Privacy Policy</div>
                    <div className="text-sm text-muted-foreground">Data protection & privacy</div>
                  </div>
                </Link>
                <Link href="/accessibility" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
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
