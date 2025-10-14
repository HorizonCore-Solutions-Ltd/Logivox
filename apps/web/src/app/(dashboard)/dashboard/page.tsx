"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Inventory Value",
      value: "$2,847,392",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: "vs last month"
    },
    {
      title: "Active Stock Items",
      value: "12,483",
      change: "+8.2%",
      trend: "up",
      icon: Package,
      description: "across all locations"
    },
    {
      title: "Low Stock Alerts",
      value: "47",
      change: "-23.1%",
      trend: "down",
      icon: AlertTriangle,
      description: "requires attention"
    },
    {
      title: "Stock Turnover Rate",
      value: "4.2x",
      change: "+0.3",
      trend: "up",
      icon: Activity,
      description: "per quarter"
    }
  ]

  const recentBookings = [
    {
      id: "BK-1001",
      customer: "Acme Corp",
      items: 324,
      value: "$45,280",
      status: "confirmed",
      date: "2025-10-14"
    },
    {
      id: "BK-1002",
      customer: "TechStart Inc",
      items: 156,
      value: "$23,450",
      status: "pending",
      date: "2025-10-14"
    },
    {
      id: "BK-1003",
      customer: "Global Solutions",
      items: 892,
      value: "$108,920",
      status: "confirmed",
      date: "2025-10-13"
    },
    {
      id: "BK-1004",
      customer: "Innovation Labs",
      items: 67,
      value: "$8,340",
      status: "processing",
      date: "2025-10-13"
    },
    {
      id: "BK-1005",
      customer: "Enterprise Systems",
      items: 445,
      value: "$67,890",
      status: "confirmed",
      date: "2025-10-12"
    }
  ]

  const lowStockItems = [
    { sku: "SKU-2834", name: "Industrial Bearings", current: 45, min: 100, status: "critical" },
    { sku: "SKU-1923", name: "Hydraulic Pumps", current: 78, min: 150, status: "low" },
    { sku: "SKU-4512", name: "Control Valves", current: 112, min: 200, status: "low" },
    { sku: "SKU-7834", name: "Safety Sensors", current: 23, min: 75, status: "critical" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "processing": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "low": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your inventory overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              Download Report
            </Button>
            <Button>
              New Booking
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
            const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600"
            
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
                    <span className={trendColor}>{stat.change}</span>
                    <span className="ml-1">{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Stock Bookings</CardTitle>
                  <CardDescription>Latest customer reservations</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{booking.customer}</p>
                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{booking.id}</span>
                        <span>•</span>
                        <span>{booking.items} items</span>
                        <span>•</span>
                        <span>{booking.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>Items requiring reorder</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.sku} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        <Badge className={getStatusColor(item.status)} variant="secondary">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{item.sku}</span>
                        <span>•</span>
                        <span>Min: {item.min}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{item.current} units</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((item.current / item.min) * 100)}% of minimum
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Activity</CardTitle>
            <CardDescription>Stock movements over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization will be implemented with real data
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Integration with analytics API pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  )
}
