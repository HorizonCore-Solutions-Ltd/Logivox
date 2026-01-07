"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Target,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface CAPA {
  id: string;
  capaNumber: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  rootCause?: string;
  immediateAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  effectivenessVerification?: string;
  verificationMethod?: string;
  verificationResult?: string;
  assignedTo?: string;
  targetDate: string;
  completedDate?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  ncr?: {
    id: string;
    ncrNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

const typeColors: Record<string, string> = {
  CORRECTIVE: "bg-orange-100 text-orange-800",
  PREVENTIVE: "bg-green-100 text-green-800",
  BOTH: "bg-purple-100 text-purple-800",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  PENDING_VERIFICATION: "bg-purple-100 text-purple-800",
  VERIFIED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-500 text-white",
};

export default function CAPADetailPage() {
  const params = useParams();
  const router = useRouter();
  const [capa, setCAPA] = useState<CAPA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCAPA();
  }, [params.id]);

  const fetchCAPA = async () => {
    try {
      const response = await fetch(`/api/qc/capa/${params.id}`);
      const data = await response.json();
      setCAPA(data);
    } catch (error) {
      console.error("Error fetching CAPA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this CAPA?")) return;

    try {
      await fetch(`/api/qc/capa/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/capa");
    } catch (error) {
      console.error("Error deleting CAPA:", error);
    }
  };

  const getRPNLevel = (rpn: number) => {
    if (rpn >= 200)
      return {
        label: "High Risk",
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    if (rpn >= 100)
      return {
        label: "Medium Risk",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      };
    return {
      label: "Low Risk",
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  };

  const getCompletionPercentage = () => {
    if (!capa) return 0;
    let completed = 0;
    let total = 5;

    if (capa.rootCause) completed++;
    if (capa.immediateAction) completed++;
    if (capa.correctiveAction) completed++;
    if (capa.preventiveAction) completed++;
    if (capa.effectivenessVerification) completed++;

    return (completed / total) * 100;
  };

  const isOverdue = () => {
    if (!capa || capa.status === "CLOSED" || capa.status === "VERIFIED")
      return false;
    return new Date(capa.targetDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading CAPA details...</p>
        </div>
      </div>
    );
  }

  if (!capa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">CAPA not found</p>
        </div>
      </div>
    );
  }

  const riskLevel = getRPNLevel(capa.rpn);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/qc/capa")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{capa.capaNumber}</h1>
            <p className="text-muted-foreground">{capa.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/qc/capa/${params.id}/edit`)}
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
        <Badge className={statusColors[capa.status] || "bg-gray-100"}>
          {capa.status.replace("_", " ")}
        </Badge>
        <Badge className={typeColors[capa.type] || "bg-gray-100"}>
          {capa.type}
        </Badge>
        <Badge className={priorityColors[capa.priority] || "bg-gray-100"}>
          {capa.priority} Priority
        </Badge>
        <Badge className={`${riskLevel.bgColor} ${riskLevel.color}`}>
          RPN: {capa.rpn} - {riskLevel.label}
        </Badge>
        {isOverdue() && (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )}
      </div>

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Completion Progress
            </span>
            <span className="text-sm font-normal">
              {getCompletionPercentage().toFixed(0)}% Complete
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="h-2" />
        </CardContent>
      </Card>

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
              <p className="text-sm">{capa.description}</p>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Priority Number (RPN) Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Severity</p>
                  <p className="text-2xl font-bold">{capa.severity}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Occurrence
                  </p>
                  <p className="text-2xl font-bold">{capa.occurrence}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Detection
                  </p>
                  <p className="text-2xl font-bold">{capa.detection}</p>
                </div>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${riskLevel.bgColor}`}
              >
                <p className="text-sm text-muted-foreground mb-1">Total RPN</p>
                <p className={`text-3xl font-bold ${riskLevel.color}`}>
                  {capa.rpn}
                </p>
                <p className={`text-sm ${riskLevel.color}`}>
                  {riskLevel.label}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Root Cause & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Analysis & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {capa.rootCause && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">Root Cause Analysis</p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {capa.rootCause}
                  </p>
                </div>
              )}
              {capa.immediateAction && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">Immediate Action</p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {capa.immediateAction}
                  </p>
                </div>
              )}
              {capa.correctiveAction && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">Corrective Action</p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {capa.correctiveAction}
                  </p>
                </div>
              )}
              {capa.preventiveAction && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">Preventive Action</p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {capa.preventiveAction}
                  </p>
                </div>
              )}
              {!capa.rootCause &&
                !capa.immediateAction &&
                !capa.correctiveAction &&
                !capa.preventiveAction && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No actions documented yet
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Effectiveness Verification */}
          {(capa.effectivenessVerification ||
            capa.verificationMethod ||
            capa.verificationResult) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Effectiveness Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capa.verificationMethod && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Verification Method
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {capa.verificationMethod}
                    </p>
                  </div>
                )}
                {capa.effectivenessVerification && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Verification Plan
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {capa.effectivenessVerification}
                    </p>
                  </div>
                )}
                {capa.verificationResult && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Verification Result
                    </p>
                    <Badge
                      variant={
                        capa.verificationResult === "EFFECTIVE"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {capa.verificationResult}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {capa.assignedTo && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-medium">{capa.assignedTo}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Target Date</p>
                <p
                  className={`text-sm font-medium ${isOverdue() ? "text-red-600" : ""}`}
                >
                  {new Date(capa.targetDate).toLocaleDateString()}
                  {isOverdue() && " (Overdue)"}
                </p>
              </div>
              {capa.completedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Completed Date
                  </p>
                  <p className="text-sm">
                    {new Date(capa.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {capa.verifiedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Verified Date</p>
                  <p className="text-sm">
                    {new Date(capa.verifiedDate).toLocaleDateString()}
                  </p>
                  {capa.verifiedBy && (
                    <p className="text-xs text-muted-foreground">
                      By: {capa.verifiedBy}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related NCR */}
          {capa.ncr && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Related NCR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() =>
                    router.push(`/dashboard/qc/ncr/${capa.ncr?.id}`)
                  }
                >
                  {capa.ncr.ncrNumber}
                </Button>
              </CardContent>
            </Card>
          )}

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
                  {new Date(capa.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(capa.updatedAt).toLocaleString()}
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
              {capa.status === "OPEN" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Update status to IN_PROGRESS */
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start Working
                </Button>
              )}
              {capa.status === "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Update status to PENDING_VERIFICATION */
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Submit for Verification
                </Button>
              )}
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
