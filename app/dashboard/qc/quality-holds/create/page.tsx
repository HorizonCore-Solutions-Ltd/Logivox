"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function CreateQualityHoldPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "LOT",
    reason: "FAILED_INSPECTION",
    productId: "",
    lotNumber: "",
    locationId: "",
    vendorId: "",
    orderId: "",
    quantity: "",
    estimatedValue: "",
    description: "",
    initiatedBy: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/quality-holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
          estimatedValue: parseFloat(formData.estimatedValue) || 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to create quality hold");

      const data = await response.json();
      router.push(`/dashboard/qc/quality-holds/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create quality hold");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Quality Hold</h1>
          <p className="text-muted-foreground">
            Place inventory on hold for quality review
          </p>
        </div>
      </div>

      <Alert className="border-orange-500 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-600">
          This action will immediately quarantine the specified inventory and
          block all movements
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hold Type & Reason</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Hold Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">
                        Product (All lots)
                      </SelectItem>
                      <SelectItem value="LOT">Specific Lot</SelectItem>
                      <SelectItem value="LOCATION">Location Hold</SelectItem>
                      <SelectItem value="VENDOR">Vendor Hold</SelectItem>
                      <SelectItem value="ORDER">Order Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) =>
                      setFormData({ ...formData, reason: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAILED_INSPECTION">
                        Failed Inspection
                      </SelectItem>
                      <SelectItem value="CUSTOMER_COMPLAINT">
                        Customer Complaint
                      </SelectItem>
                      <SelectItem value="SUPPLIER_ISSUE">
                        Supplier Issue
                      </SelectItem>
                      <SelectItem value="REGULATORY">
                        Regulatory Hold
                      </SelectItem>
                      <SelectItem value="INVESTIGATION">
                        Under Investigation
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affected Items</CardTitle>
              <CardDescription>
                Specify what inventory is being placed on hold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.type === "PRODUCT" && (
                <div className="space-y-2">
                  <Label htmlFor="productId">Product ID *</Label>
                  <Input
                    id="productId"
                    required
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                    placeholder="Product identifier"
                  />
                </div>
              )}

              {formData.type === "LOT" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product ID *</Label>
                    <Input
                      id="productId"
                      required
                      value={formData.productId}
                      onChange={(e) =>
                        setFormData({ ...formData, productId: e.target.value })
                      }
                      placeholder="Product identifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lotNumber">Lot Number *</Label>
                    <Input
                      id="lotNumber"
                      required
                      value={formData.lotNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, lotNumber: e.target.value })
                      }
                      placeholder="Lot/batch number"
                    />
                  </div>
                </div>
              )}

              {formData.type === "LOCATION" && (
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location ID *</Label>
                  <Input
                    id="locationId"
                    required
                    value={formData.locationId}
                    onChange={(e) =>
                      setFormData({ ...formData, locationId: e.target.value })
                    }
                    placeholder="Warehouse location"
                  />
                </div>
              )}

              {formData.type === "VENDOR" && (
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor ID *</Label>
                  <Input
                    id="vendorId"
                    required
                    value={formData.vendorId}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorId: e.target.value })
                    }
                    placeholder="Vendor/supplier identifier"
                  />
                </div>
              )}

              {formData.type === "ORDER" && (
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID *</Label>
                  <Input
                    id="orderId"
                    required
                    value={formData.orderId}
                    onChange={(e) =>
                      setFormData({ ...formData, orderId: e.target.value })
                    }
                    placeholder="Purchase order number"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Affected *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Number of units"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    step="0.01"
                    value={formData.estimatedValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedValue: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hold Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed description of the quality issue requiring this hold..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initiatedBy">Initiated By *</Label>
                <Input
                  id="initiatedBy"
                  required
                  value={formData.initiatedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, initiatedBy: e.target.value })
                  }
                  placeholder="Your name"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              {loading ? "Creating Hold..." : "Place on Hold"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
