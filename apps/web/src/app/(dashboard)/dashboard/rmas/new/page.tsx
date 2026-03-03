"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Trash2, Loader2, RotateCcw } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}
interface SalesOrder {
  id: string;
  soNumber: string;
}
interface ReturnReason {
  id: string;
  name: string;
  code: string;
}
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
}
interface RMAItem {
  inventoryItemId: string;
  sku: string;
  name: string;
  quantity: number;
  reason: string;
}

export default function NewRMAPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [returnReasons, setReturnReasons] = useState<ReturnReason[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [returnReasonId, setReturnReasonId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [returnTrackingNumber, setReturnTrackingNumber] = useState("");
  const [returnCarrier, setReturnCarrier] = useState("");
  const [rmaItems, setRmaItems] = useState<RMAItem[]>([
    { inventoryItemId: "", sku: "", name: "", quantity: 1, reason: "" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/return-reasons")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch("/api/inventory?limit=200").then((r) => r.json()),
    ]).then(([c, rr, inv]) => {
      setCustomers(c.customers || c.data || []);
      setReturnReasons(rr.reasons || rr.data || []);
      setItems(inv.items || inv.data || []);
    });
  }, []);

  useEffect(() => {
    if (!customerId) {
      setSalesOrders([]);
      return;
    }
    fetch(`/api/sales-orders?customerId=${customerId}&limit=50`)
      .then((r) => r.json())
      .then((d) => setSalesOrders(d.salesOrders || d.data || []));
  }, [customerId]);

  const addItem = () =>
    setRmaItems((prev) => [
      ...prev,
      { inventoryItemId: "", sku: "", name: "", quantity: 1, reason: "" },
    ]);

  const removeItem = (i: number) =>
    setRmaItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (
    i: number,
    field: keyof RMAItem,
    value: string | number,
  ) => {
    setRmaItems((prev) => {
      const updated = [...prev];
      if (field === "inventoryItemId") {
        const inv = items.find((it) => it.id === value);
        updated[i] = {
          ...updated[i],
          inventoryItemId: value as string,
          sku: inv?.sku || "",
          name: inv?.name || "",
        };
      } else {
        (updated[i] as any)[field] = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }
    if (!returnReasonId) {
      toast({ title: "Select a return reason", variant: "destructive" });
      return;
    }
    const validItems = rmaItems.filter(
      (it) => it.inventoryItemId && it.quantity > 0,
    );
    if (validItems.length === 0) {
      toast({ title: "Add at least one item", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/rmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          returnReasonId,
          salesOrderId: salesOrderId || undefined,
          customerNotes: customerNotes || undefined,
          returnTrackingNumber: returnTrackingNumber || undefined,
          returnCarrier: returnCarrier || undefined,
          items: validItems.map(({ inventoryItemId, quantity, reason }) => ({
            inventoryItemId,
            quantity,
            reason: reason || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      toast({
        title: "RMA created",
        description: `RMA# ${data.rma?.rmaNumber || ""}`,
      });
      router.push("/dashboard/rmas");
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
        <Link href="/dashboard/rmas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RotateCcw className="h-7 w-7" />
            New RMA
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a return merchandise authorization
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>RMA Details</CardTitle>
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
              <Label>Return Reason *</Label>
              <Select
                value={returnReasonId}
                onValueChange={setReturnReasonId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.length > 0 ? (
                    returnReasons.map((rr) => (
                      <SelectItem key={rr.id} value={rr.id}>
                        {rr.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default">General Return</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Sales Order</Label>
              <Select value={salesOrderId} onValueChange={setSalesOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional..." />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders.map((so) => (
                    <SelectItem key={so.id} value={so.id}>
                      {so.soNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Return Carrier</Label>
              <Input
                value={returnCarrier}
                onChange={(e) => setReturnCarrier(e.target.value)}
                placeholder="UPS, FedEx, USPS..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Return Tracking Number</Label>
              <Input
                value={returnTrackingNumber}
                onChange={(e) => setReturnTrackingNumber(e.target.value)}
                placeholder="Enter tracking number if known"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Return Items</CardTitle>
              <CardDescription>Products being returned</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {rmaItems.map((item, i) => (
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
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Item Reason</Label>
                  <Input
                    className="h-8 text-sm"
                    value={item.reason}
                    onChange={(e) => updateItem(i, "reason", e.target.value)}
                    placeholder="Damaged, wrong item..."
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(i)}
                    disabled={rmaItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Notes from the customer about this return..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/rmas">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {saving ? "Creating..." : "Create RMA"}
          </Button>
        </div>
      </form>
    </div>
  );
}
