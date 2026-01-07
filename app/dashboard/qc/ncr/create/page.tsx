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
import { PhotoUpload } from "@/components/qc/PhotoUpload";
import { BarcodeScanner } from "@/components/qc/BarcodeScanner";

export default function CreateNCRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "MATERIAL_DEFECT",
    severity: "MAJOR",
    productId: "",
    lotNumber: "",
    supplierId: "",
    quantity: "",
    description: "",
    rootCause: "",
    immediateAction: "",
    disposition: "PENDING",
    photos: [] as string[],
    detectedBy: "",
    detectedAt: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/ncr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
          detectedAt: new Date(formData.detectedAt),
        }),
      });

      if (!response.ok) throw new Error("Failed to create NCR");

      const data = await response.json();
      router.push(`/dashboard/qc/ncr/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create NCR");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (code: string) => {
    // Look up product by barcode
    try {
      const response = await fetch(`/api/products?barcode=${code}`);
      const data = await response.json();
      if (data.product) {
        setFormData({ ...formData, productId: data.product.id });
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Non-Conformance Report</h1>
          <p className="text-muted-foreground">
            Document quality issues and track resolution
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core details about the non-conformance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATERIAL_DEFECT">
                        Material Defect
                      </SelectItem>
                      <SelectItem value="PACKAGING">Packaging Issue</SelectItem>
                      <SelectItem value="LABELING">Labeling Error</SelectItem>
                      <SelectItem value="DOCUMENTATION">
                        Documentation
                      </SelectItem>
                      <SelectItem value="PROCESS">Process Deviation</SelectItem>
                      <SelectItem value="SHIPPING">Shipping Damage</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) =>
                      setFormData({ ...formData, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="MAJOR">Major</SelectItem>
                      <SelectItem value="MINOR">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detectedAt">Detected Date *</Label>
                  <Input
                    id="detectedAt"
                    type="date"
                    required
                    value={formData.detectedAt}
                    onChange={(e) =>
                      setFormData({ ...formData, detectedAt: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Product and lot details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarcodeScanner
                label="Scan Product Barcode"
                onScan={handleBarcodeScanned}
                placeholder="Scan or enter product barcode"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product ID</Label>
                  <Input
                    id="productId"
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier ID</Label>
                  <Input
                    id="supplierId"
                    value={formData.supplierId}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierId: e.target.value })
                    }
                    placeholder="Supplier identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Affected Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Number of units affected"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Description & Analysis</CardTitle>
              <CardDescription>
                Detailed information about the issue
              </CardDescription>
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
                  placeholder="Detailed description of the non-conformance..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rootCause">Root Cause Analysis</Label>
                <Textarea
                  id="rootCause"
                  rows={3}
                  value={formData.rootCause}
                  onChange={(e) =>
                    setFormData({ ...formData, rootCause: e.target.value })
                  }
                  placeholder="Root cause findings (use 5 Whys method)..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="immediateAction">Immediate Action Taken</Label>
                <Textarea
                  id="immediateAction"
                  rows={3}
                  value={formData.immediateAction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      immediateAction: e.target.value,
                    })
                  }
                  placeholder="Actions taken immediately to contain the issue..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Photos</CardTitle>
              <CardDescription>
                Upload photos of the non-conformance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                value={formData.photos}
                onChange={(photos) => setFormData({ ...formData, photos })}
                maxPhotos={10}
                label="Photos"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create NCR"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
