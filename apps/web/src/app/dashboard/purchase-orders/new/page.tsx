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
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string | null;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  costPrice: number | null;
}

interface POItem {
  id?: string;
  inventoryItemId?: string;
  sku: string;
  description: string;
  quantityOrdered: number;
  unitPrice: number;
  tax: number;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([
    {
      sku: "",
      description: "",
      quantityOrdered: 1,
      unitPrice: 0,
      tax: 0,
    },
  ]);

  useEffect(() => {
    fetchSuppliers();
    fetchInventoryItems();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        sku: "",
        description: "",
        quantityOrdered: 1,
        unitPrice: 0,
        tax: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as POItem;
    setItems(newItems);
  };

  const handleInventoryItemSelect = (
    index: number,
    inventoryItemId: string,
  ) => {
    const inventoryItem = inventoryItems.find(
      (item) => item.id === inventoryItemId,
    );
    if (inventoryItem) {
      handleItemChange(index, "inventoryItemId", inventoryItemId);
      handleItemChange(index, "sku", inventoryItem.sku);
      handleItemChange(index, "description", inventoryItem.name);
      handleItemChange(index, "unitPrice", inventoryItem.costPrice || 0);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitPrice,
      0,
    );
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (status: "DRAFT" | "PENDING") => {
    // Validation
    if (!supplierId) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(
      (item) => item.sku && item.description && item.quantityOrdered > 0,
    );
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid item",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          expectedDate: expectedDate || undefined,
          priority,
          deliveryAddress: deliveryAddress || undefined,
          deliveryCity: deliveryCity || undefined,
          deliveryCountry: deliveryCountry || undefined,
          deliveryNotes: deliveryNotes || undefined,
          notes: notes || undefined,
          internalNotes: internalNotes || undefined,
          items: validItems,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Purchase order ${data.purchaseOrder.poNumber} created successfully`,
        });

        // If submitting for approval, approve it
        if (status === "PENDING") {
          await fetch(`/api/purchase-orders/${data.purchaseOrder.id}/approve`, {
            method: "POST",
          });
        }

        router.push(`/dashboard/purchase-orders/${data.purchaseOrder.id}`);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
          <h1 className="text-3xl font-bold mt-2">Create Purchase Order</h1>
          <p className="text-muted-foreground">
            Create a new purchase order for your supplier
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier & Basic Information</CardTitle>
              <CardDescription>
                Select supplier and set basic purchase order details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    Add items to this purchase order
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Item {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Select from Inventory (Optional)</Label>
                        <Select
                          value={item.inventoryItemId || ""}
                          onValueChange={(value) =>
                            handleInventoryItemSelect(index, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select inventory item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.sku} - {invItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>SKU *</Label>
                        <Input
                          value={item.sku}
                          onChange={(e) =>
                            handleItemChange(index, "sku", e.target.value)
                          }
                          placeholder="Enter SKU"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Enter description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantityOrdered}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantityOrdered",
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tax</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.tax}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "tax",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Line Total</Label>
                        <Input
                          value={`$${(item.quantityOrdered * item.unitPrice + Number(item.tax || 0)).toFixed(2)}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
              <CardDescription>Optional delivery details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCity">City</Label>
                  <Input
                    id="deliveryCity"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryCountry">Country</Label>
                  <Input
                    id="deliveryCountry"
                    value={deliveryCountry}
                    onChange={(e) => setDeliveryCountry(e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Enter any delivery instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Visible to Supplier)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes for the supplier..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Enter internal notes (not visible to supplier)..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">
                    ${calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold">
                    ${calculateTax().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <span>
                    {items.reduce((sum, item) => sum + item.quantityOrdered, 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("DRAFT")}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => handleSubmit("PENDING")}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Submit for Approval"}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/dashboard/purchase-orders")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
