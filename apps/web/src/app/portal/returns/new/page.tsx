"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderSummary {
  id: string;
  soNumber: string;
  orderDate: string;
  deliveredDate: string | null;
  total: number;
  status: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  inventoryItem: {
    sku: string;
    name: string;
  };
}

interface ReturnLineItem {
  salesOrderItemId: string;
  sku: string;
  name: string;
  maxQuantity: number;
  unitPrice: number;
  selected: boolean;
  quantity: number;
  reason: string;
  condition: "NEW" | "GOOD" | "FAIR" | "DAMAGED" | "DEFECTIVE";
  notes: string;
}

type ReturnMethod = "PREPAID_LABEL" | "DROP_OFF" | "PICKUP";

const CONDITION_OPTIONS = [
  { value: "NEW", label: "Unopened / New" },
  { value: "GOOD", label: "Good (minor wear)" },
  { value: "FAIR", label: "Fair (used, functional)" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "DEFECTIVE", label: "Defective / Not working" },
] as const;

const RETURN_METHOD_OPTIONS: {
  value: ReturnMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "PREPAID_LABEL",
    label: "Prepaid Shipping Label",
    description: "We will email you a pre-paid return label",
  },
  {
    value: "DROP_OFF",
    label: "Drop Off at Carrier",
    description: "Bring your package to any approved carrier location",
  },
  {
    value: "PICKUP",
    label: "Schedule a Pickup",
    description: "We will arrange a courier to collect from your address",
  },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Select Order" },
    { n: 2, label: "Choose Items" },
    { n: 3, label: "Confirm & Submit" },
  ];
  return (
    <div className="flex items-center space-x-2 mb-8">
      {steps.map((step, idx) => (
        <div key={step.n} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
              ${
                step.n < current
                  ? "bg-green-500 text-white"
                  : step.n === current
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
          >
            {step.n < current ? <CheckCircle2 className="h-4 w-4" /> : step.n}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${step.n === current ? "text-blue-600" : "text-gray-500"}`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="w-8 h-px bg-gray-300 mx-3" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewReturnPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: order selection
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // Step 2: item selection
  const [lineItems, setLineItems] = useState<ReturnLineItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Step 3: return details
  const [returnMethod, setReturnMethod] =
    useState<ReturnMethod>("PREPAID_LABEL");
  const [notes, setNotes] = useState("");

  // ── Fetch eligible orders ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await fetch("/api/portal/orders?status=DELIVERED&limit=50");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load orders");
        }
        const data = await res.json();
        // Filter on client too — only delivered orders are eligible
        const eligible: OrderSummary[] = (data.orders || []).filter(
          (o: OrderSummary) => o.deliveredDate,
        );
        setOrders(eligible);
      } catch (err: any) {
        setOrdersError(err.message || "Unable to load orders");
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ── Load items when order is chosen ──────────────────────────────────────
  const handleOrderSelect = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLineItems([]);
    if (!orderId) return;

    setItemsLoading(true);
    try {
      const res = await fetch(`/api/portal/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load order details");
      }
      const order = await res.json();
      const items: OrderItem[] = order.items || [];

      setLineItems(
        items.map((item) => ({
          salesOrderItemId: item.id,
          sku: item.inventoryItem?.sku ?? "",
          name: item.inventoryItem?.name ?? "Unknown item",
          maxQuantity: item.quantity,
          unitPrice: item.unitPrice,
          selected: false,
          quantity: 1,
          reason: "",
          condition: "GOOD",
          notes: "",
        })),
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not load order items",
        variant: "destructive",
      });
    } finally {
      setItemsLoading(false);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const selectedItems = lineItems.filter((li) => li.selected);

  const step1Valid = !!selectedOrderId && !!selectedOrder;

  const step2Valid =
    selectedItems.length > 0 &&
    selectedItems.every(
      (li) =>
        li.reason.trim().length >= 3 &&
        li.quantity >= 1 &&
        li.quantity <= li.maxQuantity,
    );

  // ── Toggle item selection ─────────────────────────────────────────────────
  const toggleItem = (salesOrderItemId: string) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.salesOrderItemId === salesOrderItemId
          ? { ...li, selected: !li.selected }
          : li,
      ),
    );
  };

  const updateItem = (
    salesOrderItemId: string,
    field: keyof ReturnLineItem,
    value: string | number | boolean,
  ) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.salesOrderItemId === salesOrderItemId
          ? { ...li, [field]: value }
          : li,
      ),
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!step2Valid || !selectedOrderId) return;

    setSubmitting(true);
    try {
      const payload = {
        salesOrderId: selectedOrderId,
        items: selectedItems.map((li) => ({
          salesOrderItemId: li.salesOrderItemId,
          quantity: li.quantity,
          reason: li.reason,
          condition: li.condition,
          notes: li.notes || undefined,
        })),
        returnMethod,
        notes: notes || undefined,
      };

      const res = await fetch("/api/portal/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit return request");
      }

      toast({
        title: "Return request submitted",
        description: `Your RMA ${data.rma?.rmaNumber ?? ""} has been created. We will be in touch shortly.`,
      });

      router.push("/portal/returns");
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/portal/returns"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Returns
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Request a Return</h1>
        <p className="text-gray-500 mt-1">
          Submit a return request for a delivered order. Our team will review
          and respond within 1–2 business days.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Select order ─────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select the order to return</CardTitle>
            <CardDescription>
              Only delivered orders are eligible for a return.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ordersLoading && (
              <div className="flex items-center space-x-2 text-gray-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading eligible orders…</span>
              </div>
            )}

            {ordersError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{ordersError}</span>
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No eligible orders found</p>
                <p className="text-sm mt-1">
                  Only delivered orders can be returned.
                </p>
                <Link href="/portal/orders">
                  <Button variant="outline" className="mt-4">
                    View My Orders
                  </Button>
                </Link>
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleOrderSelect(order.id)}
                      className={`w-full text-left border rounded-lg p-4 transition-colors
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.soNumber}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Ordered{" "}
                            {new Date(order.orderDate).toLocaleDateString()} ·
                            Delivered{" "}
                            {order.deliveredDate
                              ? new Date(
                                  order.deliveredDate,
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${Number(order.total).toFixed(2)}
                          </p>
                          <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!step1Valid || itemsLoading}
              >
                {itemsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading items…
                  </>
                ) : (
                  <>
                    Next: Choose Items
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Select items ─────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select items to return</CardTitle>
            <CardDescription>
              Order <strong>{selectedOrder?.soNumber}</strong> — tick each item
              you want to return and provide the reason and condition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {lineItems.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No items found for this order.</p>
              </div>
            )}

            {lineItems.map((li) => (
              <div
                key={li.salesOrderItemId}
                className={`border rounded-lg p-4 transition-colors ${
                  li.selected ? "border-blue-400 bg-blue-50" : "border-gray-200"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={`item-${li.salesOrderItemId}`}
                    checked={li.selected}
                    onCheckedChange={() => toggleItem(li.salesOrderItemId)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`item-${li.salesOrderItemId}`}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900">{li.name}</p>
                    <p className="text-sm text-gray-500">
                      SKU: {li.sku} · Ordered: {li.maxQuantity} · $
                      {Number(li.unitPrice).toFixed(2)} each
                    </p>
                  </label>
                </div>

                {/* Expanded fields when selected */}
                {li.selected && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                    {/* Quantity */}
                    <div className="space-y-1">
                      <Label htmlFor={`qty-${li.salesOrderItemId}`}>
                        Quantity to return
                      </Label>
                      <Input
                        id={`qty-${li.salesOrderItemId}`}
                        type="number"
                        min={1}
                        max={li.maxQuantity}
                        value={li.quantity}
                        onChange={(e) =>
                          updateItem(
                            li.salesOrderItemId,
                            "quantity",
                            Math.min(
                              Math.max(1, parseInt(e.target.value) || 1),
                              li.maxQuantity,
                            ),
                          )
                        }
                      />
                    </div>

                    {/* Condition */}
                    <div className="space-y-1">
                      <Label>Condition</Label>
                      <Select
                        value={li.condition}
                        onValueChange={(v) =>
                          updateItem(
                            li.salesOrderItemId,
                            "condition",
                            v as ReturnLineItem["condition"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor={`reason-${li.salesOrderItemId}`}>
                        Reason for return{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`reason-${li.salesOrderItemId}`}
                        placeholder="e.g. Received wrong item, item damaged on arrival…"
                        value={li.reason}
                        onChange={(e) =>
                          updateItem(
                            li.salesOrderItemId,
                            "reason",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor={`notes-${li.salesOrderItemId}`}>
                        Additional notes{" "}
                        <span className="text-gray-400">(optional)</span>
                      </Label>
                      <Textarea
                        id={`notes-${li.salesOrderItemId}`}
                        placeholder="Any additional information about this item…"
                        value={li.notes}
                        rows={2}
                        onChange={(e) =>
                          updateItem(
                            li.salesOrderItemId,
                            "notes",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Validation hint */}
            {selectedItems.length > 0 && !step2Valid && (
              <p className="text-sm text-amber-600 flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Please provide a reason (at least 3 characters) for each
                  selected item.
                </span>
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!step2Valid}>
                Next: Confirm
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Confirm & submit ─────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm return request</CardTitle>
            <CardDescription>
              Review your return details and choose how you want to send the
              items back.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium text-gray-700">Order</p>
              <p className="text-gray-900 font-semibold">
                {selectedOrder?.soNumber}
              </p>
            </div>

            {/* Items summary */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Items to return
              </p>
              {selectedItems.map((li) => (
                <div
                  key={li.salesOrderItemId}
                  className="flex justify-between items-start border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {li.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {li.sku} · Qty: {li.quantity} · {li.condition}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 italic">
                      "{li.reason}"
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(Number(li.unitPrice) * li.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Return method */}
            <div className="space-y-2">
              <Label>Return method</Label>
              <div className="space-y-2">
                {RETURN_METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReturnMethod(opt.value)}
                    className={`w-full text-left border rounded-lg p-3 transition-colors
                      ${
                        returnMethod === opt.value
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Global notes */}
            <div className="space-y-1">
              <Label htmlFor="notes">
                Additional notes{" "}
                <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for our team…"
                value={notes}
                rows={3}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Refund estimate */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Estimated refund:</strong> $
                {selectedItems
                  .reduce(
                    (sum, li) => sum + Number(li.unitPrice) * li.quantity,
                    0,
                  )
                  .toFixed(2)}{" "}
                — subject to inspection and approval.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Return Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
