"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  FileQuestion,
  TrendingDown,
  Target,
} from "lucide-react";
import Link from "next/link";

interface RootCauseAnalysis {
  id: string;
  analysisNumber: string;
  defectType: string;
  vendor: { id: string; name: string };
  affectedItems: number;
  impactCost: number;
  status: string;
  createdDate: string;
  completedDate: string | null;
  why1: string;
  why2: string | null;
  why3: string | null;
  why4: string | null;
  why5: string | null;
  rootCause: string | null;
  correctiveActions: number;
  verificationScore: number | null;
}

export default function RootCauseAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<RootCauseAnalysis[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123";

  useEffect(() => {
    fetchAnalyses();
    fetchStats();
  }, [filterStatus]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockAnalyses: RootCauseAnalysis[] = [
        {
          id: "1",
          analysisNumber: "RCA-202601-0001",
          defectType: "MATERIAL_DEFECT",
          vendor: { id: "v1", name: "Acme Suppliers Inc." },
          affectedItems: 1250,
          impactCost: 18500.0,
          status: "IN_PROGRESS",
          createdDate: "2026-01-04",
          completedDate: null,
          why1: "Products failed quality inspection",
          why2: "Raw materials did not meet specifications",
          why3: null,
          why4: null,
          why5: null,
          rootCause: null,
          correctiveActions: 0,
          verificationScore: null,
        },
        {
          id: "2",
          analysisNumber: "RCA-202601-0002",
          defectType: "PACKAGING_DAMAGE",
          vendor: { id: "v2", name: "Global Trade Co." },
          affectedItems: 450,
          impactCost: 6750.0,
          status: "COMPLETED",
          createdDate: "2026-01-02",
          completedDate: "2026-01-04",
          why1: "Products arrived damaged",
          why2: "Packaging was insufficient for transit",
          why3: "Vendor used lower-grade materials to cut costs",
          why4: "No quality checks on packaging materials",
          why5: "Lack of packaging standards in vendor contract",
          rootCause:
            "Lack of defined packaging standards and quality control procedures",
          correctiveActions: 3,
          verificationScore: 85,
        },
        {
          id: "3",
          analysisNumber: "RCA-202512-0048",
          defectType: "LABELING_ERROR",
          vendor: { id: "v3", name: "Best Products Ltd." },
          affectedItems: 2800,
          impactCost: 12400.0,
          status: "VERIFICATION",
          createdDate: "2025-12-20",
          completedDate: "2025-12-28",
          why1: "Products had incorrect labels",
          why2: "Barcode scanning system malfunctioned",
          why3: "Software not updated with new product codes",
          why4: "IT maintenance schedule not followed",
          why5: "No automated alerts for system updates",
          rootCause:
            "Inadequate IT maintenance procedures and lack of automated monitoring",
          correctiveActions: 4,
          verificationScore: 92,
        },
        {
          id: "4",
          analysisNumber: "RCA-202512-0045",
          defectType: "DIMENSIONAL_VARIANCE",
          vendor: { id: "v4", name: "Quality Imports LLC" },
          affectedItems: 680,
          impactCost: 9800.0,
          status: "CLOSED",
          createdDate: "2025-12-15",
          completedDate: "2025-12-22",
          why1: "Products did not fit specifications",
          why2: "Manufacturing equipment calibration was off",
          why3: "Calibration schedule not maintained",
          why4: "Lack of preventive maintenance program",
          why5: "No ownership of equipment maintenance responsibility",
          rootCause:
            "Absence of formal preventive maintenance program and clear ownership",
          correctiveActions: 5,
          verificationScore: 95,
        },
      ];

      setAnalyses(mockAnalyses);
    } catch (error) {
      console.error("Error fetching RCA:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - Replace with actual API call
      setStats({
        totalAnalyses: 124,
        inProgress: 18,
        completed: 94,
        avgImpactCost: 11250.0,
        totalImpactCost: 1395000.0,
        avgResolutionDays: 6.5,
        effectivenessRate: 89,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; text: string }> = {
      IN_PROGRESS: { color: "bg-blue-500", icon: Clock, text: "In Progress" },
      COMPLETED: {
        color: "bg-green-500",
        icon: CheckCircle,
        text: "Completed",
      },
      VERIFICATION: {
        color: "bg-yellow-500",
        icon: Target,
        text: "Verification",
      },
      CLOSED: { color: "bg-gray-500", icon: CheckCircle, text: "Closed" },
    };

    const { color, icon: Icon, text } = config[status] || config.IN_PROGRESS;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const getDefectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MATERIAL_DEFECT: "Material Defect",
      PACKAGING_DAMAGE: "Packaging Damage",
      LABELING_ERROR: "Labeling Error",
      DIMENSIONAL_VARIANCE: "Dimensional Variance",
      FUNCTIONAL_FAILURE: "Functional Failure",
      CONTAMINATION: "Contamination",
      COLOR_VARIANCE: "Color Variance",
      ASSEMBLY_ERROR: "Assembly Error",
      MISSING_COMPONENTS: "Missing Components",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  const getWhyCount = (analysis: RootCauseAnalysis) => {
    let count = 1; // Always have why1
    if (analysis.why2) count++;
    if (analysis.why3) count++;
    if (analysis.why4) count++;
    if (analysis.why5) count++;
    return count;
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesStatus =
      filterStatus === "ALL" || analysis.status === filterStatus;
    const matchesSearch =
      analysis.analysisNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      analysis.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.defectType.toLowerCase().includes(searchTerm.toLowerCase());
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
            <Search className="w-8 h-8 text-pink-600" />
            Root Cause Analysis
          </h1>
          <p className="text-muted-foreground">
            5 Whys methodology for systematic defect investigation
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalyses} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/root-cause-analysis/create">
            <Button>
              <FileQuestion className="w-4 h-4 mr-2" />
              Start Analysis
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
                Total Analyses
              </CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.inProgress} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Impact
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.totalImpactCost.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg ${stats.avgImpactCost.toLocaleString()} per issue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Resolution
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgResolutionDays} days
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to complete analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Effectiveness
              </CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.effectivenessRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Actions verified successful
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by analysis #, vendor, or defect type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {["ALL", "IN_PROGRESS", "COMPLETED", "VERIFICATION", "CLOSED"].map(
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

      {/* Analyses List */}
      <div className="space-y-4">
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No analyses found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Start your first root cause analysis to investigate quality issues"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {analysis.analysisNumber}
                      </h3>
                      {getStatusBadge(analysis.status)}
                      <Badge variant="outline">
                        {getDefectTypeLabel(analysis.defectType)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      <strong>Vendor:</strong> {analysis.vendor.name}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Impact Cost</p>
                        <p className="font-semibold text-lg text-red-600">
                          ${analysis.impactCost.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Affected Items</p>
                        <p className="font-medium">
                          {analysis.affectedItems.toLocaleString()} units
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">5 Whys Progress</p>
                        <p className="font-medium">
                          {getWhyCount(analysis)}/5 completed
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Corrective Actions
                        </p>
                        <p className="font-medium">
                          {analysis.correctiveActions} actions
                        </p>
                      </div>
                    </div>

                    {/* 5 Whys Chain Preview */}
                    <div className="bg-pink-50 border border-pink-200 rounded p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <FileQuestion className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-pink-900 mb-1">
                            5 Whys Chain:
                          </p>
                          <div className="space-y-1 text-xs text-pink-800">
                            <div>
                              <strong>Why 1:</strong> {analysis.why1}
                            </div>
                            {analysis.why2 && (
                              <div>
                                <strong>Why 2:</strong> {analysis.why2}
                              </div>
                            )}
                            {analysis.why3 && (
                              <div>
                                <strong>Why 3:</strong> {analysis.why3}
                              </div>
                            )}
                            {analysis.why4 && (
                              <div>
                                <strong>Why 4:</strong> {analysis.why4}
                              </div>
                            )}
                            {analysis.why5 && (
                              <div>
                                <strong>Why 5:</strong> {analysis.why5}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Root Cause & Verification */}
                    {analysis.rootCause && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-start gap-2">
                          <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-green-900 mb-1">
                              Root Cause:
                            </p>
                            <p className="text-sm text-green-800">
                              {analysis.rootCause}
                            </p>
                            {analysis.verificationScore && (
                              <div className="mt-2">
                                <Badge className="bg-green-600 text-white">
                                  Verification Score:{" "}
                                  {analysis.verificationScore}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      Created:{" "}
                      {new Date(analysis.createdDate).toLocaleDateString()}
                      {analysis.completedDate &&
                        ` • Completed: ${new Date(analysis.completedDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/qc/root-cause-analysis/${analysis.id}`}
                  >
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
      <Card className="bg-pink-50 border-pink-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <FileQuestion className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-pink-900 mb-2">
                About 5 Whys Methodology
              </h3>
              <p className="text-sm text-pink-800 mb-3">
                The 5 Whys is an iterative interrogative technique used to
                explore cause-and-effect relationships. By repeatedly asking
                "Why?" (typically five times), you can peel away layers of
                symptoms to reveal the root cause of a problem. This method
                helps prevent recurrence by addressing fundamental issues rather
                than symptoms.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/50 p-2 rounded">
                  <strong>Step 1:</strong> Identify the problem clearly
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Step 2:</strong> Ask "Why?" repeatedly
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Step 3:</strong> Define corrective actions
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Step 4:</strong> Verify effectiveness
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
