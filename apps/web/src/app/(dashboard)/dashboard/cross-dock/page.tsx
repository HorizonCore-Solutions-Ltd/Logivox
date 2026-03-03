"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Truck,
  Package,
  ArrowRightLeft,
  Clock,
  LayoutGrid
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface CrossDockItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  inboundReference: string; // PO or ASN
  inboundCarrier: string;
  outboundReference: string; // SO
  outboundCustomer: string;
  status: "PENDING" | "STAGING" | "COMPLETED";
  eta: string;
}

export default function CrossDockPage() {
  const [items, setItems] = useState<CrossDockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch from API
      const res = await fetch("/api/cross-dock");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load cross-dock items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "PENDING").length,
    staging: items.filter((i) => i.status === "STAGING").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cross Docking</h1>
          <p className="text-muted-foreground mt-1">
            Direct flow from Inbound Receiving to Outbound Shipping.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchItems}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Inbound</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                    <LayoutGrid className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{stats.staging}</p>
                    <p className="text-sm text-muted-foreground">At Staging</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <ArrowRightLeft className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Opportunities</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cross Dock Opportunities</CardTitle>
          <CardDescription>
            Matches between pending Inbound (PO/ASN) and Outbound (SO) orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search SKU, PO, or SO..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU / Item</TableHead>
                            <TableHead>Inbound (Source)</TableHead>
                            <TableHead>Outbound (Dest)</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ETA</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No cross-dock opportunities found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-xs">{item.inboundReference}</Badge>
                                            <span className="text-xs text-muted-foreground">{item.inboundCarrier}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-xs">{item.outboundReference}</Badge>
                                            <span className="text-xs text-muted-foreground">{item.outboundCustomer}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold">{item.quantity}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === 'PENDING' ? 'secondary' : item.status === 'STAGING' ? 'default' : 'outline'}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-muted-foreground">
                                        {new Date(item.eta).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost">Manage <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
