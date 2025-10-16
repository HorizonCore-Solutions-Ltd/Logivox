"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Download,
  Upload,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { LowStockAlerts } from "@/components/inventory/low-stock-alerts"
import { BulkImportExportDialog } from "@/components/inventory/bulk-import-export-dialog"

// Types
interface InventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  availableQuantity: number
  reservedQuantity: number
  minStockLevel: number
  costPrice: number
  sellingPrice: number
  unit: string
  status: string
  warehouse: {
    name: string
  }
  category: {
    name: string
  } | null
}

export default function InventoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [importExportMode, setImportExportMode] = React.useState<"import" | "export" | null>(null)

  // Fetch inventory items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      return res.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete item")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = items.length
    const lowStock = items.filter(
      (item: InventoryItem) => item.status === "LOW_STOCK"
    ).length
    const outOfStock = items.filter(
      (item: InventoryItem) => item.status === "OUT_OF_STOCK"
    ).length
    const totalValue = items.reduce(
      (sum: number, item: InventoryItem) => sum + item.quantity * item.costPrice,
      0
    )

    return { total, lowStock, outOfStock, totalValue }
  }, [items])

  // Table columns
  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "name",
      header: "Item Name",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "—",
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouse.name,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span>{row.original.quantity}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.unit}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "availableQuantity",
      header: "Available",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.availableQuantity}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === "ACTIVE"
            ? "success"
            : status === "LOW_STOCK"
            ? "warning"
            : status === "OUT_OF_STOCK"
            ? "destructive"
            : "secondary"

        return (
          <Badge variant={variant as any} className="capitalize">
            {status.replace("_", " ").toLowerCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "costPrice",
      header: "Cost Price",
      cell: ({ row }) => `$${row.original.costPrice.toFixed(2)}`,
    },
    {
      accessorKey: "sellingPrice",
      header: "Selling Price",
      cell: ({ row }) => `$${row.original.sellingPrice.toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/inventory/${item.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/inventory/${item.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                    deleteMutation.mutate(item.id)
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <DashboardSidebar>
        <div className="p-6">
          <div className="flex h-[450px] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        </div>
      </DashboardSidebar>
    )
  }

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your inventory items and stock levels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setImportExportMode("export")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportExportMode("import")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => router.push("/dashboard/inventory/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <LowStockAlerts />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all warehouses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">At cost price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below minimum level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            View and manage all your inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
            searchKey="name"
            searchPlaceholder="Search by item name..."
          />
        </CardContent>
      </Card>

      {/* Import/Export Dialog */}
      <BulkImportExportDialog
        open={importExportMode !== null}
        onOpenChange={(open) => !open && setImportExportMode(null)}
        mode={importExportMode || "import"}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] })
        }}
      />
      </div>
    </DashboardSidebar>
  )
}
