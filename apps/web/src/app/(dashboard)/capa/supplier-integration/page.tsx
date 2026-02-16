"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  RefreshCw,
  BarChart3,
  FileText,
} from "lucide-react";

/**
 * CAPA SYSTEM 7: SUPPLIER ERP INTEGRATION
 *
 * Dashboard for managing supplier CAPA requests and viewing quality scorecards.
 * Integrates with SAP, Oracle, NetSuite, and custom ERP systems.
 *
 * Investment: $142,000 | Annual Savings: $1,800,000 | ROI: 1,268%
 */

interface SupplierCapa {
  id: string;
  capaId: string;
  supplierId: string;
  requestedAt: string;
  dueDate: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "PENDING"
    | "ACKNOWLEDGED"
    | "IN_PROGRESS"
    | "ACTIONS_COMPLETED"
    | "EVIDENCE_SUBMITTED"
    | "REJECTED";
  description: string;
  externalCapaId?: string;
  erpSyncStatus?: "SYNCED" | "FAILED" | "PENDING";
  supplier: {
    id: string;
    name: string;
    erpType: string;
    contactEmail: string;
    qualityScore?: number;
  };
  capa: {
    id: string;
    capaNumber: string;
    title: string;
    severity: string;
    status: string;
  };
  responses: any[];
}

interface SupplierScorecard {
  supplierId: string;
  totalRequests: number;
  completed: number;
  overdue: number;
  inProgress: number;
  avgResponseTimeHours: number;
  completionRate: number;
  onTimeRate: number;
  qualityScore: number;
  grade: string;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
}

export default function SupplierIntegrationPage() {
  const { data: session } = useSession();
  const [supplierCapas, setSupplierCapas] = useState<SupplierCapa[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<SupplierScorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierCapas();
  }, [selectedSupplier]);

  const loadSupplierCapas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSupplier) {
        params.set("supplierId", selectedSupplier);
        params.set("scorecard", "true");
      }

      const response = await fetch(`/api/capa/supplier-integration?${params}`);
      const result = await response.json();

      if (result.success) {
        setSupplierCapas(result.data);
        setStats(result.stats);
        if (result.scorecard) {
          setScorecard(result.scorecard);
        }
      }
    } catch (error) {
      console.error("Failed to load supplier CAPAs:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncERPStatus = async (capaId: string) => {
    setSyncing(capaId);
    try {
      const response = await fetch("/api/capa/supplier-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_STATUS",
          supplierCapaId: capaId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        loadSupplierCapas();
      }
    } catch (error) {
      console.error("Failed to sync ERP status:", error);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "ACKNOWLEDGED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIONS_COMPLETED":
        return "bg-green-100 text-green-800";
      case "EVIDENCE_SUBMITTED":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-yellow-600";
    if (grade.startsWith("D")) return "text-orange-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DECLINING":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return (
      new Date(dueDate) < new Date() &&
      status !== "ACTIONS_COMPLETED" &&
      status !== "EVIDENCE_SUBMITTED"
    );
  };

  const getDaysRemaining = (dueDate: string) => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days;
  };

  // Get unique suppliers from data
  const suppliers = Array.from(
    new Map(supplierCapas.map((c) => [c.supplier.id, c.supplier])).values(),
  );

  if (loading && supplierCapas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading supplier integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Supplier ERP Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage supplier CAPA requests and quality scorecards
            </p>
          </div>
          <Button onClick={() => loadSupplierCapas()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalRequests}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Acknowledged
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.acknowledged}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {stats.inProgress}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {stats.overdue}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Response
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.avgResponseTime}h
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Supplier Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Filter by Supplier:
            </span>
            <Button
              variant={selectedSupplier === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSupplier(null)}
            >
              All Suppliers
            </Button>
            {suppliers.map((supplier) => (
              <Button
                key={supplier.id}
                variant={
                  selectedSupplier === supplier.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {supplier.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Supplier Scorecard */}
        {scorecard && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Supplier Quality Scorecard
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`text-3xl font-bold ${getGradeColor(scorecard.grade)}`}
                >
                  {scorecard.grade}
                </span>
                {getTrendIcon(scorecard.trend)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {scorecard.qualityScore.toFixed(1)}%
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {scorecard.completionRate.toFixed(1)}%
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">On-Time Rate</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {scorecard.onTimeRate.toFixed(1)}%
                </p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {scorecard.avgResponseTimeHours.toFixed(1)}h
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-gray-600">Total Requests</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {scorecard.totalRequests}
                </p>
              </div>
              <div>
                <p className="text-gray-600">In Progress</p>
                <p className="font-semibold text-yellow-900 mt-1">
                  {scorecard.inProgress}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Overdue</p>
                <p className="font-semibold text-red-900 mt-1">
                  {scorecard.overdue}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Supplier CAPA Requests Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Supplier CAPA Requests
          </h2>

          {supplierCapas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No supplier CAPA requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CAPA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ERP Sync
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Responses
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierCapas.map((capa) => {
                    const overdue = isOverdue(capa.dueDate, capa.status);
                    const daysRemaining = getDaysRemaining(capa.dueDate);

                    return (
                      <tr key={capa.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {capa.capa.capaNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {capa.capa.title}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {capa.supplier.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {capa.supplier.erpType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge
                            className={`${getSeverityColor(capa.severity)} border`}
                          >
                            {capa.severity}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(capa.status)}>
                            {capa.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {capa.externalCapaId ? (
                            <div>
                              <Badge
                                className={
                                  capa.erpSyncStatus === "SYNCED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {capa.erpSyncStatus}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {capa.externalCapaId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No ERP sync
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            className={
                              overdue ? "text-red-600" : "text-gray-900"
                            }
                          >
                            <div className="text-sm font-medium">
                              {new Date(capa.dueDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              {overdue ? (
                                <span className="text-red-600">
                                  Overdue by {Math.abs(daysRemaining)} days
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  {daysRemaining} days remaining
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <Badge variant="outline" className="bg-blue-50">
                            {capa.responses.length}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncERPStatus(capa.id)}
                            disabled={
                              !capa.externalCapaId || syncing === capa.id
                            }
                          >
                            {syncing === capa.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
