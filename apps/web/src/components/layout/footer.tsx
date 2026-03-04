"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  Calendar,
  Warehouse,
  Mic,
  ShieldCheck,
  Package,
  ClipboardCheck,
  Truck,
  Globe,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Solutions",
      links: [
        {
          name: "Warehouse Management",
          href: "/solutions/warehouse-management",
        },
        { name: "Inbound & Inventory", href: "/solutions/inbound-inventory" },
        { name: "Slotting Optimization", href: "/solutions/slotting-optimization" },
        { name: "Voice Operations", href: "/solutions/voice-operations" },
        { name: "Inventory Tracking", href: "/solutions/inventory" },
        { name: "Order Fulfillment", href: "/solutions/fulfillment" },
        { name: "Returns Management", href: "/solutions/returns" },
        { name: "Quality Control", href: "/solutions/quality-control" },
        { name: "Labor Management", href: "/solutions/labor-management" },
        { name: "3PL Operations", href: "/solutions/3pl" },
      ],
    },
    {
      title: "Platform",
      links: [
        { name: "Security", href: "/platform/security" },
        { name: "Integrations", href: "/platform/integrations" },
        { name: "API Docs", href: "/docs/api" },
        { name: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "/docs" },
        { name: "Help Center", href: "/help" },
        { name: "Blog", href: "/blog" },
        { name: "Supported Devices", href: "/supported-devices" },
        { name: "Status", href: "/status" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Careers", href: "/careers" },
        { name: "Partners", href: "/partners" },
      ],
    },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security", href: "/security" },
    { name: "Status", href: "/status" },
  ];

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/logivox", icon: Twitter },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/logivox",
      icon: Linkedin,
    },
    { name: "GitHub", href: "https://github.com/logivox", icon: Github },
    { name: "YouTube", href: "https://youtube.com/logivox", icon: Youtube },
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container-enterprise">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Company Info & Contact */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/"
              className="flex items-center space-x-3 mb-4 group w-fit"
            >
              <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
                <Image
                  src="/favicon.svg"
                  alt="LogiVox Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                LogiVox
              </span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm text-sm leading-relaxed">
              Complete warehouse management system with wave picking, real-time
              inventory tracking, and intelligent order fulfillment.
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
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-4 w-4" />
                    <span className="sr-only">{social.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="">
              <h3 className="font-semibold text-white mb-4 text-sm">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-slate-800 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Stay updated
              </h3>
              <p className="text-sm text-slate-400">
                Get the latest updates on warehouse automation and new features.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-slate-700 bg-slate-900 rounded-md text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button type="submit" className="sm:w-auto">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © {currentYear} LogiVox. All rights reserved.
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise badge */}
        <div className="border-t border-slate-800 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Shield className="h-3 w-3" />
              <span>Enterprise Security</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center space-x-1.5">
              <Building2 className="h-3 w-3" />
              <span>SOC 2 Compliant</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center space-x-1.5">
              <Zap className="h-3 w-3" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
