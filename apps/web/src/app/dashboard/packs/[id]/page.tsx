"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import {
  Package,
  Plus,
  Weight,
  Ruler,
  Box,
  CheckCircle2,
  Barcode,
  MapPin,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface PackItem {
  id: string;
  name: string;
  sku: string;
  quantityPicked: number;
  quantityPacked: number;
  remaining: number;
}

interface Pack {
  id: string;
  packNumber: string;
  status: string;
  totalPackages: number;
  totalWeight?: number;
  weightUnit?: string;
  salesOrder: {
    id: string;
    soNumber: string;
    customer: {
      id: string;
      name: string;
    };
    items: any[];
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  packages: any[];
  statistics: {
    totalItemsToPack: number;
    totalItemsPacked: number;
    progressPercent: number;
    totalWeight?: number;
    weightUnit?: string;
  };
}

interface PackageItem {
  salesOrderItemId: string;
  inventoryItemId: string;
  quantity: number;
  binLocation?: string;
  batchNumber?: string;
}

interface PackageForm {
  packageType: string;
  weight?: number;
  items: PackageItem[];
}

export default function PackingStationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState<PackageForm>({
    packageType: "Box",
    items: [],
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPack();
  }, [params.id]);

  const fetchPack = async () => {
    try {
      const response = await fetch(`/api/packs/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch pack");

      const data = await response.json();
      setPack(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pack details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableItems = (): PackItem[] => {
    if (!pack) return [];

    return pack.salesOrder.items
      .map((item: any) => ({
        id: item.id,
        name: item.inventoryItem.name,
        sku: item.inventoryItem.sku,
        quantityPicked: item.quantityPicked,
        quantityPacked: item.quantityPacked,
        remaining: item.quantityPicked - item.quantityPacked,
      }))
      .filter((item: PackItem) => item.remaining > 0);
  };

  const addItemToPackage = (itemId: string) => {
    const item = pack?.salesOrder.items.find((i: any) => i.id === itemId);
    if (!item) return;

    const remaining = item.quantityPicked - item.quantityPacked;

    setPackageForm({
      ...packageForm,
      items: [
        ...packageForm.items,
        {
          salesOrderItemId: itemId,
          inventoryItemId: item.inventoryItemId,
          quantity: remaining,
          binLocation: item.binLocation,
          batchNumber: item.batchNumber,
        },
      ],
    });
  };

  const removeItemFromPackage = (index: number) => {
    setPackageForm({
      ...packageForm,
      items: packageForm.items.filter((_, i) => i !== index),
    });
  };

  const updatePackageItem = (index: number, field: string, value: any) => {
    const updatedItems = [...packageForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    } as PackageItem;
    setPackageForm({
      ...packageForm,
      items: updatedItems,
    });
  };

  const submitPackage = async () => {
    if (packageForm.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the package",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: params.id,
          packageType: packageForm.packageType,
          weight: packageForm.weight,
          weightUnit: "kg",
          items: packageForm.items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create package");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: data.allItemsPacked
          ? "Package created! All items packed - pack complete."
          : "Package created successfully",
      });

      setShowPackageForm(false);
      setPackageForm({ packageType: "Box", items: [] });
      fetchPack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-gray-500",
      IN_PROGRESS: "bg-blue-500",
      PACKED: "bg-green-500",
      CANCELLED: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pack details...</p>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">Pack not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableItems = getAvailableItems();

  return (
    <DashboardSidebar>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {pack.packNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Sales Order: {pack.salesOrder.soNumber} -{" "}
            {pack.salesOrder.customer.name}
          </p>
        </div>
        <div className="flex gap-2">
          {pack.status !== "PACKED" &&
            pack.status !== "CANCELLED" &&
            availableItems.length > 0 && (
              <Button onClick={() => setShowPackageForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
            <Box className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(pack.status)}>{pack.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progress
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pack.statistics.progressPercent}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pack.statistics.totalItemsPacked} /{" "}
              {pack.statistics.totalItemsToPack} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Packages
            </CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pack.packages.length}</div>
            <p className="text-xs text-gray-500 mt-1">Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Weight
            </CardTitle>
            <Weight className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pack.totalWeight?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pack.weightUnit || "kg"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items to Pack */}
      {availableItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items Remaining to Pack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Picked</TableHead>
                    <TableHead className="text-center">Packed</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.sku}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">
                        {item.quantityPicked}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantityPacked}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">
                        {item.remaining}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Packages ({pack.packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pack.packages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No packages created yet
            </div>
          ) : (
            <div className="space-y-4">
              {pack.packages.map((pkg: any) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Package #{pkg.packageNumber}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {pkg.packageType && (
                          <span className="flex items-center">
                            <Box className="w-4 h-4 mr-1" />
                            {pkg.packageType}
                          </span>
                        )}
                        {pkg.weight && (
                          <span className="flex items-center">
                            <Weight className="w-4 h-4 mr-1" />
                            {pkg.weight} {pkg.weightUnit}
                          </span>
                        )}
                        {pkg.trackingNumber && (
                          <span className="flex items-center">
                            <Barcode className="w-4 h-4 mr-1" />
                            {pkg.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">
                            Quantity
                          </TableHead>
                          <TableHead>Bin Location</TableHead>
                          <TableHead>Batch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pkg.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.inventoryItem.name}
                              <div className="text-sm text-gray-500">
                                SKU: {item.inventoryItem.sku}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              {item.binLocation ? (
                                <div className="flex items-center text-sm">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                  {item.binLocation}
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.batchNumber || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Package Dialog/Form */}
      {showPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Package Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packageType">Package Type</Label>
                  <Select
                    value={packageForm.packageType}
                    onValueChange={(value) =>
                      setPackageForm({ ...packageForm, packageType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Box">Box</SelectItem>
                      <SelectItem value="Pallet">Pallet</SelectItem>
                      <SelectItem value="Envelope">Envelope</SelectItem>
                      <SelectItem value="Crate">Crate</SelectItem>
                      <SelectItem value="Bag">Bag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-400" />
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={packageForm.weight || ""}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          weight: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Add Items */}
              <div>
                <Label>Add Items to Package</Label>
                <Select onValueChange={addItemToPackage} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select item to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.sku}) - {item.remaining} remaining
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items in Package */}
              {packageForm.items.length > 0 && (
                <div>
                  <Label>Items in Package</Label>
                  <div className="mt-2 space-y-2">
                    {packageForm.items.map((item, index) => {
                      const soItem = pack.salesOrder.items.find(
                        (i: any) => i.id === item.salesOrderItemId,
                      );
                      const maxQty = soItem
                        ? soItem.quantityPicked - soItem.quantityPacked
                        : 0;

                      return (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">
                                {soItem?.inventoryItem.name} (
                                {soItem?.inventoryItem.sku})
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeItemFromPackage(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor={`qty-${index}`}>Quantity</Label>
                                <Input
                                  id={`qty-${index}`}
                                  type="number"
                                  min="1"
                                  max={maxQty}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updatePackageItem(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor={`bin-${index}`}>
                                  Bin Location
                                </Label>
                                <Input
                                  id={`bin-${index}`}
                                  value={item.binLocation || ""}
                                  onChange={(e) =>
                                    updatePackageItem(
                                      index,
                                      "binLocation",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor={`batch-${index}`}>
                                  Batch Number
                                </Label>
                                <Input
                                  id={`batch-${index}`}
                                  value={item.batchNumber || ""}
                                  onChange={(e) =>
                                    updatePackageItem(
                                      index,
                                      "batchNumber",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPackageForm(false);
                    setPackageForm({ packageType: "Box", items: [] });
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button onClick={submitPackage} disabled={processing}>
                  {processing ? "Creating..." : "Create Package"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </DashboardSidebar>
  );
}
