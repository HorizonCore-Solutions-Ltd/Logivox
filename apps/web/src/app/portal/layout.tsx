import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Package, ShoppingCart, History, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in or not a customer
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/portal");
  }

  const user = session.user as any;
  if (user.role !== "CUSTOMER") {
    redirect("/dashboard"); // Redirect staff to dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/portal" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  LogiVox Portal
                </span>
              </Link>

              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/portal"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/portal/orders/new"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  New Order
                </Link>
                <Link
                  href="/portal/orders"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Orders
                </Link>
                <Link
                  href="/portal/tracking"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Track Shipments
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name || user.email}</span>
              </div>
              <Link href="/portal/account">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-2 overflow-x-auto">
            <Link
              href="/portal"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              <Package className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/portal/orders/new"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>New Order</span>
            </Link>
            <Link
              href="/portal/orders"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              <History className="h-4 w-4" />
              <span>Orders</span>
            </Link>
            <Link
              href="/portal/tracking"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              <Package className="h-4 w-4" />
              <span>Track</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} LogiVox WMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
