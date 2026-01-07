"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";

interface NCR {
  id: string;
  ncrNumber: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  detectedAt: string;
  detectedBy: string;
  affectedQuantity: number;
  costImpact: number;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dispositionMethod?: string;
  closedAt?: string;
  closedBy?: string;
  supplierClaimAmount?: number;
  supplierClaimStatus?: string;
  supplierClaimSubmittedAt?: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  inspection?: {
    id: string;
    inspectionNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  MATERIAL_DEFECT: "bg-red-100 text-red-800",
  PACKAGING: "bg-orange-100 text-orange-800",
  LABELING: "bg-yellow-100 text-yellow-800",
  DOCUMENTATION: "bg-blue-100 text-blue-800",
  PROCESS: "bg-purple-100 text-purple-800",
  SHIPPING: "bg-green-100 text-green-800",
};

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  MAJOR: "bg-orange-500 text-white",
  MINOR: "bg-yellow-500 text-white",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  INVESTIGATING: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const claimStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PAID: "bg-purple-100 text-purple-800",
};

export default function NCRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ncr, setNCR] = useState<NCR | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNCR();
  }, [params.id]);

  const fetchNCR = async () => {
    try {
      const response = await fetch(`/api/qc/ncr/${params.id}`);
      const data = await response.json();
      setNCR(data);
    } catch (error) {
      console.error("Error fetching NCR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this NCR?")) return;

    try {
      await fetch(`/api/qc/ncr/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/ncr");
    } catch (error) {
      console.error("Error deleting NCR:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading NCR details...</p>
        </div>
      </div>
    );
  }

  if (!ncr) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">NCR not found</p>
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
            onClick={() => router.push("/dashboard/qc/ncr")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ncr.ncrNumber}</h1>
            <p className="text-muted-foreground">
              Non-Conformance Report Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/qc/ncr/${params.id}/edit`)}
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
      <div className="flex gap-2">
        <Badge className={statusColors[ncr.status] || "bg-gray-100"}>
          {ncr.status.replace("_", " ")}
        </Badge>
        <Badge className={severityColors[ncr.severity] || "bg-gray-500"}>
          {ncr.severity}
        </Badge>
        <Badge className={categoryColors[ncr.category] || "bg-gray-100"}>
          {ncr.category.replace("_", " ")}
        </Badge>
        {ncr.supplierClaimStatus && (
          <Badge className={claimStatusColors[ncr.supplierClaimStatus]}>
            Claim: {ncr.supplierClaimStatus}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{ncr.description}</p>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Affected Quantity
                  </p>
                  <p className="text-2xl font-bold">{ncr.affectedQuantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Impact</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${ncr.costImpact.toFixed(2)}
                  </p>
                </div>
              </div>
              {ncr.dispositionMethod && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Disposition Method
                  </p>
                  <Badge variant="outline">
                    {ncr.dispositionMethod.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Root Cause & Actions */}
          {(ncr.rootCause || ncr.correctiveAction || ncr.preventiveAction) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Root Cause & Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ncr.rootCause && (
                  <div>
                    <p className="text-sm font-medium mb-1">Root Cause</p>
                    <p className="text-sm text-muted-foreground">
                      {ncr.rootCause}
                    </p>
                  </div>
                )}
                {ncr.correctiveAction && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Corrective Action
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ncr.correctiveAction}
                    </p>
                  </div>
                )}
                {ncr.preventiveAction && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Preventive Action
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ncr.preventiveAction}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Supplier Claim */}
          {ncr.supplierClaimAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Supplier Claim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Claim Amount
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ${ncr.supplierClaimAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    className={claimStatusColors[ncr.supplierClaimStatus || ""]}
                  >
                    {ncr.supplierClaimStatus}
                  </Badge>
                </div>
                {ncr.supplierClaimSubmittedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Submitted
                    </span>
                    <span className="text-sm">
                      {new Date(
                        ncr.supplierClaimSubmittedAt,
                      ).toLocaleDateString()}
                    </span>
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
              {ncr.supplier && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Supplier</p>
                  <p className="text-sm font-medium">{ncr.supplier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ncr.supplier.code}
                  </p>
                </div>
              )}
              {ncr.product && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="text-sm font-medium">{ncr.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ncr.product.sku}
                  </p>
                </div>
              )}
              {ncr.inspection && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Inspection
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/qc/inspections/${ncr.inspection?.id}`,
                      )
                    }
                  >
                    {ncr.inspection.inspectionNumber}
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
                  {new Date(ncr.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Detected</p>
                <p className="text-sm">
                  {new Date(ncr.detectedAt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  By: {ncr.detectedBy}
                </p>
              </div>
              {ncr.closedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-sm">
                    {new Date(ncr.closedAt).toLocaleString()}
                  </p>
                  {ncr.closedBy && (
                    <p className="text-xs text-muted-foreground">
                      By: {ncr.closedBy}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(ncr.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/dashboard/qc/capa/create?ncrId=${ncr.id}`)
                }
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Create CAPA
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
