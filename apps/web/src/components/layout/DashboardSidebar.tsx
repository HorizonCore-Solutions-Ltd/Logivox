"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
  Warehouse,
  FolderTree,
  ChevronRight,
  Activity,
  Webhook,
  Key,
  Book,
  FileBarChart,
  Smartphone,
  ShoppingCart,
  ClipboardList,
  BoxSelect,
  Truck,
  Globe2,
  PackagePlus,
  Building,
  RotateCcw,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";

interface DashboardSidebarProps {
  children: React.ReactNode;
}

export function DashboardSidebar({ children }: DashboardSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >({
    Inventory: true,
    Fulfillment: false,
    Procurement: false,
    Operations: false,
    Quality: false,
    Duties: false,
    "Next-Gen": false,
  });
  const [currentOrgId, setCurrentOrgId] = React.useState<string>("");

  const toggleSection = (name: string) =>
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  // Initialize current org ID from session
  React.useEffect(() => {
    if (session?.user?.organizations?.[0]?.id) {
      setCurrentOrgId(session.user.organizations[0].id);
    }
  }, [session]);

  const handleOrgSwitch = (orgId: string) => {
    setCurrentOrgId(orgId);
    // TODO: Update session context with new org ID
    // For now, we'll just update local state
    console.log("Switched to organization:", orgId);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      subItems: [
        { name: "All Items", href: "/dashboard/inventory", icon: Package },
        { name: "Warehouses", href: "/dashboard/warehouses", icon: Warehouse },
        { name: "Categories", href: "/dashboard/categories", icon: FolderTree },
      ],
    },
    {
      name: "Fulfillment",
      href: "/dashboard/fulfillment",
      icon: Globe2,
      subItems: [
        { name: "Hub Overview", href: "/dashboard/fulfillment", icon: Globe2 },
        {
          name: "Sales Orders",
          href: "/dashboard/sales-orders",
          icon: ShoppingCart,
        },
        {
          name: "Pick Lists",
          href: "/dashboard/pick-lists",
          icon: ClipboardList,
        },
        { name: "Packing", href: "/dashboard/packs", icon: BoxSelect },
        { name: "Shipments", href: "/dashboard/shipments", icon: Truck },
      ],
    },
    {
      name: "Procurement",
      href: "/dashboard/purchase-orders",
      icon: PackagePlus,
      subItems: [
        {
          name: "Purchase Orders",
          href: "/dashboard/purchase-orders",
          icon: PackagePlus,
        },
        {
          name: "GRN / Receiving",
          href: "/dashboard/receiving",
          icon: ClipboardCheck,
        },
        {
          name: "GRN Detail View",
          href: "/dashboard/grn",
          icon: ClipboardCheck,
        },
        { name: "Suppliers", href: "/dashboard/suppliers", icon: Building },
      ],
    },
    {
      name: "Operations",
      href: "/dashboard/returns",
      icon: ShieldCheck,
      subItems: [
        {
          name: "Operations Hub",
          href: "/dashboard/operations",
          icon: Activity,
        },
        { name: "Returns & RMAs", href: "/dashboard/returns", icon: RotateCcw },
        {
          name: "RMA Detail View",
          href: "/dashboard/rmas",
          icon: RotateCcw,
        },
        {
          name: "QC Inspections",
          href: "/dashboard/qc-inspections",
          icon: ClipboardCheck,
        },
        {
          name: "Cycle Counts",
          href: "/dashboard/cycle-counts",
          icon: ClipboardList,
        },
      ],
    },
    {
      name: "Quality",
      href: "/capa/hub",
      icon: ShieldAlert,
      subItems: [
        { name: "CAPA Hub", href: "/capa/hub", icon: ShieldAlert },
        { name: "NCR List", href: "/capa/monitoring", icon: FileWarning },
        {
          name: "Risk Scoring",
          href: "/capa/risk-scoring",
          icon: AlertTriangle,
        },
      ],
    },
    {
      name: "Duties",
      href: "/dashboard/duties",
      icon: ClipboardList,
      subItems: [
        { name: "Duty Board", href: "/dashboard/duties", icon: ClipboardList },
        { name: "Auto-Planner", href: "/dashboard/duties/planner", icon: Zap },
      ],
    },
    {
      name: "Next-Gen",
      href: "/dashboard/labor",
      icon: Zap,
      badge: "Advanced",
      subItems: [
        { name: "Labor Management", href: "/dashboard/labor", icon: Users },
        {
          name: "Task Interleaving",
          href: "/dashboard/task-interleaving",
          icon: Zap,
        },
        {
          name: "Yard Management",
          href: "/dashboard/yard-management",
          icon: Truck,
        },
        {
          name: "Floor Heatmap",
          href: "/dashboard/floor-heatmap",
          icon: Activity,
        },
        {
          name: "Automation/Robotics",
          href: "/dashboard/automation",
          icon: Zap,
        },
        { name: "IoT Sensors", href: "/dashboard/iot", icon: Zap },
        {
          name: "AI Forecasting",
          href: "/dashboard/ai-forecasting",
          icon: BarChart3,
        },
        {
          name: "Demand Forecasting",
          href: "/dashboard/forecasting",
          icon: BarChart3,
        },
        {
          name: "Computer Vision",
          href: "/dashboard/computer-vision",
          icon: Zap,
        },
        {
          name: "Customer Analytics",
          href: "/dashboard/customer-analytics",
          icon: BarChart3,
        },
        {
          name: "Sustainability",
          href: "/dashboard/sustainability",
          icon: Globe2,
        },
        {
          name: "Blockchain",
          href: "/dashboard/blockchain",
          icon: ShieldCheck,
        },
      ],
    },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Bookings", href: "/dashboard/bookings", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Reports", href: "/dashboard/reports", icon: FileBarChart },
    { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    { name: "API Docs", href: "/dashboard/api-docs", icon: Book },
    { name: "Activity Logs", href: "/dashboard/activity", icon: Activity },
    { name: "PWA Settings", href: "/dashboard/pwa-settings", icon: Smartphone },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;
  const isInventoryActive =
    pathname.startsWith("/dashboard/inventory") ||
    pathname.startsWith("/dashboard/warehouses") ||
    pathname.startsWith("/dashboard/categories");
  const isFulfillmentActive =
    pathname.startsWith("/dashboard/fulfillment") ||
    pathname.startsWith("/dashboard/sales-orders") ||
    pathname.startsWith("/dashboard/pick-lists") ||
    pathname.startsWith("/dashboard/packs") ||
    pathname.startsWith("/dashboard/shipments");
  const isProcurementActive =
    pathname.startsWith("/dashboard/purchase-orders") ||
    pathname.startsWith("/dashboard/receiving") ||
    pathname.startsWith("/dashboard/grn") ||
    pathname.startsWith("/dashboard/suppliers");
  const isOperationsActive =
    pathname.startsWith("/dashboard/operations") ||
    pathname.startsWith("/dashboard/returns") ||
    pathname.startsWith("/dashboard/rmas") ||
    pathname.startsWith("/dashboard/qc-inspections") ||
    pathname.startsWith("/dashboard/cycle-counts");
  const isQualityActive =
    pathname.startsWith("/capa") || pathname.startsWith("/dashboard/ncr");
  const isDutiesActive = pathname.startsWith("/dashboard/duties");
  const isNextGenActive =
    pathname.startsWith("/dashboard/labor") ||
    pathname.startsWith("/dashboard/task-interleaving") ||
    pathname.startsWith("/dashboard/yard-management") ||
    pathname.startsWith("/dashboard/floor-heatmap") ||
    pathname.startsWith("/dashboard/automation") ||
    pathname.startsWith("/dashboard/iot") ||
    pathname.startsWith("/dashboard/ai-forecasting") ||
    pathname.startsWith("/dashboard/forecasting") ||
    pathname.startsWith("/dashboard/computer-vision") ||
    pathname.startsWith("/dashboard/customer-analytics") ||
    pathname.startsWith("/dashboard/sustainability") ||
    pathname.startsWith("/dashboard/blockchain");

  const isSectionActive = (name: string) => {
    if (name === "Inventory") return isInventoryActive;
    if (name === "Fulfillment") return isFulfillmentActive;
    if (name === "Procurement") return isProcurementActive;
    if (name === "Operations") return isOperationsActive;
    if (name === "Quality") return isQualityActive;
    if (name === "Duties") return isDutiesActive;
    if (name === "Next-Gen") return isNextGenActive;
    return false;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">LogiVox</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasSubItems = "subItems" in item && item.subItems;

            if (hasSubItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSectionActive(item.name)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${expandedSections[item.name] ? "rotate-90" : ""}`}
                    />
                  </button>
                  {expandedSections[item.name] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isActive(subItem.href)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <SubIcon className="mr-3 h-4 w-4" />
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white font-medium">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">
                  john@acme.com
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search inventory, bookings..."
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Organization Switcher */}
            {currentOrgId && (
              <OrganizationSwitcher
                currentOrgId={currentOrgId}
                onSwitch={handleOrgSwitch}
              />
            )}

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* User Menu - Mobile/Tablet */}
            <div className="lg:hidden relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white font-medium text-sm">
                  JD
                </div>
              </Button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">
                      john@acme.com
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <div className="border-t mt-2 pt-2">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-muted">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-xl">
              {/* Logo */}
              <div className="flex items-center justify-between h-16 px-6 border-b">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold">LogiVox</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="px-4 py-6 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = "subItems" in item && item.subItems;

                  if (hasSubItems) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isSectionActive(item.name)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expandedSections[item.name] ? "rotate-90" : ""}`}
                          />
                        </button>
                        {expandedSections[item.name] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isActive(subItem.href)
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  <SubIcon className="mr-3 h-4 w-4" />
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
