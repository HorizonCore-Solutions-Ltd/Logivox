"use client";

import * as React from "react";
import { Plus, Search, MapPin, Package, Users } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  itemCount: number;
  staffCount: number;
  capacity: number;
  utilizationRate: number;
  manager: {
    name: string;
    email: string;
  };
}

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Mock data
  React.useEffect(() => {
    const mockData: Warehouse[] = [
      {
        id: "wh_1",
        name: "Main Warehouse",
        code: "MW001",
        address: "1234 Industrial Blvd, City, State 12345",
        isActive: true,
        itemCount: 2847,
        staffCount: 25,
        capacity: 50000,
        utilizationRate: 68,
        manager: {
          name: "John Smith",
          email: "john.smith@company.com",
        },
      },
      {
        id: "wh_2",
        name: "East Distribution Center",
        code: "EDC001",
        address: "5678 Commerce St, East City, State 67890",
        isActive: true,
        itemCount: 1923,
        staffCount: 18,
        capacity: 35000,
        utilizationRate: 45,
        manager: {
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com",
        },
      },
      {
        id: "wh_3",
        name: "West Regional Hub",
        code: "WRH001",
        address: "9012 Logistics Ave, West City, State 34567",
        isActive: false,
        itemCount: 0,
        staffCount: 0,
        capacity: 25000,
        utilizationRate: 0,
        manager: {
          name: "Mike Wilson",
          email: "mike.wilson@company.com",
        },
      },
    ];

    setTimeout(() => {
      setWarehouses(mockData);
      setLoading(false);
    }, 800);
  }, []);

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: warehouses.length,
    active: warehouses.filter((w) => w.isActive).length,
    totalItems: warehouses.reduce((sum, w) => sum + w.itemCount, 0),
    totalStaff: warehouses.reduce((sum, w) => sum + w.staffCount, 0),
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "bg-red-100 text-red-800";
    if (rate >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
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
        <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
        <Button onClick={() => router.push("/dashboard/warehouses/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Warehouses
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalItems.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              across all warehouses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">warehouse employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Utilization
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                warehouses.reduce((sum, w) => sum + w.utilizationRate, 0) /
                  warehouses.length,
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              capacity utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => (
          <Card
            key={warehouse.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${!warehouse.isActive ? "opacity-60" : ""}`}
            onClick={() => router.push(`/dashboard/warehouses/${warehouse.id}`)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                <CardDescription>{warehouse.code}</CardDescription>
              </div>
              <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                {warehouse.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <MapPin className="inline h-3 w-3 mr-1" />
                {warehouse.address}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">
                    {warehouse.itemCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Items</div>
                </div>
                <div>
                  <div className="font-medium">{warehouse.staffCount}</div>
                  <div className="text-muted-foreground">Staff</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Capacity</span>
                  <Badge
                    className={getUtilizationColor(warehouse.utilizationRate)}
                  >
                    {warehouse.utilizationRate}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${warehouse.utilizationRate}%` }}
                  />
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium">Manager</div>
                <div className="text-muted-foreground">
                  {warehouse.manager.name}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWarehouses.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No warehouses found</p>
            <p className="text-muted-foreground text-center mb-4">
              {search
                ? `No warehouses match "${search}"`
                : "Get started by adding your first warehouse"}
            </p>
            {!search && (
              <Button
                onClick={() => router.push("/dashboard/warehouses/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
