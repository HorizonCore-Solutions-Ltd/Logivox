"use client";

// Navigation: marketing header with mega menus and conversion-focused CTAs (Pricing, Demo, Trial) for desktop and mobile.

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Menu,
  X,
  ChevronDown,
  Shield,
  Zap,
  BarChart3,
  Database,
  Globe,
  FileText,
  BookOpen,
  Users,
  Phone,
  Package,
  Truck,
  MapPin,
  ShieldCheck,
  Mic,
  LineChart,
  Warehouse,
  ClipboardCheck,
  Radio,
  AlertTriangle,
  ArrowLeftRight,
  Box,
  BadgeCheck,
  Briefcase,
  Gift,
  RefreshCw,
  LayoutGrid,
  Leaf,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const solutions = [
    {
      title: "Warehouse Management",
      description: "Complete WMS with real-time inventory control",
      icon: Warehouse,
      href: "/solutions/warehouse-management",
    },
    {
      title: "Labor Management",
      description: "Workforce optimization and productivity tracking",
      icon: Users,
      href: "/solutions/labor-management",
    },
    {
      title: "Sustainability Suite",
      description: "Carbon tracking and green logistics optimization",
      icon: Leaf,
      href: "/solutions/sustainability",
    },
    {
      title: "Task Interleaving",
      description: "Smart task combining to reduce deadhead travel",
      icon: GitMerge,
      href: "/solutions/task-interleaving",
    },
    {
      title: "Labor Management",
      description: "Workforce optimization and productivity tracking",
      icon: Users,
      href: "/solutions/labor-management",
    },
    {
      title: "Sustainability Suite",
      description: "Carbon tracking and green logistics optimization",
      icon: Leaf,
      href: "/solutions/sustainability",
    },
    {
      title: "Task Interleaving",
      description: "Smart task combining to reduce deadhead travel",
      icon: GitMerge,
      href: "/solutions/task-interleaving",
    },
    {
      title: "AI Slotting Optimization",
      description: "Smart inventory placement based on velocity",
      icon: LayoutGrid,
      href: "/solutions/slotting-optimization",
    },
    {
      title: "Voice-Enabled Operations",
      description: "Hands-free voice commands for warehouse tasks",
      icon: Mic,
      href: "/solutions/voice-operations",
    },
    {
      title: "Returns Management",
      description: "Streamlined RMA processing and reverse logistics",
      icon: Package,
      href: "/solutions/returns",
    },
    {
      title: "Yard Management",
      description: "Smart parking and dock scheduling optimization",
      icon: MapPin,
      href: "/solutions/yard-management",
    },
    {
      title: "Inventory Management",
      description: "Real-time stock tracking and cycle counting",
      icon: Package,
      href: "/solutions/inventory",
    },
    {
      title: "Order Fulfillment",
      description: "Picking, packing, and shipping optimization",
      icon: ClipboardCheck,
      href: "/solutions/fulfillment",
    },
    {
      title: "Transportation Management",
      description: "Load planning and route optimization",
      icon: Truck,
      href: "/solutions/transportation",
    },
    {
      title: "Cross-Docking Operations",
      description: "Fast-moving goods with minimal storage",
      icon: ArrowLeftRight,
      href: "/solutions/cross-docking",
    },
    {
      title: "Kitting & Assembly",
      description: "Product bundling and light assembly",
      icon: Box,
      href: "/solutions/kitting",
    },
    {
      title: "Quality Control & Inspection",
      description: "AQL sampling and defect management",
      icon: BadgeCheck,
      href: "/solutions/quality-control",
    },
    {
      title: "Labor Management System",
      description: "Workforce productivity and time tracking",
      icon: Briefcase,
      href: "/solutions/labor-management",
    },
    {
      title: "3PL Multi-Client Operations",
      description: "Complete client segregation and billing",
      icon: Building2,
      href: "/solutions/3pl",
    },
    {
      title: "Value-Added Services",
      description: "Labeling, bundling, and customization",
      icon: Gift,
      href: "/solutions/value-added-services",
    },
    {
      title: "Replenishment & Demand Planning",
      description: "Automated reorder triggers and demand forecasting",
      icon: RefreshCw,
      href: "/solutions/replenishment",
    },
    {
      title: "AI Analytics & Forecasting",
      description: "Predictive insights and demand forecasting",
      icon: LineChart,
      href: "/solutions/analytics",
    },
  ];

  const platform = [
    {
      title: "AI Assistant",
      description: "Public & tenant-aware intelligent assistant",
      icon: Radio,
      href: "/platform/ai-assistant",
    },
    {
      title: "Security",
      description: "Military-grade security & compliance",
      icon: Shield,
      href: "/platform/security",
    },
    {
      title: "Integrations",
      description: "Connect with your existing tools",
      icon: Globe,
      href: "/platform/integrations",
    },
    {
      title: "API Documentation",
      description: "Comprehensive API reference",
      icon: FileText,
      href: "/docs/api",
    },
    {
      title: "Business Continuity",
      description: "99.99% uptime & disaster recovery",
      icon: AlertTriangle,
      href: "/platform/business-continuity",
    },
    {
      title: "Multi-Tenant",
      description: "Complete data isolation per tenant",
      icon: Building2,
      href: "/platform/multi-tenant",
    },
  ];

  const servicesSupport = [
    {
      title: "24/7 Support Center",
      description: "Enterprise-grade support with guaranteed SLA",
      icon: Phone,
      href: "/services/support",
    },
    {
      title: "Implementation Services",
      description: "Expert deployment and go-live support",
      icon: Zap,
      href: "/services/implementation",
    },
    {
      title: "Training & Certification",
      description: "Professional training programs for your team",
      icon: Users,
      href: "/services/training",
    },
    {
      title: "Custom Development",
      description: "Tailored solutions for unique requirements",
      icon: FileText,
      href: "/services/custom-development",
    },
    {
      title: "Managed Services",
      description: "We manage your WMS so you can focus on growth",
      icon: Shield,
      href: "/services/managed-services",
    },
    {
      title: "Partner Program",
      description: "Join our global partner network",
      icon: Globe,
      href: "/services/partners",
    },
  ];

  const resources = [
    {
      title: "Documentation",
      description: "Complete guides and API reference",
      icon: BookOpen,
      href: "/docs",
    },
    {
      title: "Blog & Insights",
      description: "Latest news and industry insights",
      icon: FileText,
      href: "/blog",
    },
    {
      title: "Case Studies",
      description: "Customer success stories and ROI",
      icon: BarChart3,
      href: "/resources/case-studies",
    },
    {
      title: "Knowledge Base",
      description: "Self-service support articles",
      icon: Database,
      href: "/help",
    },
    {
      title: "Supported Devices",
      description: "Compatible hardware and system requirements",
      icon: Radio,
      href: "/supported-devices",
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
          : "bg-background/60 backdrop-blur-sm",
      )}
    >
      <div className="container-enterprise">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
              <Image
                src="/favicon.svg"
                alt="LogiVox Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              LogiVox
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Solutions */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[500px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[800px] lg:grid-cols-3">
                    {solutions.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <item.icon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Platform */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {platform.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <item.icon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Services & Support */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  Services & Support
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {servicesSupport.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <item.icon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Pricing */}
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Resources */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {resources.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <item.icon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Contact */}
              <NavigationMenuItem>
                <Link href="/contact" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/demo">Book Demo</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-6">
                {/* Solutions */}
                <div>
                  <h3 className="font-semibold mb-3">Solutions</h3>
                  <div className="space-y-2">
                    {solutions.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <h3 className="font-semibold mb-3">Platform</h3>
                  <div className="space-y-2">
                    {platform.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Services & Support */}
                <div>
                  <h3 className="font-semibold mb-3">Services & Support</h3>
                  <div className="space-y-2">
                    {servicesSupport.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="font-semibold mb-3">Resources</h3>
                  <div className="space-y-2">
                    {resources.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-2 pt-4 border-t">
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className="block p-2 rounded-md hover:bg-accent transition-colors font-medium text-sm"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/demo"
                    onClick={() => setMobileOpen(false)}
                    className="block p-2 rounded-md hover:bg-accent transition-colors font-medium text-sm"
                  >
                    Book Demo
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="block p-2 rounded-md hover:bg-accent transition-colors font-medium text-sm"
                  >
                    Contact
                  </Link>
                </div>

                {/* Mobile CTA */}
                <div className="space-y-3 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                      Start Free Trial
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
