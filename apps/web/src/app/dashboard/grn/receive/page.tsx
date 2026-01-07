"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    name: string;
    code: string;
  };
  items: POItem[];
}

interface POItem {
  id: string;
  inventoryItemId: string;
  quantity: number;
  quantityReceived: number;
  unitPrice: number;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
  };
}

interface GRNItemForm {
  purchaseOrderItemId: string;
  inventoryItemId: string;
  itemName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  binLocation: string;
}

export default function ReceiveGoodsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GRNItemForm[]>([]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch("/api/purchase-orders?status=APPROVED");
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      });
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      setSelectedPO(po);
      // Initialize items from PO
      const grnItems: GRNItemForm[] = po.items.map((item) => ({
        purchaseOrderItemId: item.id,
        inventoryItemId: item.inventoryItemId,
        itemName: item.inventoryItem.name,
        sku: item.inventoryItem.sku,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity - item.quantityReceived,
        unitPrice: item.unitPrice,
        batchNumber: "",
        expiryDate: "",
        binLocation: "",
      }));
      setItems(grnItems);
    }
  };

  const updateItem = (index: number, field: keyof GRNItemForm, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as GRNItemForm;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.receivedQuantity * item.unitPrice,
      0,
    );
  };

  const hasDiscrepancy = () => {
    return items.some((item) => item.receivedQuantity !== item.orderedQuantity);
  };

  const handleSubmit = async (status: "DRAFT" | "PENDING") => {
    if (!selectedPO) {
      toast({
        title: "Error",
        description: "Please select a purchase order",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => item.receivedQuantity <= 0)) {
      toast({
        title: "Error",
        description: "All items must have received quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/grn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: selectedPO.id,
          receivedDate,
          status,
          notes,
          items: items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            inventoryItemId: item.inventoryItemId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            unitPrice: item.unitPrice,
            batchNumber: item.batchNumber || undefined,
            expiryDate: item.expiryDate || undefined,
            binLocation: item.binLocation || undefined,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `GRN ${data.grnNumber} created successfully`,
        });
        router.push(`/dashboard/grn/${data.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create GRN",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating GRN:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the GRN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receive Goods</h1>
            <p className="text-muted-foreground">
              Create a new goods receipt note
            </p>
          </div>
        </div>
      </div>

      {/* Purchase Order Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Purchase Order
          </CardTitle>
          <CardDescription>
            Choose the purchase order for which you are receiving goods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Purchase Order</Label>
            <Select value={selectedPO?.id || ""} onValueChange={handlePOSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase order" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplier.name} ({po.items.length} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPO && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Supplier:</span>
                <span className="text-sm">
                  {selectedPO.supplier.name} ({selectedPO.supplier.code})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Items:</span>
                <span className="text-sm">{selectedPO.items.length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Details */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
          <CardDescription>
            Enter the details of the goods being received
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Received Date</Label>
            <Input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes about this receipt..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Received Items</CardTitle>
            <CardDescription>
              Enter the actual quantities and details for each item
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasDiscrepancy() && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Discrepancy Detected
                  </p>
                  <p className="text-sm text-yellow-700">
                    Some received quantities differ from ordered quantities.
                    This will be flagged for review.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Bin Location</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.orderedQuantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "receivedQuantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                          min={0}
                        />
                        {item.receivedQuantity !== item.orderedQuantity && (
                          <AlertCircle className="inline ml-1 h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          value={item.batchNumber}
                          onChange={(e) =>
                            updateItem(index, "batchNumber", e.target.value)
                          }
                          placeholder="Batch"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) =>
                            updateItem(index, "expiryDate", e.target.value)
                          }
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.binLocation}
                          onChange={(e) =>
                            updateItem(index, "binLocation", e.target.value)
                          }
                          placeholder="Bin"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        ${(item.receivedQuantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm font-medium">Total Value</div>
                  <div className="text-2xl font-bold">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {items.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit("DRAFT")}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit("PENDING")} disabled={loading}>
            {loading ? "Creating..." : "Submit for QC"}
          </Button>
        </div>
      )}
    </div>
  );
}
