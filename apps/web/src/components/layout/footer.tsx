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
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container-enterprise">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">LogiVox</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm">
              Complete warehouse management system with wave picking, real-time inventory tracking, 
              and intelligent order fulfillment.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>hello@logivox.ai</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-slate-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-slate-500" />
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
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                    >
                      {link.icon && <link.icon className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />}
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-slate-800 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Stay updated</h3>
              <p className="text-slate-400">
                Get the latest updates on warehouse automation, new features, and industry insights.
              </p>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border border-slate-700 bg-slate-900 rounded-md text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button type="submit">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-slate-500">
              © {currentYear} LogiVox, Inc. All rights reserved.
            </div>
            
            {/* Legal links */}
            <div className="flex flex-wrap items-center space-x-6">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="text-slate-600">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise badge */}
        <div className="border-t border-slate-800 py-4">
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
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