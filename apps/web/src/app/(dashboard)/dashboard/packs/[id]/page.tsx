"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import {
  ArrowLeft,
  Box,
  Truck,
  Loader2,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Pack {
  id: string;
  packNumber: string;
  status: string;
  totalPackages: number;
  weight: number;
  weightUnit: string;
  salesOrder: { soNumber: string; customer: { name: string; email: string } };
  warehouse: { name: string };
  packages: Array<{
    id: string;
    packageNumber: string;
    weight: number;
    trackingNumber: string;
    items: Array<{
      id: string;
      inventoryItem: { name: string; sku: string };
      quantity: number;
    }>;
  }>;
}

export default function PackDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    fetchPack();
  }, [params.id]);

  const fetchPack = async () => {
    try {
      const res = await fetch(`/api/packs/${params.id}`);
      if (!res.ok) throw new Error("Failed to load pack");
      const data = await res.json();
      setPack(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load pack details.", variant: "destructive" });
      router.push("/dashboard/packs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    setShipping(true);
    try {
      const res = await fetch(`/api/packs/${params.id}/shipment`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create shipment");

      toast({ title: "Shipment Created", description: `Shipment #${data.shipment.shipmentNumber} created.` });
      router.push(`/dashboard/shipments/${data.shipment.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setShipping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pack) return null;

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{pack.packNumber}</h1>
              <Badge variant="outline">{pack.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="font-medium">Order: {pack.salesOrder.soNumber}</span>
              <span>•</span>
              <span>{pack.salesOrder.customer.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
          {pack.status !== "SHIPPED" && (
            <Button onClick={handleCreateShipment} disabled={shipping}>
                {shipping && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Truck className="mr-2 h-4 w-4" /> Create Shipment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {pack.packages.map((pkg) => (
            <Card key={pkg.id}>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex justify-between">
                        <span>Package: {pkg.packageNumber}</span>
                        <span className="text-muted-foreground font-normal text-sm">{pkg.items.length} Items</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pkg.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.inventoryItem.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.inventoryItem.sku}</div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
         ))}
      </div>
    </div>
  );
}
