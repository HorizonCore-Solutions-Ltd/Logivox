"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { 
  Building2, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  ChevronDown,
  Zap,
  Shield,
  BarChart3,
  Users,
  LogOut,
  User,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const navigation = [
    {
      name: "Solutions",
      href: "#",
      children: [
        {
          name: "Stock Booking",
          href: "/solutions/stock-booking",
          description: "Streamline your inventory management",
          icon: Building2,
        },
        {
          name: "ERP Integration",
          href: "/solutions/erp-integration", 
          description: "Connect with Oracle, SAP, NetSuite",
          icon: Zap,
        },
        {
          name: "Analytics",
          href: "/solutions/analytics",
          description: "Real-time insights and reporting",
          icon: BarChart3,
        },
      ],
    },
    {
      name: "Platform",
      href: "#",
      children: [
        {
          name: "Enterprise Security",
          href: "/platform/security",
          description: "Zero-trust architecture",
          icon: Shield,
        },
        {
          name: "Multi-Tenant",
          href: "/platform/multi-tenant",
          description: "Scalable organization management",
          icon: Users,
        },
      ],
    },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ]

  const ctaButtons = [
    { name: "Sign In", href: "/sign-in", variant: "ghost" as const },
    { name: "Get Started", href: "/sign-up", variant: "default" as const },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container-enterprise flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-primary-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">FlowStock</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              {item.children ? (
                <div>
                  <button className="nav-link-inactive group inline-flex items-center">
                    {item.name}
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="rounded-lg bg-popover border shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-4">
                        <div className="grid gap-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="group flex items-start space-x-3 rounded-lg p-3 hover:bg-accent transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <child.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-primary">
                                  {child.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {child.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href={item.href} className="nav-link-inactive">
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse bg-muted rounded" />
            ) : isAuthenticated && user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    showUserMenu && "rotate-180"
                  )} />
                </Button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.role && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Role: {user.role}
                          </p>
                        )}
                      </div>
                      <Link
                        href="/dashboard/dashboard"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Start Free Trial</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="border-t bg-background px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <div className="ml-4 space-y-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="block py-2 text-foreground hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}