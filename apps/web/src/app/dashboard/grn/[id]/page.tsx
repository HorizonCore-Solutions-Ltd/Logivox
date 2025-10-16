"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Warehouse,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";

interface GRNItem {
  id: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number | null;
  rejectedQuantity: number | null;
  qcStatus: string | null;
  hasDefects: boolean;
  defectDescription: string | null;
  batchNumber: string | null;
  serialNumbers: string[];
  expiryDate: string | null;
  binLocation: string | null;
  putAwayCompleted: boolean;
  unitPrice: number;
  inventoryItem: {
    name: string;
    sku: string;
  };
  purchaseOrderItem: {
    id: string;
  };
}

interface GRN {
  id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  totalReceived: number;
  currency: string;
  hasDiscrepancy: boolean;
  discrepancyNotes: string | null;
  qcStatus: string | null;
  qcNotes: string | null;
  qcDate: string | null;
  putAwayCompleted: boolean;
  purchaseOrder: {
    poNumber: string;
    supplier: {
      name: string;
      code: string;
      email: string | null;
    };
  };
  warehouse: {
    name: string;
    code: string;
  } | null;
  receivedBy: {
    name: string;
    email: string;
  };
  qcBy: {
    name: string;
    email: string;
  } | null;
  items: GRNItem[];
}

interface QCItemData {
  itemId: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  hasDefects: boolean;
  defectDescription: string;
}

