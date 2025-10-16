"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Package,
  TrendingDown,
  X,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface LowStockItem {
  id: string
  name: string
  sku: string
  quantity: number
  minStockLevel: number
  unit: string
  status: string
  warehouse: {
    name: string
  }
}

export function LowStockAlerts() {
  const [isDismissed, setIsDismissed] = React.useState(false)
  const router = useRouter()

  // Fetch low stock items
  const { data: items = [] } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/inventory?status=LOW_STOCK")
      if (!res.ok) throw new Error("Failed to fetch low stock items")
      const allItems = await res.json()
      
      // Also get out of stock items
      const outRes = await fetch("/api/inventory?status=OUT_OF_STOCK")
      if (outRes.ok) {
        const outItems = await outRes.json()
        return [...allItems, ...outItems]
      }
      
      return allItems
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isDismissed || items.length === 0) {
    return null
  }

  const outOfStock = items.filter((item: LowStockItem) => item.status === "OUT_OF_STOCK")
  const lowStock = items.filter((item: LowStockItem) => item.status === "LOW_STOCK")

  return (
    <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Stock Alerts</CardTitle>
              <CardDescription>
                {items.length} item{items.length !== 1 ? "s" : ""} need{items.length === 1 ? "s" : ""} attention
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex items-center space-x-4 text-sm">
          {outOfStock.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="text-xs">
                {outOfStock.length}
              </Badge>
              <span className="text-muted-foreground">Out of Stock</span>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="warning" className="text-xs bg-yellow-500 text-white">
                {lowStock.length}
              </Badge>
              <span className="text-muted-foreground">Low Stock</span>
            </div>
          )}
        </div>

        {/* Item List - Show first 5 */}
        <div className="space-y-2">
          {items.slice(0, 5).map((item: LowStockItem) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{item.sku}</span>
                    <span>•</span>
                    <span>{item.warehouse.name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    item.quantity === 0 ? "text-red-600" : "text-yellow-600"
                  }`}>
                    {item.quantity} {item.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.minStockLevel}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/inventory/${item.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {items.length > 5 && (
          <div className="pt-2">
            <Link
              href="/dashboard/inventory?filter=alerts"
              className="text-sm text-primary hover:underline"
            >
              View all {items.length} alerts →
            </Link>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push("/dashboard/inventory?filter=alerts")}
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Manage Stock Levels
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
