"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Calculator,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SamplingPlan {
  id: string;
  planNumber: string;
  planName: string;
  targetType: string;
  targetName?: string;
  inspectionType: string;
  inspectionLevel: string;
  aqlMajor?: number;
  aqlMinor?: number;
  samplingType: string;
  sampleSize?: number;
  status: string;
  timesUsed: number;
  effectiveDate: string;
  expirationDate?: string;
}

export default function SamplingPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SamplingPlan[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculator state
  const [lotSize, setLotSize] = useState<number>(1000);
  const [inspectionLevel, setInspectionLevel] = useState<string>("II");
  const [calculatedSize, setCalculatedSize] = useState<any>(null);

  const organizationId = "org_123"; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [statusFilter, targetTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ organizationId });
      if (statusFilter) params.append("status", statusFilter);
      if (targetTypeFilter) params.append("targetType", targetTypeFilter);

      const res = await fetch(`/api/qc/sampling-plans?${params.toString()}`);
      if (res.ok) setPlans(await res.json());
    } catch (error) {
      console.error("Error fetching sampling plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSampleSize = async () => {
    try {
      const res = await fetch("/api/qc/sampling-plans/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotSize, inspectionLevel }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedSize(data);
      }
    } catch (error) {
      console.error("Error calculating sample size:", error);
    }
  };

  const filteredPlans = plans.filter(
    (plan) =>
      plan.planNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: "bg-gray-500",
      ACTIVE: "bg-green-600",
      INACTIVE: "bg-yellow-500",
      SUPERSEDED: "bg-orange-500",
    };
    return <Badge className={`${config[status]} text-white`}>{status}</Badge>;
  };

  const getTargetTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      UNIVERSAL: "bg-purple-500",
      SUPPLIER: "bg-blue-500",
      PRODUCT: "bg-green-600",
      PRODUCT_CATEGORY: "bg-teal-500",
    };
    return (
      <Badge className={`${config[type]} text-white`}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  const isExpired = (expirationDate: string | undefined) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sampling Plans</h1>
          <p className="text-muted-foreground">
            AQL-based sampling per ANSI/ASQ Z1.4
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalculator(!showCalculator)}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {showCalculator ? "Hide" : "Show"} Calculator
          </Button>
          <Link href="/dashboard/qc/sampling-plans/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Sample Size Calculator */}
      {showCalculator && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Size Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lot Size</label>
                <Input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseInt(e.target.value))}
                  placeholder="Enter lot size"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inspection Level</label>
                <Select
                  value={inspectionLevel}
                  onValueChange={setInspectionLevel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S1">S-1 (Reduced)</SelectItem>
                    <SelectItem value="S2">S-2 (Reduced)</SelectItem>
                    <SelectItem value="S3">S-3 (Reduced)</SelectItem>
                    <SelectItem value="S4">S-4 (Reduced)</SelectItem>
                    <SelectItem value="I">I (General)</SelectItem>
                    <SelectItem value="II">II (General)</SelectItem>
                    <SelectItem value="III">III (General)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={calculateSampleSize} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </div>
            </div>

            {calculatedSize && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Sample Size Code
                    </p>
                    <p className="text-2xl font-bold">
                      {calculatedSize.sampleSizeCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sample Size</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculatedSize.sampleSize}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Inspection %
                    </p>
                    <p className="text-2xl font-bold">
                      {(
                        (calculatedSize.sampleSize / calculatedSize.lotSize) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              {plans.filter((p) => p.status === "ACTIVE").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Universal Plans
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.filter((p) => p.targetType === "UNIVERSAL").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Apply to all inspections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...plans.map((p) => p.timesUsed), 0)}
            </div>
            <p className="text-xs text-muted-foreground">times used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superseded</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.filter((p) => p.status === "SUPERSEDED").length}
            </div>
            <p className="text-xs text-muted-foreground">
              replaced by newer plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sampling Plans List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by plan number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUPERSEDED">Superseded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={targetTypeFilter}
              onValueChange={setTargetTypeFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Target Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="UNIVERSAL">Universal</SelectItem>
                <SelectItem value="SUPPLIER">Supplier</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="PRODUCT_CATEGORY">
                  Product Category
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Number</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Inspection Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>AQL Major</TableHead>
                  <TableHead>Sample Size</TableHead>
                  <TableHead>Times Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground"
                    >
                      No sampling plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.planNumber}
                      </TableCell>
                      <TableCell>{plan.planName}</TableCell>
                      <TableCell>
                        {getTargetTypeBadge(plan.targetType)}
                      </TableCell>
                      <TableCell>{plan.inspectionType}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.inspectionLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        {plan.aqlMajor ? `${plan.aqlMajor}%` : "-"}
                      </TableCell>
                      <TableCell>{plan.sampleSize || "-"}</TableCell>
                      <TableCell>{plan.timesUsed}</TableCell>
                      <TableCell>{getStatusBadge(plan.status)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            isExpired(plan.expirationDate) ? "text-red-600" : ""
                          }
                        >
                          {new Date(plan.effectiveDate).toLocaleDateString()}
                          {isExpired(plan.expirationDate) && " (Expired)"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/qc/sampling-plans/${plan.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
