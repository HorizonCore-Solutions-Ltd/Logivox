"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  MapPin,
} from "lucide-react";

interface QualityHold {
  id: string;
  holdNumber: string;
  holdType: string;
  status: string;
  severity: string;
  reason: string;
  quantityOnHold: number;
  quantityReleased: number;
  quantityRejected: number;
  estimatedValue: number;
  dispositionDecision?: string;
  dispositionNotes?: string;
  releasedAt?: string;
  releasedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  lot?: {
    id: string;
    lotNumber: string;
  };
  location?: {
    id: string;
    name: string;
    zone: string;
  };
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
  inspection?: {
    id: string;
    inspectionNumber: string;
  };
  ncr?: {
    id: string;
    ncrNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

const holdTypeColors: Record<string, string> = {
  PRODUCT: "bg-red-100 text-red-800",
  LOT: "bg-orange-100 text-orange-800",
  LOCATION: "bg-yellow-100 text-yellow-800",
  VENDOR: "bg-blue-100 text-blue-800",
  ORDER: "bg-purple-100 text-purple-800",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-red-100 text-red-800",
  RELEASED: "bg-green-100 text-green-800",
  REJECTED: "bg-gray-100 text-gray-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
};

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-green-500 text-white",
};

export default function QualityHoldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hold, setHold] = useState<QualityHold | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHold();
  }, [params.id]);

  const fetchHold = async () => {
    try {
      const response = await fetch(`/api/qc/quality-holds/${params.id}`);
      const data = await response.json();
      setHold(data);
    } catch (error) {
      console.error("Error fetching quality hold:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quality hold?")) return;

    try {
      await fetch(`/api/qc/quality-holds/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/quality-holds");
    } catch (error) {
      console.error("Error deleting quality hold:", error);
    }
  };

  const getRemainingQuantity = () => {
    if (!hold) return 0;
    return hold.quantityOnHold - hold.quantityReleased - hold.quantityRejected;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading quality hold details...
          </p>
        </div>
      </div>
    );
  }

  if (!hold) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">Quality hold not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/qc/quality-holds")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{hold.holdNumber}</h1>
            <p className="text-muted-foreground">Quality Hold Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/qc/quality-holds/${params.id}/edit`)
            }
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={statusColors[hold.status] || "bg-gray-100"}>
          {hold.status}
        </Badge>
        <Badge className={holdTypeColors[hold.holdType] || "bg-gray-100"}>
          {hold.holdType} Hold
        </Badge>
        <Badge className={severityColors[hold.severity] || "bg-gray-500"}>
          {hold.severity} Severity
        </Badge>
      </div>

      {/* Quantity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {hold.quantityOnHold}
            </div>
            <p className="text-xs text-muted-foreground">Total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {hold.quantityReleased}
            </div>
            <p className="text-xs text-muted-foreground">Units approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {hold.quantityRejected}
            </div>
            <p className="text-xs text-muted-foreground">Units rejected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getRemainingQuantity()}
            </div>
            <p className="text-xs text-muted-foreground">Units pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Hold Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{hold.reason}</p>
            </CardContent>
          </Card>

          {/* Financial Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Estimated Value
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    ${hold.estimatedValue.toFixed(2)}
                  </span>
                </div>
                {hold.quantityReleased > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Released Value
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      $
                      {(
                        (hold.quantityReleased / hold.quantityOnHold) *
                        hold.estimatedValue
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {hold.quantityRejected > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Rejected Value
                    </span>
                    <span className="text-lg font-semibold text-gray-600">
                      $
                      {(
                        (hold.quantityRejected / hold.quantityOnHold) *
                        hold.estimatedValue
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disposition */}
          {(hold.dispositionDecision || hold.dispositionNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Disposition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hold.dispositionDecision && (
                  <div>
                    <p className="text-sm font-medium mb-1">Decision</p>
                    <Badge variant="outline" className="text-sm">
                      {hold.dispositionDecision.replace("_", " ")}
                    </Badge>
                  </div>
                )}
                {hold.dispositionNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {hold.dispositionNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Release/Rejection History */}
          {(hold.releasedAt || hold.rejectedAt) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Action History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hold.releasedAt && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        Released
                      </p>
                      <p className="text-xs text-green-700">
                        {new Date(hold.releasedAt).toLocaleString()}
                      </p>
                      {hold.releasedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          By: {hold.releasedBy}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {hold.quantityReleased} units
                    </Badge>
                  </div>
                )}
                {hold.rejectedAt && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Rejected
                      </p>
                      <p className="text-xs text-gray-700">
                        {new Date(hold.rejectedAt).toLocaleString()}
                      </p>
                      {hold.rejectedBy && (
                        <p className="text-xs text-gray-600 mt-1">
                          By: {hold.rejectedBy}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-gray-600 text-white">
                      {hold.quantityRejected} units
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Related Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hold.product && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="text-sm font-medium">{hold.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {hold.product.sku}
                  </p>
                </div>
              )}
              {hold.lot && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lot</p>
                  <p className="text-sm font-medium">{hold.lot.lotNumber}</p>
                </div>
              )}
              {hold.location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {hold.location.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hold.location.zone}
                  </p>
                </div>
              )}
              {hold.supplier && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Supplier</p>
                  <p className="text-sm font-medium">{hold.supplier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {hold.supplier.code}
                  </p>
                </div>
              )}
              {hold.order && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() =>
                      router.push(`/dashboard/orders/${hold.order?.id}`)
                    }
                  >
                    {hold.order.orderNumber}
                  </Button>
                </div>
              )}
              {hold.inspection && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Inspection
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/qc/inspections/${hold.inspection?.id}`,
                      )
                    }
                  >
                    {hold.inspection.inspectionNumber}
                  </Button>
                </div>
              )}
              {hold.ncr && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Related NCR
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() =>
                      router.push(`/dashboard/qc/ncr/${hold.ncr?.id}`)
                    }
                  >
                    {hold.ncr.ncrNumber}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(hold.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(hold.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {hold.status === "ACTIVE" && getRemainingQuantity() > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => {
                    /* Release hold */
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Release Hold
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    /* Reject hold */
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Items
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(`/dashboard/qc/ncr/create?holdId=${hold.id}`)
                  }
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Create NCR
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
