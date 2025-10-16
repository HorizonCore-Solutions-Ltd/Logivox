"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Edit, Trash2, Package, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog"

interface InventoryItemDetailProps {
  params: {
    id: string
  }
}

export default function InventoryItemDetailPage({
  params,
}: InventoryItemDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false)

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ["inventory", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch item")
      return res.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inventory/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete item")
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
      router.push("/dashboard/inventory")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${item?.name}? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate()
    }
  }

  const handleAdjustmentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory", params.id] })
    setAdjustDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Item not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard/inventory")}
          >
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }

  const profitMargin = item.sellingPrice - item.costPrice
  const profitPercentage =
    item.costPrice > 0
      ? ((profitMargin / item.costPrice) * 100).toFixed(2)
      : "0.00"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">SKU: {item.sku}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/inventory/${params.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setAdjustDialogOpen(true)}>
            <Package className="mr-2 h-4 w-4" />
            Adjust Stock
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.quantity} {item.unit}
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {item.availableQuantity} {item.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                item.status === "ACTIVE"
                  ? "success"
                  : item.status === "LOW_STOCK"
                  ? "warning"
                  : "destructive"
              }
              className="text-base"
            >
              {item.status.replace("_", " ")}
            </Badge>
            {item.status === "LOW_STOCK" && (
              <p className="text-xs text-muted-foreground mt-2">
                Min level: {item.minStockLevel}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(item.quantity * item.costPrice).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost: ${item.costPrice} per {item.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              ${profitMargin.toFixed(2)} per {item.unit}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Item Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SKU</p>
                <p className="text-sm">{item.sku}</p>
              </div>
              {item.barcode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Barcode
                  </p>
                  <p className="text-sm">{item.barcode}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Category
                </p>
                <p className="text-sm">{item.category?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Warehouse
                </p>
                <p className="text-sm">{item.warehouse.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit</p>
                <p className="text-sm">{item.unit}</p>
              </div>
            </div>
            {item.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm mt-1">{item.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Quantity
                </p>
                <p className="text-2xl font-bold">
                  {item.quantity} {item.unit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Available
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {item.availableQuantity} {item.unit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reserved
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {item.reservedQuantity} {item.unit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Min Stock Level
                </p>
                <p className="text-2xl font-bold">{item.minStockLevel}</p>
              </div>
              {item.reorderPoint && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reorder Point
                  </p>
                  <p className="text-2xl font-bold">{item.reorderPoint}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
          <CardDescription>Last 10 stock movements for this item</CardDescription>
        </CardHeader>
        <CardContent>
          {item.movements && item.movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.movements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.createdAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {movement.movementType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        ["PURCHASE", "RETURN", "ADJUSTMENT"].includes(
                          movement.movementType
                        )
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {["PURCHASE", "RETURN", "ADJUSTMENT"].includes(
                        movement.movementType
                      )
                        ? "+"
                        : "-"}
                      {movement.quantity}
                    </TableCell>
                    <TableCell>{movement.reference || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No movements recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        itemId={params.id}
        itemName={item.name}
        currentQuantity={item.quantity}
        unit={item.unit}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  )
}