export default function GRNDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [grn, setGRN] = useState<GRN | null>(null);
  const [qcDialogOpen, setQcDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [qcOverallStatus, setQcOverallStatus] = useState<"PASS" | "FAIL" | "PARTIAL">("PASS");
  const [qcNotes, setQcNotes] = useState("");
  const [qcItems, setQcItems] = useState<QCItemData[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchGRN();
    }
  }, [params.id]);

  const fetchGRN = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grn/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setGRN(data);
        
        // Initialize QC items data
        setQcItems(
          data.items.map((item: GRNItem) => ({
            itemId: item.id,
            acceptedQuantity: item.acceptedQuantity ?? item.receivedQuantity,
            rejectedQuantity: item.rejectedQuantity ?? 0,
            hasDefects: item.hasDefects,
            defectDescription: item.defectDescription || "",
          }))
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to load GRN details",
          variant: "destructive",
        });
        router.push("/dashboard/grn");
      }
    } catch (error) {
      console.error("Error fetching GRN:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading the GRN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQualityCheck = async () => {
    if (!grn) return;

    try {
      const response = await fetch(`/api/grn/${grn.id}/quality-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallStatus: qcOverallStatus,
          qcNotes,
          items: qcItems,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Quality check completed successfully",
        });
        setQcDialogOpen(false);
        fetchGRN();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to complete quality check",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error performing quality check:", error);
      toast({
        title: "Error",
        description: "An error occurred during quality check",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (!grn) return;

    try {
      const response = await fetch(`/api/grn/${grn.id}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "GRN completed and inventory updated",
        });
        setCompleteDialogOpen(false);
        fetchGRN();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to complete GRN",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error completing GRN:", error);
      toast({
        title: "Error",
        description: "An error occurred while completing the GRN",
        variant: "destructive",
      });
    }
  };

  const updateQCItem = (itemId: string, field: keyof QCItemData, value: any) => {
    setQcItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "QUALITY_CHECK":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!grn) {
    return <div className="text-center py-8">GRN not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{grn.grnNumber}</h1>
            <p className="text-muted-foreground">
              Goods Receipt Note Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {grn.status === "PENDING" && (
            <Button onClick={() => setQcDialogOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Quality Check
            </Button>
          )}
          {grn.status === "APPROVED" && (
            <Button onClick={() => setCompleteDialogOpen(true)}>
              <Package className="mr-2 h-4 w-4" />
              Complete & Update Inventory
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(grn.status)}>{grn.status}</Badge>
            {grn.hasDiscrepancy && (
              <Badge variant="outline" className="ml-2 bg-yellow-50">
                Discrepancy
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grn.currency} {grn.totalReceived.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grn.items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QC Status</CardTitle>
          </CardHeader>
          <CardContent>
            {grn.qcStatus ? (
              <Badge
                className={
                  grn.qcStatus === "PASS"
                    ? "bg-green-100 text-green-800"
                    : grn.qcStatus === "FAIL"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {grn.qcStatus}
              </Badge>
            ) : (
              <span className="text-muted-foreground">Pending</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Purchase Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">PO Number</Label>
              <div className="font-medium">{grn.purchaseOrder.poNumber}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Supplier</Label>
              <div className="font-medium">{grn.purchaseOrder.supplier.name}</div>
              <div className="text-sm text-muted-foreground">
                {grn.purchaseOrder.supplier.code}
              </div>
              {grn.purchaseOrder.supplier.email && (
                <div className="text-sm text-muted-foreground">
                  {grn.purchaseOrder.supplier.email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Warehouse & Receiving
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Warehouse</Label>
              <div className="font-medium">
                {grn.warehouse ? grn.warehouse.name : "Not assigned"}
              </div>
              {grn.warehouse && (
                <div className="text-sm text-muted-foreground">
                  {grn.warehouse.code}
                </div>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Received Date</Label>
              <div className="font-medium">
                {new Date(grn.receivedDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Received By</Label>
              <div className="font-medium">{grn.receivedBy.name}</div>
              <div className="text-sm text-muted-foreground">
                {grn.receivedBy.email}
              </div>
            </div>
            {grn.qcBy && (
              <div>
                <Label className="text-muted-foreground">QC Performed By</Label>
                <div className="font-medium">{grn.qcBy.name}</div>
                <div className="text-sm text-muted-foreground">
                  {grn.qcDate
                    ? new Date(grn.qcDate).toLocaleDateString()
                    : ""}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Discrepancy Alert */}
      {grn.hasDiscrepancy && grn.discrepancyNotes && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Discrepancy Noted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">{grn.discrepancyNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* QC Notes */}
      {grn.qcNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Control Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{grn.qcNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Received Items</CardTitle>
          <CardDescription>
            Detailed breakdown of all items in this receipt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Accepted</TableHead>
                <TableHead>Rejected</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Bin Location</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grn.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.inventoryItem.sku}
                  </TableCell>
                  <TableCell>
                    {item.inventoryItem.name}
                    {item.hasDefects && (
                      <Badge variant="outline" className="ml-2 bg-red-50">
                        Defects
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.orderedQuantity}</TableCell>
                  <TableCell>
                    {item.receivedQuantity}
                    {item.receivedQuantity !== item.orderedQuantity && (
                      <AlertCircle className="inline ml-1 h-3 w-3 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell>{item.acceptedQuantity ?? "-"}</TableCell>
                  <TableCell>{item.rejectedQuantity ?? "-"}</TableCell>
                  <TableCell>{item.batchNumber || "-"}</TableCell>
                  <TableCell>
                    {item.binLocation || "-"}
                    {item.putAwayCompleted && (
                      <CheckCircle className="inline ml-1 h-3 w-3 text-green-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {grn.currency} {item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {item.qcStatus ? (
                      <Badge
                        className={
                          item.qcStatus === "PASS"
                            ? "bg-green-100 text-green-800"
                            : item.qcStatus === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {item.qcStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quality Check Dialog */}
      <Dialog open={qcDialogOpen} onOpenChange={setQcDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perform Quality Check</DialogTitle>
            <DialogDescription>
              Inspect each item and record accepted/rejected quantities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Overall QC Status</Label>
              <Select
                value={qcOverallStatus}
                onValueChange={(value: any) => setQcOverallStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASS">Pass</SelectItem>
                  <SelectItem value="FAIL">Fail</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>QC Notes</Label>
              <Textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder="Enter quality control notes..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Item Inspection</h3>
              {grn.items.map((item, index) => {
                const qcItem = qcItems.find((qi) => qi.itemId === item.id);
                if (!qcItem) return null;

                return (
                  <div key={item.id} className="border-b pb-4 last:border-0">
                    <div className="font-medium mb-2">
                      {item.inventoryItem.name} ({item.inventoryItem.sku})
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Accepted Quantity</Label>
                        <Input
                          type="number"
                          value={qcItem.acceptedQuantity}
                          onChange={(e) =>
                            updateQCItem(
                              item.id,
                              "acceptedQuantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div>
                        <Label>Rejected Quantity</Label>
                        <Input
                          type="number"
                          value={qcItem.rejectedQuantity}
                          onChange={(e) =>
                            updateQCItem(
                              item.id,
                              "rejectedQuantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          max={item.receivedQuantity}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Defect Description (if any)</Label>
                        <Textarea
                          value={qcItem.defectDescription}
                          onChange={(e) => {
                            updateQCItem(item.id, "defectDescription", e.target.value);
                            updateQCItem(item.id, "hasDefects", e.target.value.length > 0);
                          }}
                          placeholder="Describe any defects found..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQcDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQualityCheck}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit QC Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete GRN?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update inventory quantities and mark the GRN as completed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
