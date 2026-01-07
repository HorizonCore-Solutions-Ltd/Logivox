"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Star,
} from "lucide-react";
import Link from "next/link";

interface PerformanceReview {
  id: string;
  reviewNumber: string;
  vendor: { id: string; name: string };
  reviewPeriod: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  responsivenessScore: number;
  pricingScore: number;
  complianceScore: number;
  status: string;
  reviewDate: string;
  rating: string;
}

export default function PerformanceReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123";

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filterStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockReviews: PerformanceReview[] = [
        {
          id: "1",
          reviewNumber: "PR-2026-Q1-001",
          vendor: { id: "v1", name: "Acme Suppliers Inc." },
          reviewPeriod: "Q1 2026",
          periodStart: "2026-01-01",
          periodEnd: "2026-03-31",
          overallScore: 87.5,
          qualityScore: 92,
          deliveryScore: 85,
          responsivenessScore: 88,
          pricingScore: 84,
          complianceScore: 90,
          status: "IN_PROGRESS",
          reviewDate: "2026-01-05",
          rating: "EXCELLENT",
        },
        {
          id: "2",
          reviewNumber: "PR-2025-Q4-045",
          vendor: { id: "v2", name: "Global Trade Co." },
          reviewPeriod: "Q4 2025",
          periodStart: "2025-10-01",
          periodEnd: "2025-12-31",
          overallScore: 72.3,
          qualityScore: 68,
          deliveryScore: 75,
          responsivenessScore: 70,
          pricingScore: 78,
          complianceScore: 71,
          status: "COMPLETED",
          reviewDate: "2025-12-28",
          rating: "GOOD",
        },
        {
          id: "3",
          reviewNumber: "PR-2025-Q4-046",
          vendor: { id: "v3", name: "Best Products Ltd." },
          reviewPeriod: "Q4 2025",
          periodStart: "2025-10-01",
          periodEnd: "2025-12-31",
          overallScore: 94.2,
          qualityScore: 96,
          deliveryScore: 93,
          responsivenessScore: 95,
          pricingScore: 92,
          complianceScore: 95,
          status: "COMPLETED",
          reviewDate: "2025-12-29",
          rating: "OUTSTANDING",
        },
        {
          id: "4",
          reviewNumber: "PR-2025-Q4-044",
          vendor: { id: "v4", name: "Quality Imports LLC" },
          reviewPeriod: "Q4 2025",
          periodStart: "2025-10-01",
          periodEnd: "2025-12-31",
          overallScore: 58.7,
          qualityScore: 52,
          deliveryScore: 60,
          responsivenessScore: 55,
          pricingScore: 70,
          complianceScore: 57,
          status: "REQUIRES_ACTION",
          reviewDate: "2025-12-27",
          rating: "NEEDS_IMPROVEMENT",
        },
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - Replace with actual API call
      setStats({
        totalReviews: 186,
        avgScore: 78.5,
        outstandingVendors: 24,
        needsImprovementVendors: 12,
        trendsImproving: 42,
        trendsDeclining: 8,
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
      REQUIRES_ACTION: {
        color: "bg-red-500",
        icon: AlertTriangle,
        text: "Requires Action",
      },
    };

    const { color, icon: Icon, text } = config[status] || config.IN_PROGRESS;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const getRatingBadge = (rating: string, score: number) => {
    const config: Record<string, { color: string; text: string }> = {
      OUTSTANDING: { color: "bg-purple-500", text: "Outstanding" },
      EXCELLENT: { color: "bg-green-500", text: "Excellent" },
      GOOD: { color: "bg-blue-500", text: "Good" },
      SATISFACTORY: { color: "bg-yellow-500", text: "Satisfactory" },
      NEEDS_IMPROVEMENT: { color: "bg-orange-500", text: "Needs Improvement" },
      UNSATISFACTORY: { color: "bg-red-500", text: "Unsatisfactory" },
    };

    const { color, text } = config[rating] || {
      color: "bg-gray-500",
      text: rating,
    };
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Star className="w-3 h-3 fill-white" />
        {text} ({score}%)
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-purple-600";
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesStatus =
      filterStatus === "ALL" || review.status === filterStatus;
    const matchesSearch =
      review.reviewNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            <Award className="w-8 h-8 text-indigo-600" />
            Supplier Performance Reviews
          </h1>
          <p className="text-muted-foreground">
            Quarterly and annual vendor performance evaluations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReviews} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/performance-reviews/create">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Create Review
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
                Average Score
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalReviews} reviews completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Star className="h-4 w-4 text-purple-600 fill-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.outstandingVendors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Top-performing vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improving</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.trendsImproving}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Positive trend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Needs Attention
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.needsImprovementVendors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires improvement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by review # or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {["ALL", "IN_PROGRESS", "COMPLETED", "REQUIRES_ACTION"].map(
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

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                No performance reviews found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first performance review to evaluate vendor performance"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {review.reviewNumber}
                      </h3>
                      {getStatusBadge(review.status)}
                      {getRatingBadge(review.rating, review.overallScore)}
                    </div>
                    <p className="text-muted-foreground mb-3">
                      <strong>Vendor:</strong> {review.vendor.name} •{" "}
                      {review.reviewPeriod}
                    </p>

                    {/* Overall Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Overall Performance
                        </span>
                        <span
                          className={`text-lg font-bold ${getScoreColor(review.overallScore)}`}
                        >
                          {review.overallScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            review.overallScore >= 90
                              ? "bg-purple-600"
                              : review.overallScore >= 80
                                ? "bg-green-600"
                                : review.overallScore >= 70
                                  ? "bg-blue-600"
                                  : review.overallScore >= 60
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                          }`}
                          style={{ width: `${review.overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">Quality</p>
                        <p
                          className={`font-bold text-lg ${getScoreColor(review.qualityScore)}`}
                        >
                          {review.qualityScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          30% weight
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          Delivery
                        </p>
                        <p
                          className={`font-bold text-lg ${getScoreColor(review.deliveryScore)}`}
                        >
                          {review.deliveryScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          25% weight
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          Response
                        </p>
                        <p
                          className={`font-bold text-lg ${getScoreColor(review.responsivenessScore)}`}
                        >
                          {review.responsivenessScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          20% weight
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">Pricing</p>
                        <p
                          className={`font-bold text-lg ${getScoreColor(review.pricingScore)}`}
                        >
                          {review.pricingScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          15% weight
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground text-xs">
                          Compliance
                        </p>
                        <p
                          className={`font-bold text-lg ${getScoreColor(review.complianceScore)}`}
                        >
                          {review.complianceScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          10% weight
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Review Period:{" "}
                      {new Date(review.periodStart).toLocaleDateString()} -{" "}
                      {new Date(review.periodEnd).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/dashboard/qc/performance-reviews/${review.id}`}>
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
      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Award className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">
                Performance Scoring Methodology
              </h3>
              <p className="text-sm text-indigo-800 mb-3">
                Vendor performance is evaluated quarterly using weighted
                criteria. Overall scores are automatically calculated based on
                individual category performance with predefined weights.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-white/50 p-2 rounded">
                  <strong>Quality:</strong> 30%
                  <br />
                  Defect rates, QC pass rates
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Delivery:</strong> 25%
                  <br />
                  On-time, fill rates
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Responsiveness:</strong> 20%
                  <br />
                  Communication, issue resolution
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Pricing:</strong> 15%
                  <br />
                  Competitiveness, stability
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Compliance:</strong> 10%
                  <br />
                  Documentation, standards
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
