"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Package, MapPin, AlertCircle, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface InventoryItemDetail {
  id: string;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  minStockLevel: number;
  reorderPoint: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  barcode?: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
    location: string;
  };
  category: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
    contact: string;
  };
  costPrice: number;
  sellingPrice: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface MovementHistory {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  timestamp: string;
  user: {
    name: string;
  };
  reference?: string;
}

export default function InventoryItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = React.useState<InventoryItemDetail | null>(null);
  const [movements, setMovements] = React.useState<MovementHistory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const itemId = params.id as string;

  React.useEffect(() => {
    // Mock data - in production this would fetch from API
    const mockItem: InventoryItemDetail = {
      id: itemId,
      name: "Industrial Safety Helmet",
      sku: "HELM-001",
      description: "High-impact ABS construction safety helmet with adjustable suspension system. Meets ANSI Z89.1 standards. Available in multiple colors.",
      quantity: 150,
      minStockLevel: 50,
      reorderPoint: 75,
      status: "ACTIVE",
      barcode: "1234567890123",
      warehouse: {
        id: "wh_1",
        name: "Main Warehouse",
        code: "MW001",
        location: "Section A, Bay 15, Shelf 3"
      },
      category: {
        id: "cat_1",
        name: "Safety Equipment"
      },
      supplier: {
        id: "sup_1",
        name: "SafeWork Industries",
        contact: "orders@safework.com"
      },
      costPrice: 45.99,
      sellingPrice: 89.99,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:15:00Z",
      createdBy: {
        name: "John Smith",
        email: "john.smith@company.com"
      }
    };

    const mockMovements: MovementHistory[] = [
      {
        id: "mov_1",
        type: "IN",
        quantity: 50,
        reason: "Purchase Order PO-2024-001",
        timestamp: "2024-01-20T14:15:00Z",
        user: { name: "Sarah Johnson" },
        reference: "PO-2024-001"
      },
      {
        id: "mov_2", 
        type: "OUT",
        quantity: -25,
        reason: "Sales Order SO-2024-125",
        timestamp: "2024-01-18T09:30:00Z",
        user: { name: "Mike Wilson" },
        reference: "SO-2024-125"
      },
      {
        id: "mov_3",
        type: "ADJUSTMENT",
        quantity: -3,
        reason: "Damage - returned to supplier",
        timestamp: "2024-01-16T16:45:00Z",
        user: { name: "Lisa Brown" },
        reference: "RMA-001"
      }
    ];

    setTimeout(() => {
      setItem(mockItem);
      setMovements(mockMovements);
      setLoading(false);
    }, 800);
  }, [itemId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "OUT_OF_STOCK": return "bg-red-100 text-red-800";
      case "INACTIVE": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "OUT": return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case "ADJUSTMENT": return <History className="h-4 w-4 text-blue-600" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/inventory/${itemId}/edit`);
  };

  const handleDelete = () => {
    toast({
      title: "Confirm Deletion",
      description: "Are you sure you want to delete this item?",
      variant: "destructive",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Item Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
            <p className="text-muted-foreground">SKU: {item.sku}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="mt-1 font-medium">{item.category.name}</div>
                </div>
              </div>
              
              {item.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm leading-relaxed">{item.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <div className="mt-1 text-2xl font-bold">{item.quantity}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Level</label>
                  <div className="mt-1 text-lg font-semibold text-orange-600">{item.minStockLevel}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                  <div className="mt-1 text-lg font-semibold text-blue-600">{item.reorderPoint}</div>
                </div>
              </div>

              {item.quantity <= item.minStockLevel && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Stock level is below minimum threshold
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Supplier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
                  <div className="mt-1 font-medium">{item.warehouse.name}</div>
                  <div className="text-sm text-muted-foreground">{item.warehouse.location}</div>
                </div>
                {item.supplier && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                    <div className="mt-1 font-medium">{item.supplier.name}</div>
                    <div className="text-sm text-muted-foreground">{item.supplier.contact}</div>
                  </div>
                )}
              </div>
              {item.barcode && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                  <div className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {item.barcode}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cost Price</span>
                <span className="font-medium">${item.costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Selling Price</span>
                <span className="font-medium">${item.sellingPrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gross Margin</span>
                <span className="font-medium text-green-600">
                  {(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Value</span>
                <span className="font-bold">${(item.quantity * item.costPrice).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {movements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="flex items-start space-x-3">
                  {getMovementIcon(movement.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {movement.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {movement.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.timestamp).toLocaleDateString()} by {movement.user.name}
                    </p>
                  </div>
                </div>
              ))}
              {movements.length > 5 && (
                <Button variant="outline" size="sm" className="w-full">
                  View All Movements
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                <div className="text-muted-foreground">by {item.createdBy.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <div>{new Date(item.updatedAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}