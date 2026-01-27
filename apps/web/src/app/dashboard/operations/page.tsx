"use client";

import * as React from "react";
import { 
  TruckIcon, 
  PackageIcon, 
  ClipboardCheckIcon, 
  WarehouseIcon,
  UsersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface OperationMetrics {
  receiving: {
    todayReceived: number;
    pending: number;
    avgProcessingTime: number;
    accuracy: number;
  };
  picking: {
    ordersPicked: number;
    pendingPicks: number;
    avgPickTime: number;
    accuracy: number;
  };
  shipping: {
    ordersShipped: number;
    pendingShipments: number;
    onTimeDelivery: number;
    avgShipTime: number;
  };
  warehouse: {
    utilization: number;
    activeStaff: number;
    tasksCompleted: number;
    efficiency: number;
  };
}

interface RecentActivity {
  id: string;
  type: "RECEIVING" | "PICKING" | "SHIPPING" | "INVENTORY_ADJUSTMENT";
  description: string;
  user: string;
  timestamp: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "ERROR";
}

export default function WarehouseOperationsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = React.useState<OperationMetrics | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Mock data - in production this would come from API
    const mockMetrics: OperationMetrics = {
      receiving: {
        todayReceived: 45,
        pending: 12,
        avgProcessingTime: 23.5,
        accuracy: 99.2
      },
      picking: {
        ordersPicked: 127,
        pendingPicks: 34,
        avgPickTime: 8.7,
        accuracy: 98.8
      },
      shipping: {
        ordersShipped: 118,
        pendingShipments: 15,
        onTimeDelivery: 96.5,
        avgShipTime: 45.2
      },
      warehouse: {
        utilization: 78,
        activeStaff: 23,
        tasksCompleted: 284,
        efficiency: 94.3
      }
    };

    const mockActivity: RecentActivity[] = [
      {
        id: "1",
        type: "RECEIVING",
        description: "Received shipment PO-2024-156 - 25 safety helmets",
        user: "John Smith",
        timestamp: "2024-01-27T10:30:00Z",
        status: "COMPLETED"
      },
      {
        id: "2", 
        type: "PICKING",
        description: "Picked order SO-2024-089 - 12 items for TechCorp",
        user: "Sarah Johnson",
        timestamp: "2024-01-27T10:15:00Z",
        status: "COMPLETED"
      },
      {
        id: "3",
        type: "SHIPPING",
        description: "Shipped order SO-2024-087 via UPS Ground",
        user: "Mike Wilson",
        timestamp: "2024-01-27T09:45:00Z",
        status: "COMPLETED"
      },
      {
        id: "4",
        type: "INVENTORY_ADJUSTMENT",
        description: "Adjusted inventory for damaged goods - BOOT-10-001",
        user: "Lisa Brown",
        timestamp: "2024-01-27T09:20:00Z",
        status: "COMPLETED"
      },
      {
        id: "5",
        type: "PICKING",
        description: "Picking order SO-2024-091 - High priority",
        user: "David Lee",
        timestamp: "2024-01-27T09:00:00Z",
        status: "IN_PROGRESS"
      }
    ];

    setTimeout(() => {
      setMetrics(mockMetrics);
      setRecentActivity(mockActivity);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "ERROR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "RECEIVING": return <TruckIcon className="h-4 w-4" />;
      case "PICKING": return <PackageIcon className="h-4 w-4" />;
      case "SHIPPING": return <TruckIcon className="h-4 w-4" />;
      case "INVENTORY_ADJUSTMENT": return <ClipboardCheckIcon className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Warehouse Operations</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
        <h2 className="text-3xl font-bold tracking-tight">Warehouse Operations</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/receiving")}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Receiving
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/picking-tasks")}>
            <PackageIcon className="mr-2 h-4 w-4" />
            Picking
          </Button>
          <Button onClick={() => router.push("/dashboard/shipments")}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Shipping
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receiving Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Received</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.receiving.todayReceived}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.receiving.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Picked</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.picking.ordersPicked}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.picking.pendingPicks} in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Shipped</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.shipping.ordersShipped}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.shipping.pendingShipments} awaiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.warehouse.activeStaff}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.warehouse.tasksCompleted} tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receiving Accuracy</CardTitle>
            <ClipboardCheckIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.receiving.accuracy}%
            </div>
            <Progress value={metrics.receiving.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Picking Accuracy</CardTitle>
            <ClipboardCheckIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.picking.accuracy}%
            </div>
            <Progress value={metrics.picking.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <TruckIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.shipping.onTimeDelivery}%
            </div>
            <Progress value={metrics.shipping.onTimeDelivery} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouse Efficiency</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.warehouse.efficiency}%
            </div>
            <Progress value={metrics.warehouse.efficiency} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Operations */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Receiving Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Receiving
            </CardTitle>
            <CardDescription>Inbound operations status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Processing Time</span>
              <span className="font-medium">{metrics.receiving.avgProcessingTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Receipts</span>
              <Badge variant="outline">{metrics.receiving.pending}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push("/dashboard/receiving")}
            >
              View Receiving Queue
            </Button>
          </CardContent>
        </Card>

        {/* Picking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              Picking
            </CardTitle>
            <CardDescription>Order fulfillment status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Pick Time</span>
              <span className="font-medium">{metrics.picking.avgPickTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">In Queue</span>
              <Badge variant="outline">{metrics.picking.pendingPicks}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push("/dashboard/picking-tasks")}
            >
              View Pick Lists
            </Button>
          </CardContent>
        </Card>

        {/* Shipping Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Shipping
            </CardTitle>
            <CardDescription>Outbound operations status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Ship Time</span>
              <span className="font-medium">{metrics.shipping.avgShipTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ready to Ship</span>
              <Badge variant="outline">{metrics.shipping.pendingShipments}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push("/dashboard/shipments")}
            >
              View Shipments
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest warehouse operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50">
                <div className="p-2 rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                    <span className="capitalize">{activity.type.toLowerCase().replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push("/dashboard/receiving")}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <TruckIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Start Receiving</div>
              <div className="text-sm text-muted-foreground">Process inbound shipments</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push("/dashboard/picking-tasks")}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <PackageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Start Picking</div>
              <div className="text-sm text-muted-foreground">Fulfill customer orders</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push("/dashboard/shipments")}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <TruckIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Ship Orders</div>
              <div className="text-sm text-muted-foreground">Process outbound shipments</div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push("/dashboard/inventory")}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <ClipboardCheckIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Inventory Check</div>
              <div className="text-sm text-muted-foreground">Verify stock levels</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}