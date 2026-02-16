"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  sku: string;
  description: string;
  quantity: number;
  minStockLevel: number;
  warehouseId: string;
  categoryId: string;
  barcode: string;
}

export default function CreateInventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    sku: "",
    description: "",
    quantity: 0,
    minStockLevel: 0,
    warehouseId: "",
    categoryId: "",
    barcode: "",
  });

  // Mock data - in production these would come from API
  const warehouses = [
    { id: "wh_1", name: "Main Warehouse", code: "MW001" },
    { id: "wh_2", name: "East Warehouse", code: "EW001" },
    { id: "wh_3", name: "West Distribution Center", code: "WDC001" },
  ];

  const categories = [
    { id: "cat_1", name: "Safety Equipment" },
    { id: "cat_2", name: "Medical Supplies" },
    { id: "cat_3", name: "Tools & Equipment" },
    { id: "cat_4", name: "Office Supplies" },
  ];

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Item name is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.sku.trim()) {
        toast({
          title: "Validation Error",
          description: "SKU is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.warehouseId) {
        toast({
          title: "Validation Error",
          description: "Warehouse is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.categoryId) {
        toast({
          title: "Validation Error",
          description: "Category is required",
          variant: "destructive",
        });
        return;
      }

      // Mock API call - in production this would call the actual API
      const response = await new Promise((resolve) =>
        setTimeout(() => resolve({ ok: true }), 1500),
      );

      toast({
        title: "Success!",
        description: "Inventory item created successfully",
      });

      // Redirect back to inventory list
      router.push("/dashboard/inventory");
    } catch (error) {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to create inventory item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Create Inventory Item
          </h2>
          <p className="text-muted-foreground">
            Add a new item to your inventory
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
              <CardDescription>
                Enter the basic information for the inventory item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Industrial Safety Helmet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        handleChange("sku", e.target.value.toUpperCase())
                      }
                      placeholder="e.g., HELM-001"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Enter item description..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse *</Label>
                    <Select
                      value={formData.warehouseId}
                      onValueChange={(value) =>
                        handleChange("warehouseId", value)
                      }
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        handleChange("categoryId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Initial Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleChange("quantity", parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock Level</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) =>
                        handleChange(
                          "minStockLevel",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => handleChange("barcode", e.target.value)}
                      placeholder="Scan or enter barcode"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>SKU:</strong> Use a unique identifier for each item.
                Consider including category and size codes.
              </div>
              <div>
                <strong>Min Stock:</strong> Set appropriate reorder levels to
                avoid stockouts.
              </div>
              <div>
                <strong>Barcode:</strong> Add barcodes for faster scanning and
                inventory management.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Set up reorder points</div>
              <div>• Configure automatic reordering</div>
              <div>• Add supplier information</div>
              <div>• Set up location mapping</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
