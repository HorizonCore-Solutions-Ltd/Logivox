"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Gift,
  RefreshCw,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Percent,
} from "lucide-react";
import Link from "next/link";

interface Concession {
  id: string;
  concessionNumber: string;
  vendor: { id: string; name: string };
  concessionType: string;
  concessionValue: number;
  originalClaimAmount: number;
  relatedIssue: string;
  status: string;
  issuedDate: string;
  expiresAt: string | null;
  utilized: number;
  remaining: number;
}

export default function VendorConcessionsPage() {
  const [loading, setLoading] = useState(true);
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123";

  useEffect(() => {
    fetchConcessions();
    fetchStats();
  }, [filterStatus]);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockConcessions: Concession[] = [
        {
          id: "1",
          concessionNumber: "CON-202601-0001",
          vendor: { id: "v1", name: "Acme Suppliers Inc." },
          concessionType: "PRICE_DISCOUNT",
          concessionValue: 15000.0,
          originalClaimAmount: 22000.0,
          relatedIssue: "QUALITY_ISSUE",
          status: "ACTIVE",
          issuedDate: "2026-01-03",
          expiresAt: "2026-04-03",
          utilized: 4500.0,
          remaining: 10500.0,
        },
        {
          id: "2",
          concessionNumber: "CON-202601-0002",
          vendor: { id: "v2", name: "Global Trade Co." },
          concessionType: "CREDIT_ALLOWANCE",
          concessionValue: 8500.0,
          originalClaimAmount: 12000.0,
          relatedIssue: "RTV",
          status: "ACTIVE",
          issuedDate: "2026-01-02",
          expiresAt: "2026-03-02",
          utilized: 0,
          remaining: 8500.0,
        },
        {
          id: "3",
          concessionNumber: "CON-202512-0045",
          vendor: { id: "v3", name: "Best Products Ltd." },
          concessionType: "FREE_GOODS",
          concessionValue: 5400.0,
          originalClaimAmount: 5400.0,
          relatedIssue: "DELIVERY_DELAY",
          status: "FULLY_UTILIZED",
          issuedDate: "2025-12-15",
          expiresAt: null,
          utilized: 5400.0,
          remaining: 0,
        },
        {
          id: "4",
          concessionNumber: "CON-202512-0038",
          vendor: { id: "v4", name: "Quality Imports LLC" },
          concessionType: "EXTENDED_TERMS",
          concessionValue: 0,
          originalClaimAmount: 18500.0,
          relatedIssue: "OTHER",
          status: "EXPIRED",
          issuedDate: "2025-11-01",
          expiresAt: "2025-12-31",
          utilized: 0,
          remaining: 0,
        },
      ];

      setConcessions(mockConcessions);
    } catch (error) {
      console.error("Error fetching concessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - Replace with actual API call
      setStats({
        totalConcessions: 38,
        totalValue: 245680.0,
        activeValue: 189420.0,
        utilizedValue: 98540.0,
        remainingValue: 90880.0,
        expiredValue: 56260.0,
        utilizationRate: 52,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; text: string }> = {
      ACTIVE: { color: "bg-green-500", icon: CheckCircle, text: "Active" },
      FULLY_UTILIZED: {
        color: "bg-blue-500",
        icon: DollarSign,
        text: "Fully Utilized",
      },
      EXPIRED: { color: "bg-gray-500", icon: Clock, text: "Expired" },
      CANCELLED: { color: "bg-red-500", icon: AlertCircle, text: "Cancelled" },
    };

    const { color, icon: Icon, text } = config[status] || config.ACTIVE;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const getConcessionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRICE_DISCOUNT: "Price Discount",
      CREDIT_ALLOWANCE: "Credit Allowance",
      FREE_GOODS: "Free Goods",
      EXTENDED_TERMS: "Extended Payment Terms",
      PROMOTIONAL_ALLOWANCE: "Promotional Allowance",
    };
    return labels[type] || type;
  };

  const getRelatedIssueLabel = (issue: string) => {
    const labels: Record<string, string> = {
      RTV: "Return to Vendor",
      QUALITY_ISSUE: "Quality Issue",
      DELIVERY_DELAY: "Delivery Delay",
      OTHER: "Other",
    };
    return labels[issue] || issue;
  };

  const filteredConcessions = concessions.filter((con) => {
    const matchesStatus = filterStatus === "ALL" || con.status === filterStatus;
    const matchesSearch =
      con.concessionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      con.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            <Gift className="w-8 h-8 text-yellow-600" />
            Vendor Concessions
          </h1>
          <p className="text-muted-foreground">
            Track negotiated credits and alternative resolutions from vendors
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchConcessions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/concessions/create">
            <Button>
              <Gift className="w-4 h-4 mr-2" />
              Create Concession
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalConcessions} concessions negotiated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Value
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.activeValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to utilize
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilized</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.utilizedValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.utilizationRate}% utilization rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Percent className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${stats.remainingValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unused credits
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by concession # or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "FULLY_UTILIZED", "EXPIRED", "CANCELLED"].map(
            (status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.replace("_", " ")}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Concessions List */}
      <div className="space-y-4">
        {filteredConcessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No concessions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first concession to track vendor credits"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConcessions.map((concession) => (
            <Card
              key={concession.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {concession.concessionNumber}
                      </h3>
                      {getStatusBadge(concession.status)}
                      <Badge variant="outline">
                        {getConcessionTypeLabel(concession.concessionType)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      <strong>Vendor:</strong> {concession.vendor.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Concession Value
                        </p>
                        <p className="font-semibold text-lg text-green-600">
                          ${concession.concessionValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Original Claim</p>
                        <p className="font-medium">
                          ${concession.originalClaimAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilized</p>
                        <p className="font-medium text-blue-600">
                          ${concession.utilized.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium text-yellow-600">
                          ${concession.remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Related Issue
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {getRelatedIssueLabel(concession.relatedIssue)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Expiration
                        </p>
                        <p className="font-medium mt-1">
                          {concession.expiresAt
                            ? new Date(
                                concession.expiresAt,
                              ).toLocaleDateString()
                            : "No expiration"}
                        </p>
                      </div>
                    </div>
                    {concession.status === "ACTIVE" &&
                      concession.remaining > 0 && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-sm text-green-800">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            <strong>
                              ${concession.remaining.toLocaleString()}
                            </strong>{" "}
                            available for use
                          </p>
                        </div>
                      )}
                  </div>
                  <Link href={`/dashboard/qc/concessions/${concession.id}`}>
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
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Gift className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                About Vendor Concessions
              </h3>
              <p className="text-sm text-yellow-800">
                Concessions are negotiated alternatives to chargebacks, debit
                memos, or RTVs. They can include price discounts, credit
                allowances, free goods, extended payment terms, or promotional
                allowances. Concessions help maintain vendor relationships while
                still recovering value from quality issues or delays.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/50 p-2 rounded">
                  <strong>Track Utilization:</strong> Monitor credit usage
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Expiration Alerts:</strong> Avoid losing credits
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Better Relations:</strong> Win-win resolutions
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
