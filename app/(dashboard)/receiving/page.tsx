/**
 * Receiving Operations Dashboard
 * Comprehensive UI for inbound inventory management, GRN creation, QC, and put-away
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
  ClipboardCheck,
  ArrowDownToLine,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GRNItem {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  expectedQuantity: number;
  receivedQuantity: number;
  status: "PENDING" | "IN_PROGRESS" | "QC_PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

interface QCInspection {
  id: string;
  grnNumber: string;
  productName: string;
  inspectionType: string;
  status: "PENDING" | "PASSED" | "FAILED";
  assignedTo: string;
  createdAt: string;
}

interface PutAwayTask {
  id: string;
  grnNumber: string;
  productName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  assignedTo: string;
}

interface ReceivingStats {
  totalGRNs: number;
  pendingGRNs: number;
  qcPending: number;
  putAwayPending: number;
  todayReceived: number;
  avgProcessingTime: number;
  qcPassRate: number;
}

export default function ReceivingDashboard() {
  const [grns, setGrns] = useState<GRNItem[]>([]);
  const [qcInspections, setQcInspections] = useState<QCInspection[]>([]);
  const [putAwayTasks, setPutAwayTasks] = useState<PutAwayTask[]>([]);
  const [stats, setStats] = useState<ReceivingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [newGrnPO, setNewGrnPO] = useState("");
  const [newGrnSupplier, setNewGrnSupplier] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load GRNs
      const grnsResponse = await fetch("/api/receiving?action=list-grns");
      const grnsData = await grnsResponse.json();
      setGrns(grnsData.grns || []);

      // Load statistics
      const statsResponse = await fetch("/api/receiving?action=statistics");
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load QC inspections
      const qcResponse = await fetch("/api/receiving?action=qc-inspections");
      const qcData = await qcResponse.json();
      setQcInspections(qcData.inspections || []);

      // Load put-away tasks
      const putAwayResponse = await fetch(
        "/api/receiving?action=putaway-tasks",
      );
      const putAwayData = await putAwayResponse.json();
      setPutAwayTasks(putAwayData.tasks || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGRN = async () => {
    try {
      const response = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-grn",
          poNumber: newGrnPO,
          supplierId: newGrnSupplier,
          items: [], // Would be populated from PO
          warehouseId: "default-warehouse",
        }),
      });

      if (response.ok) {
        setNewGrnPO("");
        setNewGrnSupplier("");
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to create GRN:", error);
    }
  };

  const processAsn = async (asnId: string) => {
    try {
      const response = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process-asn",
          asnId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to process ASN:", error);
    }
  };

  const startQC = async (grnId: string) => {
    try {
      const response = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quality-control",
          grnId,
          inspectionResults: {
            passed: true,
            notes: "Initial QC",
          },
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to start QC:", error);
    }
  };

  const completePutAway = async (taskId: string) => {
    try {
      const response = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-putaway",
          taskId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to complete put-away:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, icon: Clock },
      IN_PROGRESS: { variant: "default" as const, icon: TrendingUp },
      QC_PENDING: { variant: "warning" as const, icon: AlertCircle },
      COMPLETED: { variant: "success" as const, icon: CheckCircle },
      REJECTED: { variant: "destructive" as const, icon: AlertCircle },
      PASSED: { variant: "success" as const, icon: CheckCircle },
      FAILED: { variant: "destructive" as const, icon: AlertCircle },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading receiving dashboard...</p>
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
            Receiving Operations
          </h1>
          <p className="text-muted-foreground">
            Manage inbound inventory, GRN creation, quality control, and
            put-away
          </p>
        </div>
        <Button onClick={() => setActiveTab("create-grn")}>
          <Package className="mr-2 h-4 w-4" />
          Create GRN
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total GRNs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGRNs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingGRNs} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QC Pending</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qcPending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.qcPassRate.toFixed(1)}% pass rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Put-Away Pending
              </CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.putAwayPending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgProcessingTime.toFixed(0)} min avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today Received
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayReceived}</div>
              <p className="text-xs text-muted-foreground">
                Units received today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grns">GRNs</TabsTrigger>
          <TabsTrigger value="qc">Quality Control</TabsTrigger>
          <TabsTrigger value="putaway">Put-Away</TabsTrigger>
          <TabsTrigger value="create-grn">Create GRN</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent GRNs</CardTitle>
              <CardDescription>Latest goods receipt notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN #</TableHead>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.slice(0, 5).map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-medium">
                        {grn.grnNumber}
                      </TableCell>
                      <TableCell>{grn.poNumber}</TableCell>
                      <TableCell>{grn.supplierName}</TableCell>
                      <TableCell>
                        {grn.receivedQuantity} / {grn.expectedQuantity}
                      </TableCell>
                      <TableCell>{getStatusBadge(grn.status)}</TableCell>
                      <TableCell>
                        {new Date(grn.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {grn.status === "PENDING" && (
                          <Button size="sm" onClick={() => startQC(grn.id)}>
                            Start QC
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All GRNs</CardTitle>
              <CardDescription>Manage all goods receipt notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN #</TableHead>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-medium">
                        {grn.grnNumber}
                      </TableCell>
                      <TableCell>{grn.poNumber}</TableCell>
                      <TableCell>{grn.supplierName}</TableCell>
                      <TableCell>{grn.expectedQuantity}</TableCell>
                      <TableCell>{grn.receivedQuantity}</TableCell>
                      <TableCell>{getStatusBadge(grn.status)}</TableCell>
                      <TableCell>
                        {new Date(grn.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control Inspections</CardTitle>
              <CardDescription>Manage QC inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">
                        {inspection.grnNumber}
                      </TableCell>
                      <TableCell>{inspection.productName}</TableCell>
                      <TableCell>{inspection.inspectionType}</TableCell>
                      <TableCell>{inspection.assignedTo}</TableCell>
                      <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      <TableCell>
                        {new Date(inspection.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {inspection.status === "PENDING" && (
                          <Button size="sm">Inspect</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="putaway" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Put-Away Tasks</CardTitle>
              <CardDescription>
                Manage inventory put-away operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {putAwayTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.grnNumber}
                      </TableCell>
                      <TableCell>{task.productName}</TableCell>
                      <TableCell>{task.quantity}</TableCell>
                      <TableCell>{task.fromLocation}</TableCell>
                      <TableCell>{task.toLocation}</TableCell>
                      <TableCell>{task.assignedTo}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => completePutAway(task.id)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-grn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New GRN</CardTitle>
              <CardDescription>Create a new goods receipt note</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="po-number">Purchase Order Number</Label>
                  <Input
                    id="po-number"
                    placeholder="PO-001"
                    value={newGrnPO}
                    onChange={(e) => setNewGrnPO(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier ID</Label>
                  <Input
                    id="supplier"
                    placeholder="SUP-001"
                    value={newGrnSupplier}
                    onChange={(e) => setNewGrnSupplier(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={createGRN}
                disabled={!newGrnPO || !newGrnSupplier}
              >
                Create GRN
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
