import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Accessibility, Keyboard, Mic, Eye, MousePointer, Contrast } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Accessibility Statement',
  description: 'LogiVox Accessibility Statement - Our commitment to WCAG 2.1 AA compliance and inclusive design.',
}

export default function AccessibilityStatementPage() {
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
              <Accessibility className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold">Accessibility Statement</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl">
            LogiVox is committed to ensuring digital accessibility for all users, including those with disabilities.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge variant="outline" className="text-sm">WCAG 2.1 AA Compliant</Badge>
            <Badge variant="outline" className="text-sm">Section 508 Compliant</Badge>
            <Badge variant="outline" className="text-sm">ADA Compliant</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-enterprise max-w-4xl">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            
            {/* Commitment */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
              <p className="text-muted-foreground">
                LogiVox is dedicated to providing an inclusive and accessible experience for all users, regardless of ability or disability. We believe that everyone should be able to manage inventory, create bookings, and access reports with ease.
              </p>
              <p className="text-muted-foreground">
                We continuously work to enhance the accessibility of our platform and ensure compliance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA, Section 508 of the Rehabilitation Act, and the Americans with Disabilities Act (ADA).
              </p>
            </div>

            {/* Conformance Status */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Conformance Status</h2>
              <div className="bg-muted p-6 rounded-lg mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Accessibility className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">WCAG 2.1 Level AA Conformance</p>
                    <p className="text-sm text-muted-foreground">LogiVox conforms to WCAG 2.1 Level AA standards</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Conformance Status:</strong> Fully Conformant - The content fully conforms to the accessibility standard without any exceptions.
                </p>
              </div>
              <p className="text-muted-foreground">
                This means LogiVox meets all Level A and Level AA success criteria of the Web Content Accessibility Guidelines 2.1, ensuring our platform is perceivable, operable, understandable, and robust for all users.
              </p>
            </div>

            {/* Accessibility Features */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Accessibility Features</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Voice Control */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Voice Control</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Industry-first voice control feature for hands-free operation.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 25+ voice commands</li>
                    <li>• Navigate pages by voice</li>
                    <li>• Search and data entry</li>
                    <li>• Activate with Ctrl+Shift+V</li>
                    <li>• Real-time feedback</li>
                  </ul>
                </div>

                {/* Keyboard Navigation */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Keyboard className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Keyboard Navigation</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Complete keyboard accessibility throughout the platform.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Skip links to main content</li>
                    <li>• Logical tab order</li>
                    <li>• 20+ keyboard shortcuts</li>
                    <li>• Focus indicators</li>
                    <li>• Modal/dialog management</li>
                  </ul>
                </div>

                {/* Screen Reader Support */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Screen Reader Support</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Optimized for JAWS, NVDA, VoiceOver, and TalkBack.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Proper ARIA labels</li>
                    <li>• Live region announcements</li>
                    <li>• Semantic HTML structure</li>
                    <li>• Alternative text for images</li>
                    <li>• Descriptive link text</li>
                  </ul>
                </div>

                {/* Visual Accessibility */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Contrast className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Visual Accessibility</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Designed for users with visual impairments.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 4.5:1 color contrast ratio</li>
                    <li>• Resizable text (up to 200%)</li>
                    <li>• High contrast mode support</li>
                    <li>• Dark/light theme options</li>
                    <li>• No color-only indicators</li>
                  </ul>
                </div>

                {/* Motor Accessibility */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MousePointer className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Motor Accessibility</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Features for users with motor disabilities.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Large touch targets (44x44px)</li>
                    <li>• Voice control option</li>
                    <li>• No time limits on actions</li>
                    <li>• Click/tap alternatives</li>
                    <li>• Reduced motion support</li>
                  </ul>
                </div>

                {/* Cognitive Accessibility */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Accessibility className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Cognitive Accessibility</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Clear design for users with cognitive disabilities.
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Clear, simple language</li>
                    <li>• Consistent navigation</li>
                    <li>• Error prevention & recovery</li>
                    <li>• Contextual help</li>
                    <li>• Predictable interactions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Keyboard Shortcuts</h2>
              <p className="text-muted-foreground mb-4">
                LogiVox supports numerous keyboard shortcuts for efficient navigation. Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">Ctrl+Shift+K</kbd> or <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">?</kbd> anywhere in the app to view all available shortcuts.
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Common Shortcuts:</h3>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toggle voice control</span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded">Ctrl+Shift+V</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Show shortcuts</span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded">Ctrl+Shift+K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Focus search</span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded">Ctrl+K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toggle sidebar</span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded">Ctrl+B</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistive Technologies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Supported Assistive Technologies</h2>
              <p className="text-muted-foreground mb-4">
                LogiVox has been tested with and supports the following assistive technologies:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Screen Readers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• JAWS (Windows)</li>
                    <li>• NVDA (Windows)</li>
                    <li>• VoiceOver (macOS, iOS)</li>
                    <li>• TalkBack (Android)</li>
                    <li>• Narrator (Windows)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Other Tools</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Voice recognition software</li>
                    <li>• Screen magnification software</li>
                    <li>• Alternative input devices</li>
                    <li>• Browser accessibility features</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Browser Compatibility */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Browser Compatibility</h2>
              <p className="text-muted-foreground mb-4">
                LogiVox is designed to work with the following browsers and their accessibility features:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Google Chrome (latest 2 versions)</li>
                <li>• Mozilla Firefox (latest 2 versions)</li>
                <li>• Microsoft Edge (latest 2 versions)</li>
                <li>• Safari (latest 2 versions)</li>
              </ul>
            </div>

            {/* Technical Specifications */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Technical Specifications</h2>
              <p className="text-muted-foreground mb-4">
                LogiVox's accessibility relies on the following technologies:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>HTML:</strong> Semantic HTML5 elements</li>
                <li>• <strong>WAI-ARIA:</strong> Accessible Rich Internet Applications specifications</li>
                <li>• <strong>CSS:</strong> Responsive design, focus management, reduced motion queries</li>
                <li>• <strong>JavaScript:</strong> Keyboard event handling, ARIA live regions, focus trap</li>
                <li>• <strong>Web Speech API:</strong> Voice control functionality</li>
              </ul>
            </div>

            {/* Known Limitations */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Known Limitations</h2>
              <p className="text-muted-foreground mb-4">
                Despite our efforts, there may be some limitations. We are actively working to address the following:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Some complex charts may have limited screen reader support (alternative data tables provided)</li>
                <li>• Voice control requires modern browser with Web Speech API support</li>
                <li>• PDF exports may have variable accessibility depending on content</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                If you encounter any accessibility barriers, please <a href="#contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </div>

            {/* Testing & Evaluation */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Testing and Evaluation</h2>
              <p className="text-muted-foreground mb-4">
                LogiVox's accessibility has been evaluated using:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Automated testing tools (axe, WAVE, Lighthouse)</li>
                <li>• Manual testing with assistive technologies</li>
                <li>• User testing with people with disabilities</li>
                <li>• Third-party accessibility audits</li>
                <li>• Continuous integration accessibility checks</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Last Audit Date:</strong> October 1, 2025<br />
                <strong>Audit Firm:</strong> AccessibilityWorks Inc.<br />
                <strong>Result:</strong> WCAG 2.1 Level AA Conformant
              </p>
            </div>

            {/* Continuous Improvement */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Continuous Improvement</h2>
              <p className="text-muted-foreground">
                We are committed to continually improving the accessibility of LogiVox. Our ongoing efforts include:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Regular accessibility audits and testing</li>
                <li>• Training for development team on accessibility best practices</li>
                <li>• User feedback integration from accessibility community</li>
                <li>• Monitoring emerging accessibility standards and technologies</li>
                <li>• Quarterly accessibility reviews of new features</li>
              </ul>
            </div>

            {/* Feedback & Contact */}
            <div id="contact" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Feedback and Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                We welcome your feedback on the accessibility of LogiVox. If you encounter accessibility barriers or have suggestions for improvement, please contact us:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p className="font-semibold mb-2">Accessibility Team</p>
                <p className="text-muted-foreground">Email: <a href="mailto:accessibility@logivox.ai" className="text-primary hover:underline">accessibility@logivox.ai</a></p>
                <p className="text-muted-foreground">Phone: +1 (555) 123-4567</p>
                <p className="text-muted-foreground mt-4">
                  We aim to respond to accessibility feedback within 2 business days and to implement necessary changes within 30 days.
                </p>
              </div>
            </div>

            {/* Formal Complaints */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Formal Complaints</h2>
              <p className="text-muted-foreground">
                If you wish to file a formal complaint about LogiVox's accessibility:
              </p>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Contact our Accessibility Team (details above)</li>
                <li>If not satisfied, contact our Accessibility Officer at <a href="mailto:accessibility-officer@logivox.ai" className="text-primary hover:underline">accessibility-officer@logivox.ai</a></li>
                <li>For further escalation, you may file a complaint with:
                  <ul className="ml-8 mt-2 space-y-1 list-disc list-inside">
                    <li>U.S. Department of Justice (for ADA compliance)</li>
                    <li>U.S. Access Board (for Section 508 compliance)</li>
                    <li>Your local disability rights organization</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* Related Resources */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold mb-4">Related Resources</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/privacy" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Privacy Policy</div>
                    <div className="text-sm text-muted-foreground">Data protection & privacy</div>
                  </div>
                </Link>
                <Link href="/terms" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Accessibility className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Terms of Service</div>
                    <div className="text-sm text-muted-foreground">Platform usage terms</div>
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
