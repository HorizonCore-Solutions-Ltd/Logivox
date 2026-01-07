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
  FileText,
  Plus,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface QualityReport {
  id: string;
  reportNumber: string;
  reportType: string;
  reportCategory: string;
  reportName: string;
  periodStart: string;
  periodEnd: string;
  generatedDate: string;
  metrics: any;
}

export default function QualityReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123"; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [reportTypeFilter, categoryFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ organizationId });
      if (reportTypeFilter) params.append("reportType", reportTypeFilter);
      if (categoryFilter) params.append("reportCategory", categoryFilter);

      const res = await fetch(`/api/qc/reports?${params.toString()}`);
      if (res.ok) setReports(await res.json());
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string, category: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      await fetch("/api/qc/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          reportType: type,
          reportCategory: category,
          reportName: `${category} ${type} Report - ${now.toLocaleDateString()}`,
          periodStart: startOfMonth.toISOString(),
          periodEnd: now.toISOString(),
          generatedBy: "user-123", // TODO: Get from auth
        }),
      });

      fetchData();
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getReportTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      DAILY: "bg-blue-500",
      WEEKLY: "bg-green-600",
      MONTHLY: "bg-purple-500",
      QUARTERLY: "bg-orange-500",
      ANNUAL: "bg-red-600",
      CUSTOM: "bg-gray-600",
    };
    return <Badge className={`${config[type]} text-white`}>{type}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, string> = {
      INSPECTION: "bg-blue-500",
      DEFECTS: "bg-red-500",
      NCR: "bg-orange-500",
      CAPA: "bg-purple-500",
      SUPPLIER: "bg-green-600",
      COMPLIANCE: "bg-teal-500",
      EXECUTIVE: "bg-gray-700",
    };
    return (
      <Badge className={`${config[category]} text-white`}>{category}</Badge>
    );
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
          <h1 className="text-3xl font-bold">Quality Reports</h1>
          <p className="text-muted-foreground">
            Generate and view quality metrics reports
          </p>
        </div>
        <Link href="/dashboard/qc/reports/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </Link>
      </div>

      {/* Quick Generate Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <Button
              variant="outline"
              onClick={() => generateReport("DAILY", "INSPECTION")}
              className="flex flex-col h-auto py-3"
            >
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-xs">Daily Inspections</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("WEEKLY", "DEFECTS")}
              className="flex flex-col h-auto py-3"
            >
              <BarChart3 className="h-5 w-5 mb-2" />
              <span className="text-xs">Weekly Defects</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("MONTHLY", "NCR")}
              className="flex flex-col h-auto py-3"
            >
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="text-xs">Monthly NCR</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("MONTHLY", "CAPA")}
              className="flex flex-col h-auto py-3"
            >
              <Calendar className="h-5 w-5 mb-2" />
              <span className="text-xs">Monthly CAPA</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("MONTHLY", "SUPPLIER")}
              className="flex flex-col h-auto py-3"
            >
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-xs">Supplier Quality</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("QUARTERLY", "COMPLIANCE")}
              className="flex flex-col h-auto py-3"
            >
              <BarChart3 className="h-5 w-5 mb-2" />
              <span className="text-xs">Compliance</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => generateReport("MONTHLY", "EXECUTIVE")}
              className="flex flex-col h-auto py-3 border-2 border-primary"
            >
              <TrendingUp className="h-5 w-5 mb-2 text-primary" />
              <span className="text-xs font-semibold">Executive Summary</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">All time generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                reports.filter((r) => {
                  const generated = new Date(r.generatedDate);
                  const now = new Date();
                  return (
                    generated.getMonth() === now.getMonth() &&
                    generated.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Executive Reports
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.reportCategory === "EXECUTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Management summaries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Scheduled reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by report number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={reportTypeFilter}
              onValueChange={setReportTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="DEFECTS">Defects</SelectItem>
                <SelectItem value="NCR">NCR</SelectItem>
                <SelectItem value="CAPA">CAPA</SelectItem>
                <SelectItem value="SUPPLIER">Supplier</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                <SelectItem value="EXECUTIVE">Executive</SelectItem>
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
                  <TableHead>Report Number</TableHead>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period Start</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No reports found. Generate your first report using the
                      buttons above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.reportNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {report.reportName}
                      </TableCell>
                      <TableCell>
                        {getReportTypeBadge(report.reportType)}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(report.reportCategory)}
                      </TableCell>
                      <TableCell>
                        {new Date(report.periodStart).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(report.generatedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/qc/reports/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
