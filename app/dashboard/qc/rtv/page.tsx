"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  RefreshCw,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface RTV {
  id: string;
  rtvNumber: string;
  supplier: { name: string; email: string };
  defect: {
    item: { productName: string; sku: string };
    defectType: string;
  };
  quantity: number;
  value: number;
  status: string;
  priority: string;
  createdAt: string;
  vendorRmaNumber?: string;
  trackingNumber?: string;
}

export default function RTVManagementPage() {
  const [loading, setLoading] = useState(true);
  const [rtvs, setRtvs] = useState<RTV[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const organizationId = "org_123";

  useEffect(() => {
    fetchRTVs();
  }, [filterStatus]);

  const fetchRTVs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ organizationId });
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      const response = await fetch(`/api/qc/rtv?${params}`);
      const data = await response.json();
      setRtvs(data.rtvs || []);
    } catch (error) {
      console.error("Error fetching RTVs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      PENDING: { color: "bg-gray-500", text: "Pending" },
      VENDOR_NOTIFIED: { color: "bg-blue-500", text: "Vendor Notified" },
      APPROVED: { color: "bg-green-500", text: "Approved" },
      REJECTED: { color: "bg-red-500", text: "Rejected" },
      SHIPPED: { color: "bg-purple-500", text: "Shipped" },
      CREDITED: { color: "bg-teal-500", text: "Credited" },
      CLOSED: { color: "bg-gray-400", text: "Closed" },
    };

    const { color, text } = config[status] || config.PENDING;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { color: string; text: string }> = {
      URGENT: { color: "bg-red-500", text: "Urgent" },
      HIGH: { color: "bg-orange-500", text: "High" },
      MEDIUM: { color: "bg-yellow-500", text: "Medium" },
      LOW: { color: "bg-green-500", text: "Low" },
    };

    const { color, text } = config[priority] || config.MEDIUM;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Return to Vendor (RTV)
          </h1>
          <p className="text-muted-foreground">
            Manage defective product returns to suppliers
          </p>
        </div>
        <Button onClick={fetchRTVs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {rtvs.filter((r) => r.status === "PENDING").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500">
              {rtvs.filter((r) => r.status === "SHIPPED").length}
            </div>
            <div className="text-sm text-muted-foreground">Shipped</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {rtvs.filter((r) => r.status === "CREDITED").length}
            </div>
            <div className="text-sm text-muted-foreground">Credited</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              $
              {rtvs
                .reduce((sum, r) => sum + parseFloat(r.value.toString()), 0)
                .toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {["ALL", "PENDING", "APPROVED", "SHIPPED", "CREDITED"].map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* RTV List */}
      <Card>
        <CardHeader>
          <CardTitle>RTVs ({rtvs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rtvs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>No RTVs found</p>
              </div>
            ) : (
              rtvs.map((rtv) => (
                <div
                  key={rtv.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <Package className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-bold">{rtv.rtvNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {rtv.supplier.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rtv.defect.item.productName} ({rtv.defect.item.sku})
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {rtv.defect.defectType} Defect
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${rtv.value.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {rtv.quantity}
                      </div>
                      {rtv.trackingNumber && (
                        <div className="text-xs text-blue-600 mt-1">
                          Tracking: {rtv.trackingNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(rtv.status)}
                      {getPriorityBadge(rtv.priority)}
                    </div>
                    <Link href={`/dashboard/qc/rtv/${rtv.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
