"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  Calculator,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface SamplingPlan {
  id: string;
  planNumber: string;
  planName: string;
  description?: string;
  productCategory: string;
  inspectionLevel: string;
  aql: number;
  sampleSize: number;
  acceptanceNumber: number;
  rejectionNumber: number;
  inspectionType: string;
  status: string;
  effectiveDate: string;
  expiryDate?: string;
  lastUsed?: string;
  usageCount: number;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-red-100 text-red-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
};

const inspectionTypeColors: Record<string, string> = {
  NORMAL: "bg-blue-100 text-blue-800",
  REDUCED: "bg-green-100 text-green-800",
  TIGHTENED: "bg-orange-100 text-orange-800",
};

export default function SamplingPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<SamplingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatorLotSize, setCalculatorLotSize] = useState("");
  const [calculatedSample, setCalculatedSample] = useState<{
    sampleSize: number;
    acceptanceNumber: number;
    rejectionNumber: number;
  } | null>(null);

  useEffect(() => {
    fetchPlan();
  }, [params.id]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/qc/sampling-plans/${params.id}`);
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error("Error fetching sampling plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sampling plan?")) return;

    try {
      await fetch(`/api/qc/sampling-plans/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/sampling-plans");
    } catch (error) {
      console.error("Error deleting sampling plan:", error);
    }
  };

  const calculateSample = async () => {
    if (!plan || !calculatorLotSize) return;

    try {
      const response = await fetch("/api/qc/sampling-plans/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotSize: parseInt(calculatorLotSize),
          aql: plan.aql,
          inspectionLevel: plan.inspectionLevel,
        }),
      });
      const data = await response.json();
      setCalculatedSample(data);
    } catch (error) {
      console.error("Error calculating sample:", error);
    }
  };

  const isExpired = () => {
    if (!plan || !plan.expiryDate) return false;
    return new Date(plan.expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sampling plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">Sampling plan not found</p>
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
            onClick={() => router.push("/dashboard/qc/sampling-plans")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{plan.planNumber}</h1>
            <p className="text-muted-foreground">{plan.planName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/qc/sampling-plans/${params.id}/edit`)
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
        <Badge className={statusColors[plan.status] || "bg-gray-100"}>
          {plan.status}
        </Badge>
        <Badge
          className={inspectionTypeColors[plan.inspectionType] || "bg-gray-100"}
        >
          {plan.inspectionType} Inspection
        </Badge>
        <Badge variant="outline">AQL: {plan.aql}</Badge>
        <Badge variant="outline">Level: {plan.inspectionLevel}</Badge>
        {isExpired() && (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {plan.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{plan.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Sampling Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Sampling Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">AQL</p>
                  <p className="text-2xl font-bold text-blue-600">{plan.aql}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Sample Size
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {plan.sampleSize}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Accept</p>
                  <p className="text-2xl font-bold text-green-600">
                    {plan.acceptanceNumber}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Reject</p>
                  <p className="text-2xl font-bold text-red-600">
                    {plan.rejectionNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AQL Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Sample Size Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter Lot Size
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={calculatorLotSize}
                    onChange={(e) => setCalculatorLotSize(e.target.value)}
                    placeholder="e.g., 5000"
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <Button onClick={calculateSample}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </Button>
                </div>
              </div>

              {calculatedSample && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Calculated Sample Plan:
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-blue-700">Sample Size</p>
                      <p className="text-lg font-bold text-blue-900">
                        {calculatedSample.sampleSize}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Accept</p>
                      <p className="text-lg font-bold text-blue-900">
                        {calculatedSample.acceptanceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Reject</p>
                      <p className="text-lg font-bold text-blue-900">
                        {calculatedSample.rejectionNumber}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Based on AQL {plan.aql} and Level {plan.inspectionLevel}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applied Products */}
          {plan.products && plan.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Applied to Products ({plan.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/products/${product.id}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Times Used</p>
                <p className="text-2xl font-bold">{plan.usageCount}</p>
              </div>
              {plan.lastUsed && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Used</p>
                  <p className="text-sm">
                    {new Date(plan.lastUsed).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  Product Category
                </p>
                <Badge variant="outline">
                  {plan.productCategory.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Approval Information */}
          {plan.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="text-sm font-medium">{plan.approvedBy}</p>
                </div>
                {plan.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Approved Date
                    </p>
                    <p className="text-sm">
                      {new Date(plan.approvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Effective Date</p>
                <p className="text-sm">
                  {new Date(plan.effectiveDate).toLocaleDateString()}
                </p>
              </div>
              {plan.expiryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p
                    className={`text-sm ${isExpired() ? "text-red-600 font-bold" : ""}`}
                  >
                    {new Date(plan.expiryDate).toLocaleDateString()}
                    {isExpired() && " (Expired)"}
                  </p>
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
              {plan.createdBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="text-sm">{plan.createdBy}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(plan.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(plan.updatedAt).toLocaleString()}
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
                  router.push(
                    `/dashboard/qc/inspections/create?planId=${plan.id}`,
                  )
                }
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Use in Inspection
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  /* Duplicate plan */
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Duplicate Plan
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
