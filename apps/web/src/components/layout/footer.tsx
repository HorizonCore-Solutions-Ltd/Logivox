"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Shield,
  Zap,
  BarChart3,
  Users,
  FileText,
  HelpCircle,
  BookOpen,
  Calendar
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Solutions",
      links: [
        { name: "Stock Booking", href: "/solutions/stock-booking", icon: Building2 },
        { name: "ERP Integration", href: "/solutions/erp-integration", icon: Zap },
        { name: "Analytics", href: "/solutions/analytics", icon: BarChart3 },
        { name: "Multi-Tenant", href: "/solutions/multi-tenant", icon: Users },
      ],
    },
    {
      title: "Platform",
      links: [
        { name: "Security", href: "/platform/security", icon: Shield },
        { name: "API Documentation", href: "/docs/api", icon: FileText },
        { name: "Integrations", href: "/platform/integrations", icon: Zap },
        { name: "Enterprise", href: "/platform/enterprise", icon: Building2 },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "/docs", icon: BookOpen },
        { name: "Help Center", href: "/help", icon: HelpCircle },
        { name: "Blog", href: "/blog", icon: FileText },
        { name: "Webinars", href: "/webinars", icon: Calendar },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about", icon: Building2 },
        { name: "Careers", href: "/careers", icon: Users },
        { name: "Contact", href: "/contact", icon: Mail },
        { name: "Partners", href: "/partners", icon: Users },
      ],
    },
  ]

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security", href: "/security" },
    { name: "Status", href: "/status" },
  ]

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/flowstock", icon: Twitter },
    { name: "LinkedIn", href: "https://linkedin.com/company/flowstock", icon: Linkedin },
    { name: "GitHub", href: "https://github.com/flowstock", icon: Github },
    { name: "YouTube", href: "https://youtube.com/flowstock", icon: Youtube },
  ]

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container-enterprise">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">FlowStock</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Enterprise-grade stock booking and inventory management platform. 
              Streamline your operations with zero-trust security and multi-tenant architecture.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>hello@flowstock.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  asChild
                >
                  <Link href={social.href} target="_blank" rel="noopener noreferrer">
                    <social.icon className="h-4 w-4" />
                    <span className="sr-only">{social.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2"
                    >
                      {link.icon && <link.icon className="h-4 w-4" />}
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Stay updated</h3>
              <p className="text-muted-foreground">
                Get the latest updates on new features, integrations, and best practices.
              </p>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <Button type="submit">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} FlowStock, Inc. All rights reserved.
            </div>
            
            {/* Legal links */}
            <div className="flex flex-wrap items-center space-x-6">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="text-muted-foreground">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise badge */}
        <div className="border-t py-4">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3" />
              <span>Enterprise Security</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Building2 className="h-3 w-3" />
              <span>SOC 2 Compliant</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3" />
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}