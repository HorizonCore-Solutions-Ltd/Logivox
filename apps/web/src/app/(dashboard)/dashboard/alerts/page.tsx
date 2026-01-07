"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Calendar,
  Package,
  TrendingDown,
  Bell,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ==========================================
// TYPES
// ==========================================

interface ReorderAlert {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  estimatedStockoutDate: string | null;
  createdAt: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
    warehouse: {
      name: string;
    };
    supplier: {
      name: string;
    } | null;
  };
}

interface AlertStats {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  dismissed: number;
  bySeverity: {
    low?: number;
    medium?: number;
    high?: number;
    critical?: number;
  };
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingInventory, setCheckingInventory] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ReorderAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"resolve" | "dismiss" | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/alerts?stats=true");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const checkInventory = async () => {
    setCheckingInventory(true);
    try {
      const res = await fetch("/api/alerts/check", { method: "POST" });
      const data = await res.json();

      toast.success(
        `Inventory checked! ${data.alertsCreated} new alerts created.`,
      );

      // Refresh alerts
      await fetchAlerts();
      await fetchStats();
    } catch (error) {
      console.error("Failed to check inventory:", error);
      toast.error("Failed to check inventory");
    } finally {
      setCheckingInventory(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: "POST" });
      toast.success("Alert acknowledged");
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
      toast.error("Failed to acknowledge alert");
    }
  };

  const openResolveDialog = (alert: ReorderAlert) => {
    setSelectedAlert(alert);
    setDialogType("resolve");
    setDialogOpen(true);
    setNotes("");
  };

  const openDismissDialog = (alert: ReorderAlert) => {
    setSelectedAlert(alert);
    setDialogType("dismiss");
    setDialogOpen(true);
    setNotes("");
  };

  const handleDialogAction = async () => {
    if (!selectedAlert || !dialogType) return;

    try {
      const url = `/api/alerts/${selectedAlert.id}/${dialogType}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      toast.success(`Alert ${dialogType}d successfully`);
      setDialogOpen(false);
      setSelectedAlert(null);
      setNotes("");
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error(`Failed to ${dialogType} alert:`, error);
      toast.error(`Failed to ${dialogType} alert`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reorder Alerts</h1>
          <p className="text-muted-foreground">
            Automated inventory monitoring and stock level alerts
          </p>
        </div>
        <Button
          onClick={checkInventory}
          disabled={checkingInventory}
          className="gap-2"
        >
          {checkingInventory ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Check Inventory Now
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.bySeverity.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground">Stockout imminent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Reordered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Acknowledged
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acknowledged}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            Inventory items below reorder point requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No pending alerts. All inventory levels are healthy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  {/* Alert Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">
                        {alert.inventoryItem.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={getSeverityColor(alert.severity)}
                      >
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">
                        {alert.alertType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      SKU: {alert.inventoryItem.sku} •{" "}
                      {alert.inventoryItem.warehouse.name}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Current: <strong>{alert.currentStock}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Reorder Point: <strong>{alert.reorderPoint}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        Suggested Qty: <strong>{alert.reorderQuantity}</strong>
                      </span>
                      {alert.estimatedStockoutDate && (
                        <span className="flex items-center gap-1 text-red-600">
                          <Calendar className="h-3 w-3" />
                          Stockout:{" "}
                          {format(
                            new Date(alert.estimatedStockoutDate),
                            "MMM dd, yyyy",
                          )}
                        </span>
                      )}
                    </div>

                    {alert.inventoryItem.supplier && (
                      <p className="text-sm text-muted-foreground">
                        Supplier: {alert.inventoryItem.supplier.name}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {alert.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openResolveDialog(alert)}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDismissDialog(alert)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve/Dismiss Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "resolve" ? "Resolve Alert" : "Dismiss Alert"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "resolve"
                ? "Mark this alert as resolved after placing a reorder."
                : "Dismiss this alert if it does not require action."}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted">
                <h4 className="font-semibold">
                  {selectedAlert.inventoryItem.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  SKU: {selectedAlert.inventoryItem.sku}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span>Current: {selectedAlert.currentStock}</span>
                  <span>Reorder Point: {selectedAlert.reorderPoint}</span>
                  <span>Suggested: {selectedAlert.reorderQuantity}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  placeholder={
                    dialogType === "resolve"
                      ? 'e.g., "Ordered 50 units from Supplier X, PO#12345"'
                      : 'e.g., "Supplier out of stock temporarily"'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogAction}>
              {dialogType === "resolve" ? "Mark as Resolved" : "Dismiss Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
