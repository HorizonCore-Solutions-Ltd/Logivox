"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}
interface Warehouse {
  id: string;
  name: string;
  code: string;
}
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
}
interface OrderItem {
  inventoryItemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { inventoryItemId: "", sku: "", name: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/warehouses").then((r) => r.json()),
      fetch("/api/inventory?limit=200").then((r) => r.json()),
    ]).then(([c, w, inv]) => {
      setCustomers(c.customers || c.data || []);
      setWarehouses(w.warehouses || w.data || []);
      setItems(inv.items || inv.data || []);
    });
  }, []);

  const addItem = () =>
    setOrderItems((prev) => [
      ...prev,
      { inventoryItemId: "", sku: "", name: "", quantity: 1, unitPrice: 0 },
    ]);

  const removeItem = (i: number) =>
    setOrderItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (
    i: number,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      if (field === "inventoryItemId") {
        const inv = items.find((it) => it.id === value);
        updated[i] = {
          ...updated[i],
          inventoryItemId: value as string,
          sku: inv?.sku || "",
          name: inv?.name || "",
          unitPrice: inv?.unitPrice || 0,
        };
      } else {
        (updated[i] as any)[field] = value;
      }
      return updated;
    });
  };

  const total = orderItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }
    const validItems = orderItems.filter(
      (it) => it.inventoryItemId && it.quantity > 0,
    );
    if (validItems.length === 0) {
      toast({ title: "Add at least one item", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          warehouseId: warehouseId || undefined,
          requestedDate: requestedDate || undefined,
          shippingMethod,
          shippingAddress: shippingAddress || undefined,
          shippingCity: shippingCity || undefined,
          shippingState: shippingState || undefined,
          shippingZip: shippingZip || undefined,
          shippingCountry: shippingCountry || undefined,
          notes: notes || undefined,
          status: "DRAFT",
          items: validItems.map(({ inventoryItemId, quantity, unitPrice }) => ({
            inventoryItemId,
            quantity,
            unitPrice,
          })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const { salesOrder } = await res.json();
      toast({
        title: "Sales order created",
        description: `SO# ${salesOrder?.soNumber || ""}`,
      });
      router.push("/dashboard/sales-orders");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7" />
            New Sales Order
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new sales order for a customer
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Warehouse */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Requested Date</Label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Shipping Method</Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "STANDARD",
                    "EXPRESS",
                    "OVERNIGHT",
                    "PICKUP",
                    "FREIGHT",
                  ].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Street Address</Label>
              <Input
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>State/Province</Label>
              <Input
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP/Postal Code</Label>
              <Input
                value={shippingZip}
                onChange={(e) => setShippingZip(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
                placeholder="US"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderItems.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-end border-b pb-3"
              >
                <div className="col-span-5 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <Select
                    value={item.inventoryItemId}
                    onValueChange={(v) => updateItem(i, "inventoryItemId", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it.id} value={it.id}>
                          {it.sku} – {it.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(i, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Unit Price ($)</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        i,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div className="col-span-1 text-sm font-medium text-right pt-1">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(i)}
                    disabled={orderItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end text-lg font-semibold pt-2">
              Total: ${total.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes or special instructions..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/sales-orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            {saving ? "Creating..." : "Create Sales Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
