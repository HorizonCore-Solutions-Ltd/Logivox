"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingDown,
  FileWarning,
} from "lucide-react";
import Link from "next/link";

interface DebitMemo {
  id: string;
  memoNumber: string;
  vendor: { id: string; name: string };
  reason: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  disputed: boolean;
  calculationMethod: string;
}

export default function DebitMemosPage() {
  const [loading, setLoading] = useState(true);
  const [debitMemos, setDebitMemos] = useState<DebitMemo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123";

  useEffect(() => {
    fetchDebitMemos();
    fetchStats();
  }, [filterStatus]);

  const fetchDebitMemos = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockMemos: DebitMemo[] = [
        {
          id: "1",
          memoNumber: "DM-202601-0001",
          vendor: { id: "v1", name: "Acme Suppliers Inc." },
          reason: "LATE_DELIVERY",
          amount: 2500.0,
          status: "PENDING",
          issueDate: "2026-01-04",
          dueDate: "2026-01-19",
          disputed: false,
          calculationMethod: "TIME_BASED",
        },
        {
          id: "2",
          memoNumber: "DM-202601-0002",
          vendor: { id: "v2", name: "Global Trade Co." },
          reason: "SHORT_SHIPMENT",
          amount: 4750.0,
          status: "APPROVED",
          issueDate: "2026-01-03",
          dueDate: "2026-01-18",
          disputed: false,
          calculationMethod: "QUANTITY_BASED",
        },
        {
          id: "3",
          memoNumber: "DM-202512-0048",
          vendor: { id: "v3", name: "Best Products Ltd." },
          reason: "NON_COMPLIANT_PACKAGING",
          amount: 1200.0,
          status: "DISPUTED",
          issueDate: "2025-12-20",
          dueDate: "2026-01-04",
          disputed: true,
          calculationMethod: "FIXED_FEE",
        },
        {
          id: "4",
          memoNumber: "DM-202512-0045",
          vendor: { id: "v4", name: "Quality Imports LLC" },
          reason: "DAMAGED_GOODS",
          amount: 3400.0,
          status: "PAID",
          issueDate: "2025-12-15",
          dueDate: "2025-12-30",
          disputed: false,
          calculationMethod: "PERCENTAGE",
        },
      ];

      setDebitMemos(mockMemos);
    } catch (error) {
      console.error("Error fetching debit memos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - Replace with actual API call
      setStats({
        totalMemos: 52,
        totalAmount: 124580.0,
        pendingAmount: 48920.0,
        approvedAmount: 56340.0,
        paidAmount: 19320.0,
        disputedAmount: 5640.0,
        collectionRate: 68,
        avgMemoValue: 2395.77,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; text: string }> = {
      PENDING: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
      APPROVED: { color: "bg-blue-500", icon: CheckCircle, text: "Approved" },
      DISPUTED: { color: "bg-red-500", icon: AlertTriangle, text: "Disputed" },
      PAID: { color: "bg-green-500", icon: DollarSign, text: "Paid" },
      REJECTED: { color: "bg-gray-500", icon: XCircle, text: "Rejected" },
    };

    const { color, icon: Icon, text } = config[status] || config.PENDING;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      SHORT_SHIPMENT: "Short Shipment",
      LATE_DELIVERY: "Late Delivery",
      NON_COMPLIANT_PACKAGING: "Non-Compliant Packaging",
      MISSING_DOCS: "Missing Documents",
      QUALITY_FAILURE: "Quality Failure",
      DAMAGED_GOODS: "Damaged Goods",
      INCORRECT_LABELING: "Incorrect Labeling",
      INCOMPLETE_ORDER: "Incomplete Order",
      OTHER: "Other",
    };
    return labels[reason] || reason;
  };

  const filteredMemos = debitMemos.filter((memo) => {
    const matchesStatus =
      filterStatus === "ALL" || memo.status === filterStatus;
    const matchesSearch =
      memo.memoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
            <FileWarning className="w-8 h-8 text-red-600" />
            Vendor Debit Memos
          </h1>
          <p className="text-muted-foreground">
            Track and manage vendor penalty charges for operational failures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDebitMemos} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/debit-memos/create">
            <Button>
              <FileWarning className="w-4 h-4 mr-2" />
              Issue Debit Memo
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Penalties
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalMemos} debit memos issued
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${stats.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.paidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.collectionRate}% recovery rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disputed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.disputedAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Under dispute resolution
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by memo # or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "DISPUTED", "PAID", "REJECTED"].map(
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
      </div>

      {/* Debit Memos List */}
      <div className="space-y-4">
        {filteredMemos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileWarning className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No debit memos found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Issue your first debit memo to penalize vendor non-compliance"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMemos.map((memo) => (
            <Card key={memo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {memo.memoNumber}
                      </h3>
                      {getStatusBadge(memo.status)}
                      {memo.disputed && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Disputed
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">
                      <strong>Vendor:</strong> {memo.vendor.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Penalty Amount</p>
                        <p className="font-semibold text-lg text-red-600">
                          ${memo.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reason</p>
                        <p className="font-medium">
                          {getReasonLabel(memo.reason)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date</p>
                        <p className="font-medium">
                          {new Date(memo.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">
                          {new Date(memo.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {memo.calculationMethod.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/dashboard/qc/debit-memos/${memo.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <FileWarning className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                About Debit Memos
              </h3>
              <p className="text-sm text-blue-800">
                Debit memos are financial charges issued to vendors for
                operational failures such as late deliveries, short shipments,
                non-compliant packaging, or missing documentation. They serve as
                penalty charges that can be offset against future vendor
                payments.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/50 p-2 rounded">
                  <strong>Fixed Fee:</strong> Standard penalty
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Percentage:</strong> % of order value
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Quantity:</strong> Per unit charge
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Time-Based:</strong> Daily penalties
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
