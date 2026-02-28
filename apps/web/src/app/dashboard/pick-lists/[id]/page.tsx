"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlayCircle,
  Package,
  MapPin,
  Barcode,
  Hash,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Calendar,
  ListChecks,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface PickListItem {
  id: string;
  quantityToPick: number;
  quantityPicked: number;
  binLocation?: string;
  batchNumber?: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
    binLocation?: string;
  };
  salesOrderItem: {
    id: string;
    quantity: number;
    quantityPicked: number;
  };
}

interface PickList {
  id: string;
  pickListNumber: string;
  status: string;
  priority: number;
  startedDate?: string;
  completedDate?: string;
  notes?: string;
  salesOrder: {
    id: string;
    soNumber: string;
    customer: {
      id: string;
      name: string;
    };
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  items: PickListItem[];
  statistics: {
    totalItems: number;
    completedItems: number;
    totalQuantityToPick: number;
    totalQuantityPicked: number;
    progressPercent: number;
  };
}

interface PickingForm {
  pickListItemId: string;
  quantityPicked: number;
  binLocation?: string;
  batchNumber?: string;
}

export default function PickListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [pickList, setPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickingForm, setPickingForm] = useState<PickingForm | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPickList();
  }, [params.id]);

  const fetchPickList = async () => {
    try {
      const response = await fetch(`/api/pick-lists/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch pick list");

      const data = await response.json();
      setPickList(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pick list details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartPicking = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/pick-lists/${params.id}/start`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to start picking");

      toast({
        title: "Success",
        description: "Pick list started successfully",
      });

      setShowStartDialog(false);
      fetchPickList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start pick list",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePickItem = async (itemId: string) => {
    const item = pickList?.items.find((i) => i.id === itemId);
    if (!item) return;

    setPickingForm({
      pickListItemId: itemId,
      quantityPicked: item.quantityToPick - item.quantityPicked,
      binLocation: item.binLocation,
      batchNumber: item.batchNumber,
    });
  };

  const submitPick = async () => {
    if (!pickingForm) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/pick-lists/${params.id}/pick-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickingForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pick item");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: data.pickListCompleted
          ? "Pick list completed! All items picked."
          : "Item picked successfully",
      });

      setPickingForm(null);
      fetchPickList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pick item",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-gray-500",
      IN_PROGRESS: "bg-blue-500",
      PICKED: "bg-green-500",
      CANCELLED: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pick list...</p>
        </div>
      </div>
    );
  }

  if (!pickList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">Pick list not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardSidebar>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {pickList.pickListNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Sales Order: {pickList.salesOrder.soNumber} -{" "}
            {pickList.salesOrder.customer.name}
          </p>
        </div>
        <div className="flex gap-2">
          {pickList.status === "PENDING" && (
            <Button onClick={() => setShowStartDialog(true)}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Picking
            </Button>
          )}
          {pickList.status === "PICKED" && (
            <Button
              onClick={() =>
                router.push(`/dashboard/sales-orders/${pickList.salesOrder.id}`)
              }
            >
              View Sales Order
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            <ListChecks className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(pickList.status)}>
              {pickList.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progress
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pickList.statistics.progressPercent}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pickList.statistics.totalQuantityPicked} /{" "}
              {pickList.statistics.totalQuantityToPick} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Items
            </CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pickList.statistics.completedItems} /{" "}
              {pickList.statistics.totalItems}
            </div>
            <p className="text-xs text-gray-500 mt-1">Items picked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Priority
            </CardTitle>
            <Hash className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickList.priority}</div>
            <p className="text-xs text-gray-500 mt-1">
              {pickList.priority >= 8
                ? "High"
                : pickList.priority >= 5
                  ? "Medium"
                  : "Normal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Building2 className="w-4 h-4 mr-2" />
              Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{pickList.warehouse.name}</p>
            <p className="text-sm text-gray-500">
              Code: {pickList.warehouse.code}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <User className="w-4 h-4 mr-2" />
              Assigned To
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pickList.assignedTo ? (
              <>
                <p className="font-semibold">{pickList.assignedTo.name}</p>
                <p className="text-sm text-gray-500">
                  {pickList.assignedTo.email}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pickList.startedDate && (
              <p className="text-sm">
                <span className="text-gray-500">Started:</span>{" "}
                {new Date(pickList.startedDate).toLocaleString()}
              </p>
            )}
            {pickList.completedDate && (
              <p className="text-sm mt-1">
                <span className="text-gray-500">Completed:</span>{" "}
                {new Date(pickList.completedDate).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Pick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Bin Location</TableHead>
                  <TableHead className="text-center">To Pick</TableHead>
                  <TableHead className="text-center">Picked</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickList.items.map((item) => {
                  const remaining = item.quantityToPick - item.quantityPicked;
                  const isComplete = remaining === 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.inventoryItem.sku}
                      </TableCell>
                      <TableCell>{item.inventoryItem.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {item.inventoryItem.binLocation || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantityToPick}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantityPicked}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {remaining}
                      </TableCell>
                      <TableCell>
                        {isComplete ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isComplete && pickList.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            onClick={() => handlePickItem(item.id)}
                          >
                            Pick
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Start Picking Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Picking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the pick list as IN_PROGRESS and you can begin
              picking items. The pick list will be assigned to you if not
              already assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartPicking}
              disabled={processing}
            >
              {processing ? "Starting..." : "Start Picking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pick Item Dialog */}
      <AlertDialog
        open={!!pickingForm}
        onOpenChange={() => setPickingForm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pick Item</AlertDialogTitle>
            <AlertDialogDescription>
              Record the quantity picked for this item.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pickingForm && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="quantity">Quantity Picked</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={pickingForm.quantityPicked}
                  onChange={(e) =>
                    setPickingForm({
                      ...pickingForm,
                      quantityPicked: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="binLocation">Bin Location (Optional)</Label>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <Input
                    id="binLocation"
                    value={pickingForm.binLocation || ""}
                    onChange={(e) =>
                      setPickingForm({
                        ...pickingForm,
                        binLocation: e.target.value,
                      })
                    }
                    placeholder="e.g., A-01-02"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
                <div className="flex items-center">
                  <Barcode className="w-4 h-4 mr-2 text-gray-400" />
                  <Input
                    id="batchNumber"
                    value={pickingForm.batchNumber || ""}
                    onChange={(e) =>
                      setPickingForm({
                        ...pickingForm,
                        batchNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., BATCH-2025-001"
                  />
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitPick} disabled={processing}>
              {processing ? "Picking..." : "Confirm Pick"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DashboardSidebar>
  );
}
