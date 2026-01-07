/**
 * Packing Operations Dashboard
 * Comprehensive UI for packing operations, cartonization, and workflow management
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Box,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  Weight,
  Ruler,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface PackOrder {
  id: string;
  packNumber: string;
  orderNumber: string;
  customerName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalItems: number;
  packedItems: number;
  totalCartons: number;
  packerId: string;
  packerName: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTime: number;
}

interface Carton {
  id: string;
  cartonNumber: string;
  packNumber: string;
  cartonType: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
  }>;
  status: "OPEN" | "SEALED" | "SHIPPED";
}

interface PackStation {
  id: string;
  stationNumber: string;
  packerId: string;
  packerName: string;
  status: "ACTIVE" | "IDLE" | "OFFLINE";
  currentPack: string;
  packsToday: number;
  itemsPerHour: number;
  accuracy: number;
}

interface PackingStats {
  totalPacks: number;
  activePacks: number;
  completedToday: number;
  avgPackTime: number;
  avgItemsPerPack: number;
  avgItemsPerHour: number;
  totalStations: number;
  activeStations: number;
  packingAccuracy: number;
}

interface CartonRecommendation {
  cartonType: string;
  dimensions: string;
  weight: number;
  utilization: number;
  cost: number;
}

export default function PackingDashboard() {
  const [packs, setPacks] = useState<PackOrder[]>([]);
  const [cartons, setCartons] = useState<Carton[]>([]);
  const [stations, setStations] = useState<PackStation[]>([]);
  const [stats, setStats] = useState<PackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [cartonRecs, setCartonRecs] = useState<CartonRecommendation[]>([]);

  // Form states
  const [newPackOrder, setNewPackOrder] = useState("");
  const [selectedPacker, setSelectedPacker] = useState("");

  useEffect(() => {
    loadDashboardData();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load packs
      const packsResponse = await fetch("/api/packing?action=list-packs");
      const packsData = await packsResponse.json();
      setPacks(packsData.packs || []);

      // Load statistics
      const statsResponse = await fetch("/api/packing?action=statistics");
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load cartons
      const cartonsResponse = await fetch("/api/packing?action=cartons");
      const cartonsData = await cartonsResponse.json();
      setCartons(cartonsData.cartons || []);

      // Load stations
      const stationsResponse = await fetch("/api/packing?action=stations");
      const stationsData = await stationsResponse.json();
      setStations(stationsData.stations || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPack = async () => {
    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-pack",
          orderId: newPackOrder,
          packerId: selectedPacker,
          stationId: "STATION-01",
        }),
      });

      if (response.ok) {
        setNewPackOrder("");
        setSelectedPacker("");
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to create pack:", error);
    }
  };

  const cartonize = async (packId: string) => {
    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cartonize",
          packId,
          strategy: "MINIMIZE_CARTONS",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCartonRecs(data.recommendations || []);
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to cartonize:", error);
    }
  };

  const startPacking = async (packId: string) => {
    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start-packing",
          packId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to start packing:", error);
    }
  };

  const completePack = async (packId: string) => {
    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-pack",
          packId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to complete pack:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, icon: Clock },
      IN_PROGRESS: { variant: "default" as const, icon: Package },
      COMPLETED: { variant: "success" as const, icon: CheckCircle },
      CANCELLED: { variant: "destructive" as const, icon: AlertCircle },
      ACTIVE: { variant: "success" as const, icon: CheckCircle },
      IDLE: { variant: "secondary" as const, icon: Clock },
      OFFLINE: { variant: "destructive" as const, icon: AlertCircle },
      OPEN: { variant: "default" as const, icon: Box },
      SEALED: { variant: "success" as const, icon: Package },
      SHIPPED: { variant: "success" as const, icon: CheckCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const calculateProgress = (pack: PackOrder) => {
    if (pack.totalItems === 0) return 0;
    return (pack.packedItems / pack.totalItems) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading packing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Packing Operations
          </h1>
          <p className="text-muted-foreground">
            Manage packing operations, cartonization, and pack stations
          </p>
        </div>
        <Button onClick={() => setActiveTab("create-pack")}>
          <Package className="mr-2 h-4 w-4" />
          Create Pack
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Packs
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePacks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPacks} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pack Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgItemsPerHour}</div>
              <p className="text-xs text-muted-foreground">
                items/hour average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.packingAccuracy.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall packing accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Stations
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalStations} total stations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="packs">Packs</TabsTrigger>
          <TabsTrigger value="cartons">Cartons</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="create-pack">Create Pack</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Packing Orders</CardTitle>
                <CardDescription>Currently being packed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {packs
                  .filter((p) => p.status === "IN_PROGRESS")
                  .slice(0, 5)
                  .map((pack) => (
                    <div key={pack.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pack.packNumber}</span>
                          {getStatusBadge(pack.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {pack.packerName}
                        </span>
                      </div>
                      <Progress
                        value={calculateProgress(pack)}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {pack.packedItems}/{pack.totalItems} items
                        </span>
                        <span>{pack.totalCartons} cartons</span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Station Status</CardTitle>
                <CardDescription>Packing station activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Packer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IPH</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stations.slice(0, 5).map((station) => (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium">
                          {station.stationNumber}
                        </TableCell>
                        <TableCell>{station.packerName}</TableCell>
                        <TableCell>{getStatusBadge(station.status)}</TableCell>
                        <TableCell>{station.itemsPerHour.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Packing Orders</CardTitle>
              <CardDescription>Manage all packing operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pack #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Cartons</TableHead>
                    <TableHead>Packer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell className="font-medium">
                        {pack.packNumber}
                      </TableCell>
                      <TableCell>{pack.orderNumber}</TableCell>
                      <TableCell>{pack.customerName}</TableCell>
                      <TableCell>{getStatusBadge(pack.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress
                            value={calculateProgress(pack)}
                            className="h-2"
                          />
                          <span className="text-xs text-muted-foreground">
                            {pack.packedItems}/{pack.totalItems}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{pack.totalCartons}</TableCell>
                      <TableCell>{pack.packerName}</TableCell>
                      <TableCell>
                        {pack.startedAt
                          ? new Date(pack.startedAt).toLocaleTimeString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {pack.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cartonize(pack.id)}
                              >
                                Cartonize
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => startPacking(pack.id)}
                              >
                                Start
                              </Button>
                            </>
                          )}
                          {pack.status === "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              onClick={() => completePack(pack.id)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cartons</CardTitle>
              <CardDescription>
                View all cartons and their contents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carton #</TableHead>
                    <TableHead>Pack #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartons.map((carton) => (
                    <TableRow key={carton.id}>
                      <TableCell className="font-medium">
                        {carton.cartonNumber}
                      </TableCell>
                      <TableCell>{carton.packNumber}</TableCell>
                      <TableCell>{carton.cartonType}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {carton.dimensions.length}×{carton.dimensions.width}×
                        {carton.dimensions.height}"
                      </TableCell>
                      <TableCell>{carton.weight} lbs</TableCell>
                      <TableCell>{carton.items.length}</TableCell>
                      <TableCell>{getStatusBadge(carton.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {cartonRecs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cartonization Recommendations</CardTitle>
                <CardDescription>Optimized carton selection</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carton Type</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartonRecs.map((rec, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {rec.cartonType}
                        </TableCell>
                        <TableCell>{rec.dimensions}</TableCell>
                        <TableCell>{rec.weight} lbs</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={rec.utilization}
                              className="h-2 w-16"
                            />
                            <span className="text-sm">
                              {rec.utilization.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>${rec.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packing Stations</CardTitle>
              <CardDescription>
                Station performance and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Packer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Pack</TableHead>
                    <TableHead>Packs Today</TableHead>
                    <TableHead>Items/Hour</TableHead>
                    <TableHead>Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">
                        {station.stationNumber}
                      </TableCell>
                      <TableCell>{station.packerName}</TableCell>
                      <TableCell>{getStatusBadge(station.status)}</TableCell>
                      <TableCell>{station.currentPack || "-"}</TableCell>
                      <TableCell>{station.packsToday}</TableCell>
                      <TableCell className="text-lg font-bold">
                        {station.itemsPerHour.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={station.accuracy}
                            className="h-2 w-16"
                          />
                          <span className="text-sm">
                            {station.accuracy.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-pack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Pack</CardTitle>
              <CardDescription>Start packing a new order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-id">Order ID</Label>
                  <Input
                    id="order-id"
                    placeholder="ORD-001"
                    value={newPackOrder}
                    onChange={(e) => setNewPackOrder(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packer">Packer ID</Label>
                  <Input
                    id="packer"
                    placeholder="PACKER-001"
                    value={selectedPacker}
                    onChange={(e) => setSelectedPacker(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={createPack}
                disabled={!newPackOrder || !selectedPacker}
              >
                Create Pack
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
                <CardDescription>Packing completed today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    {stats?.completedToday}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average time: {stats?.avgPackTime.toFixed(0)} minutes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average items: {stats?.avgItemsPerPack.toFixed(1)} per pack
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
                <CardDescription>Overall packing efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Items/Hour</span>
                    <span className="text-sm">
                      {stats?.avgItemsPerHour.toFixed(0)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      ((stats?.avgItemsPerHour || 0) / 100) * 100,
                      100,
                    )}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Accuracy</span>
                    <span className="text-sm">
                      {stats?.packingAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats?.packingAccuracy || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
