"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  Printer,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  binLocation?: string;
}

interface PickListItem {
  id: string;
  inventoryItemId: string;
  quantityToPick: number;
  quantityPicked: number;
  status: string;
  inventoryItem: InventoryItem;
}

interface PickList {
  id: string;
  pickListNumber: string;
  status: string;
  salesOrder: { soNumber: string; customer: { name: string } };
  items: PickListItem[];
  warehouse: { name: string };
  assignedTo?: { name: string };
  createdAt: string;
}

export default function PickListDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pickList, setPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickingMap, setPickingMap] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchPickList();
  }, [params.id]);

  const fetchPickList = async () => {
    try {
      const res = await fetch(`/api/pick-lists/${params.id}`);
      if (!res.ok) throw new Error("Failed to load pick list");
      const data = await res.json();
      setPickList(data);

      // Initialize picking map with current progress
      const initialMap: Record<string, number> = {};
      data.items.forEach((item: PickListItem) => {
        initialMap[item.id] = item.quantityPicked;
      });
      setPickingMap(initialMap);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load pick list details.",
        variant: "destructive",
      });
      router.push("/dashboard/pick-lists");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPicking = async () => {
    try {
      const res = await fetch(`/api/pick-lists/${params.id}/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start picking");
      toast({ title: "Started", description: "Pick list is now in progress." });
      fetchPickList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start picking.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePack = async () => {
    try {
      const res = await fetch(`/api/pick-lists/${params.id}/pack`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create pack");

      if (data.message === "Pack already exists") {
        toast({
          title: "Pack Exists",
          description: "Pack already created for this pick list.",
        });
      } else {
        toast({
          title: "Pack Created",
          description: `Pack #${data.pack.packNumber} created.`,
        });
      }
      router.push("/dashboard/packs");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmPick = async (itemId: string) => {
    const qty = pickingMap[itemId];
    if (qty === undefined || qty < 0) return;

    setSubmitting(itemId);
    try {
      const res = await fetch(`/api/pick-lists/${params.id}/pick-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickListItemId: itemId,
          quantityPicked: qty,
        }),
      });

      if (!res.ok) throw new Error("Failed to update item");

      const data = await res.json();

      if (data.pickListCompleted) {
        toast({
          title: "Picking Complete!",
          description: "All items have been picked.",
        });
        // Refresh to show completed state
        fetchPickList();
      } else {
        toast({ title: "Item Updated", description: "Quantity recorded." });
        // Update local state without full reload if possible, but strict consistency is better
        fetchPickList();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm picking.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pickList) return null;

  const isCompleted = pickList.status === "COMPLETED";

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {pickList.pickListNumber}
              </h1>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {pickList.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="font-medium">
                Order: {pickList.salesOrder.soNumber}
              </span>
              <span>•</span>
              <span>{pickList.salesOrder.customer.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Ticket
          </Button>
          {pickList.status === "PENDING" && (
            <Button onClick={handleStartPicking}>Start Picking</Button>
          )}
          {pickList.status === "COMPLETED" && (
            <Button onClick={handleCreatePack}>
              <Package className="mr-2 h-4 w-4" /> Create Pack
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Warehouse Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{pickList.warehouse.name}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned To
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {pickList.assignedTo?.name || "Unassigned"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {new Date(pickList.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pick Items</CardTitle>
          <CardDescription>
            Verify item locations and quantities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>SKU / Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Picked</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pickList.items.map((item) => {
                const isFullyPicked =
                  item.quantityPicked >= item.quantityToPick;
                const currentVal = pickingMap[item.id] ?? 0;

                return (
                  <TableRow
                    key={item.id}
                    className={isFullyPicked ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-mono font-medium">
                      {item.inventoryItem.binLocation || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {item.inventoryItem.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.inventoryItem.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantityToPick}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Input
                          type="number"
                          className="w-20 text-right h-8"
                          min={0}
                          disabled={isCompleted} // Allow modifying even if fully picked, unless PickList is done
                          value={currentVal}
                          onChange={(e) =>
                            setPickingMap((prev) => ({
                              ...prev,
                              [item.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant={isFullyPicked ? "outline" : "default"}
                          onClick={() => handleConfirmPick(item.id)}
                          disabled={submitting === item.id}
                        >
                          {submitting === item.id && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          {isFullyPicked ? "Update" : "Confirm"}
                        </Button>
                      )}
                      {isCompleted && (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="mr-2 h-4 w-4" /> Done
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
