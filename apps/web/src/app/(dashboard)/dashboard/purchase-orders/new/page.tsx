"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Building,
  Calendar,
  Package,
  MapPin,
  FileText,
  Send,
  AlertTriangle,
} from "lucide-react";

interface LineItem {
  inventoryItemId?: string;
  sku: string;
  description: string;
  quantityOrdered: number;
  unitPrice: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { sku: "", description: "", quantityOrdered: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [suppRes, invRes] = await Promise.all([
          fetch("/api/suppliers?limit=200"),
          fetch("/api/inventory?limit=500"),
        ]);
        const suppData = await suppRes.json();
        const invData = await invRes.json();
        setSuppliers(suppData.suppliers ?? suppData.data ?? []);
        setInventoryItems(invData.items ?? invData.data ?? []);
      } catch (e) {
        console.error("Failed to load form data", e);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  const addItem = () =>
    setItems([...items, { sku: "", description: "", quantityOrdered: 1, unitPrice: 0 }]);

  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const populateFromInventory = (idx: number, inventoryItemId: string) => {
    const item = inventoryItems.find((i) => i.id === inventoryItemId);
    if (!item) return;
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      inventoryItemId: item.id,
      sku: item.sku ?? "",
      description: item.name ?? "",
      unitPrice: parseFloat(item.costPrice ?? item.unitCost ?? 0),
    };
    setItems(updated);
  };

  const totalValue = items.reduce(
    (sum, i) => sum + i.quantityOrdered * i.unitPrice,
    0,
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplierId = "Supplier is required";
    items.forEach((item, idx) => {
      if (!item.sku) errs[`item_${idx}_sku`] = "SKU required";
      if (!item.description) errs[`item_${idx}_desc`] = "Description required";
      if (item.quantityOrdered < 1) errs[`item_${idx}_qty`] = "Qty must be ≥ 1";
      if (item.unitPrice <= 0) errs[`item_${idx}_price`] = "Price must be > 0";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (draft = false) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: any = {
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
        deliveryAddress: deliveryAddress || undefined,
        deliveryCity: deliveryCity || undefined,
        deliveryCountry: deliveryCountry || undefined,
        priority,
        notes: notes || undefined,
        items: items.map((i) => ({
          inventoryItemId: i.inventoryItemId || undefined,
          sku: i.sku,
          description: i.description,
          quantityOrdered: i.quantityOrdered,
          unitPrice: i.unitPrice,
        })),
      };

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create purchase order");
      }

      const data = await res.json();
      const poId = data.id ?? data.purchaseOrder?.id ?? data.po?.id;
      router.push(poId ? `/dashboard/purchase-orders/${poId}` : "/dashboard/purchase-orders");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardSidebar>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardSidebar>
    );
  }

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/purchase-orders")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">New Purchase Order</h1>
        </div>

        {/* Supplier & Core Details */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" /> Order Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">
                Supplier <span className="text-destructive">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors.supplierId ? "border-destructive" : "border-input"}`}
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-xs text-destructive mt-1">{errors.supplierId}</p>}
            </div>

            {/* Expected Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Street address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <input
                type="text"
                placeholder="City"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Country"
                value={deliveryCountry}
                onChange={(e) => setDeliveryCountry(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Notes
            </label>
            <textarea
              rows={3}
              placeholder="Supplier instructions, special requirements…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" /> Line Items
            </h2>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          <div className="p-4 space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Item #{idx + 1}</p>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Pick from inventory */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Linked Inventory Item (optional)</label>
                  <select
                    value={item.inventoryItemId ?? ""}
                    onChange={(e) => e.target.value ? populateFromInventory(idx, e.target.value) : updateItem(idx, "inventoryItemId", "")}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select from inventory (or enter manually below)…</option>
                    {inventoryItems.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.sku} — {inv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      SKU <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="SKU-001"
                      value={item.sku}
                      onChange={(e) => updateItem(idx, "sku", e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${idx}_sku`] ? "border-destructive" : "border-input"}`}
                    />
                    {errors[`item_${idx}_sku`] && <p className="text-xs text-destructive mt-1">{errors[`item_${idx}_sku`]}</p>}
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Qty <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantityOrdered}
                      onChange={(e) => updateItem(idx, "quantityOrdered", parseInt(e.target.value) || 1)}
                      className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${idx}_qty`] ? "border-destructive" : "border-input"}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Unit Price (£) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${idx}_price`] ? "border-destructive" : "border-input"}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm text-right font-medium">
                      £{(item.quantityOrdered * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Product description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${errors[`item_${idx}_desc`] ? "border-destructive" : "border-input"}`}
                  />
                  {errors[`item_${idx}_desc`] && <p className="text-xs text-destructive mt-1">{errors[`item_${idx}_desc`]}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-4 py-3 border-t bg-muted/20 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(totalValue)}
              </p>
              <p className="text-xs text-muted-foreground">{items.length} item(s)</p>
            </div>
          </div>
        </div>

        {/* Validation errors summary */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">Please fix the errors above before submitting.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pb-6">
          <Button variant="outline" onClick={() => router.push("/dashboard/purchase-orders")}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit()} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating…</>
            ) : (
              <><Send className="h-4 w-4 mr-1" /> Create Purchase Order</>
            )}
          </Button>
        </div>
      </div>
    </DashboardSidebar>
  );
}
