"use client";

import * as React from "react";
import { Plus, Search, Filter, MoreHorizontal, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStockLevel: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  warehouse: {
    name: string;
    code: string;
  };
  category: {
    name: string;
  };
  createdAt: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  // Get current user's organization from session
  const { data: session } = useSession()
  const [selectedOrg, setSelectedOrg] = React.useState(session?.user?.organizationId || "")

  // Mock data - in production this would come from API
  React.useEffect(() => {
    const fetchInventoryData = async () => {
      if (!selectedOrg) return
      
      try {
        setLoading(true)
        
        // Fetch real inventory data from API
        const response = await fetch(`/api/inventory?organizationId=${selectedOrg}`)
        if (!response.ok) {
          throw new Error('Failed to fetch inventory data')
        }
        
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Error fetching inventory:', error)
        // Fallback to mock data for development
        const mockData: InventoryItem[] = [
          {
            id: "item_1",
            name: "Industrial Safety Helmet",
            sku: "HELM-001",
            quantity: 150,
            minStockLevel: 50,
            status: "ACTIVE",
            warehouse: { name: "Main Warehouse", code: "MW001" },
            category: { name: "Safety Equipment" },
            createdAt: "2024-01-15T10:30:00Z",
          },
          {
            id: "item_2", 
            name: "High-Vis Vest Large",
            sku: "VEST-L-001",
            quantity: 25,
            minStockLevel: 30,
            status: "ACTIVE",
            warehouse: { name: "Main Warehouse", code: "MW001" },
            category: { name: "Safety Equipment" },
            createdAt: "2024-01-14T14:20:00Z",
          },
          {
            id: "item_3",
            name: "Steel Toe Boots Size 10",
            sku: "BOOT-10-001", 
            quantity: 0,
            minStockLevel: 15,
            status: "OUT_OF_STOCK",
            warehouse: { name: "East Warehouse", code: "EW001" },
            category: { name: "Safety Equipment" },
            createdAt: "2024-01-13T09:15:00Z",
          },
          {
            id: "item_4",
            name: "First Aid Kit Premium",
            sku: "AID-PREM-001",
            quantity: 75,
            minStockLevel: 25,
            status: "ACTIVE",
            warehouse: { name: "Main Warehouse", code: "MW001" },
            category: { name: "Medical Supplies" },
            createdAt: "2024-01-12T16:45:00Z",
          },
        ]
        setItems(mockData)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [selectedOrg])

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(item => item.quantity <= item.minStockLevel).length,
    outOfStock: items.filter(item => item.status === "OUT_OF_STOCK").length,
    totalValue: 2847392, // Mock total value
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "OUT_OF_STOCK": return "bg-red-100 text-red-800";
      case "INACTIVE": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateItem = () => {
    router.push("/dashboard/inventory/create");
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <Button onClick={handleCreateItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">across all warehouses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">items need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">items unavailable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory items and stock levels
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.warehouse.name}</TableCell>
                  <TableCell>{item.category.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={item.quantity <= item.minStockLevel ? "text-yellow-600 font-medium" : ""}>
                        {item.quantity}
                      </span>
                      {item.quantity <= item.minStockLevel && (
                        <span className="text-xs text-yellow-600">Min: {item.minStockLevel}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/inventory/${item.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/inventory/${item.id}/edit`)}
                        >
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}