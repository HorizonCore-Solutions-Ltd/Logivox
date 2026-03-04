"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export default function NewRMAPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {},
  );
  const [returnReason, setReturnReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleSearchOrder = async () => {
    if (!orderNumber) return;
    setLoading(true);
    try {
      // In a real scenario, this would call an API to find the order
      // For now, we simulate finding an order
      // const res = await fetch(`/api/orders?search=${orderNumber}`);
      // if (!res.ok) throw new Error("Order not found");
      // const data = await res.json();

      // Mock data for turnkey demo
      setTimeout(() => {
        setOrderItems([
          {
            id: "item-1",
            productName: "Wireless Headset",
            sku: "WH-001",
            quantity: 2,
            unitPrice: 150.0,
          },
          {
            id: "item-2",
            productName: "Ergonomic Mouse",
            sku: "EM-002",
            quantity: 1,
            unitPrice: 45.0,
          },
        ]);
        setStep(2);
        setLoading(false);
      }, 800);
    } catch (error) {
      toast({
        title: "Order not found",
        description: "Could not find an order with that number.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        itemId,
        quantity: qty,
      }));

    if (itemsToReturn.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to return.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/rmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          items: itemsToReturn,
          reason: returnReason,
          notes,
          type: "CUSTOMER_RETURN",
        }),
      });

      if (!res.ok) throw new Error("Failed to create RMA");

      toast({
        title: "RMA Created",
        description:
          "Return Merchandise Authorization has been created successfully.",
      });

      router.push("/dashboard/returns");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create RMA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Return (RMA)
          </h1>
          <p className="text-muted-foreground mt-1">
            Process a customer return request.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Find Order */}
        <Card className={step === 1 ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle>1. Find Order</CardTitle>
            <CardDescription>
              Enter the original Sales Order number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order # (e.g. SO-2024-001)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  disabled={step > 1}
                  className="pl-9"
                />
              </div>
              {step === 1 && (
                <Button
                  onClick={handleSearchOrder}
                  disabled={loading || !orderNumber}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Find Order
                </Button>
              )}
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setOrderItems([]);
                    setSelectedItems({});
                  }}
                >
                  Change
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Items */}
        {step >= 2 && (
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>2. Select Items to Return</CardTitle>
                <CardDescription>
                  Specify quantities for each item being returned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg divide-y">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku} • Sold: ${item.unitPrice}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Qty Purchased: {item.quantity}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          className="w-20"
                          placeholder="0"
                          value={selectedItems[item.id] || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val <= item.quantity) {
                              setSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: val,
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Reason for Return</Label>
                    <Select
                      value={returnReason}
                      onValueChange={setReturnReason}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAMAGED">
                          Damaged in Shipping
                        </SelectItem>
                        <SelectItem value="DEFECTIVE">
                          Defective / Not Working
                        </SelectItem>
                        <SelectItem value="WRONG_ITEM">
                          Received Wrong Item
                        </SelectItem>
                        <SelectItem value="CHANGED_MIND">
                          Customer Changed Mind
                        </SelectItem>
                        <SelectItem value="SIZE_FIT">
                          Size / Fit Issue
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Condition details, customer comments..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !returnReason}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create RMA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
