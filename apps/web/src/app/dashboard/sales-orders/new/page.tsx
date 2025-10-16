"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
  email: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  availableQty: number;
}

interface SOItemForm {
  inventoryItemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  binLocation: string;
  notes: string;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [promisedDate, setPromisedDate] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [items, setItems] = useState<SOItemForm[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchWarehouses();
    fetchInventoryItems();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
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
      console.error("Error fetching inventory:", error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        inventoryItemId: "",
        itemName: "",
        sku: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
        binLocation: "",
        notes: "",
      },
    ]);
  };

  const updateItem = (index: number, field: keyof SOItemForm, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "inventoryItemId" && value) {
        const item = inventoryItems.find((i) => i.id === value);
        if (item) {
          updated[index] = {
            ...updated[index],
            inventoryItemId: value,
            itemName: item.name,
            sku: item.sku,
            unitPrice: item.sellingPrice || 0,
          } as SOItemForm;
          return updated;
        }
      }
      updated[index] = { ...updated[index], [field]: value } as SOItemForm;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
      0
    );
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unitPrice - item.discount;
      return sum + lineSubtotal * (item.taxRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (status: "DRAFT" | "PENDING_APPROVAL") => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
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

    if (items.some((item) => !item.inventoryItemId || item.quantity <= 0)) {
      toast({
        title: "Error",
        description: "All items must have valid inventory item and quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          warehouseId: warehouseId || undefined,
          requestedDate: requestedDate || undefined,
          promisedDate: promisedDate || undefined,
          shippingMethod: shippingMethod || undefined,
          shippingAddress: shippingAddress || undefined,
          shippingCity: shippingCity || undefined,
          shippingState: shippingState || undefined,
          shippingZip: shippingZip || undefined,
          shippingCountry: shippingCountry || undefined,
          paymentMethod: paymentMethod || undefined,
          priority,
          notes: notes || undefined,
          internalNotes: internalNotes || undefined,
          status,
          items: items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            binLocation: item.binLocation || undefined,
            notes: item.notes || undefined,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Sales order ${data.soNumber} created successfully`,
        });
        router.push(`/dashboard/sales-orders/${data.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create sales order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating sales order:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the sales order",
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
            <h1 className="text-3xl font-bold tracking-tight">New Sales Order</h1>
            <p className="text-muted-foreground">Create a new customer order</p>
          </div>
        </div>
      </div>

      {/* Customer & Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Customer & Fulfillment</CardTitle>
          <CardDescription>Select customer and warehouse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>Dates and shipping information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Requested Delivery Date</Label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Promised Delivery Date</Label>
              <Input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Priority (0-10)</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min={0}
                max={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Shipping Method</Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                  <SelectItem value="PICKUP">Pickup</SelectItem>
                  <SelectItem value="FREIGHT">Freight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, Net 30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
          <CardDescription>Customer delivery address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Street Address</Label>
            <Input
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
              />
            </div>
            <div>
              <Label>State/Province</Label>
              <Input
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
              />
            </div>
            <div>
              <Label>ZIP/Postal Code</Label>
              <Input
                value={shippingZip}
                onChange={(e) => setShippingZip(e.target.value)}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Order Items</span>
            <Button onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardTitle>
          <CardDescription>Select products for this order</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items added. Click "Add Item" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Tax %</TableHead>
                    <TableHead>Line Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const lineSubtotal = item.quantity * item.unitPrice - item.discount;
                    const lineTax = lineSubtotal * (item.taxRate / 100);
                    const lineTotal = lineSubtotal + lineTax;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.inventoryItemId}
                            onValueChange={(value) =>
                              updateItem(index, "inventoryItemId", value)
                            }
                          >
                            <SelectTrigger className="w-[250px]">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((invItem) => (
                                <SelectItem key={invItem.id} value={invItem.id}>
                                  {invItem.name} ({invItem.sku}) - Stock: {invItem.availableQty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 0)
                            }
                            className="w-20"
                            min={1}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                            step="0.01"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(index, "discount", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                            step="0.01"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              updateItem(index, "taxRate", parseFloat(e.target.value) || 0)
                            }
                            className="w-20"
                            step="0.01"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>${lineTotal.toFixed(2)}</TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Notes</CardTitle>
            <CardDescription>Visible to customer</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes for the customer..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
            <CardDescription>Internal use only</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Enter internal notes..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={loading}
        >
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("PENDING_APPROVAL")} disabled={loading}>
          {loading ? "Creating..." : "Submit for Approval"}
        </Button>
      </div>
    </div>
  );
}
