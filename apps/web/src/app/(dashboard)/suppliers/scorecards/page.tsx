"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  PackageCheck,
  Truck,
  ShieldCheck,
  MessageSquare,
  DollarSign,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SupplierScore {
  quality: number;
  delivery: number;
  compliance: number;
  responsiveness: number;
  pricing: number;
  overall: number;
}

interface SupplierRanking {
  rank: number;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  scores: SupplierScore;
}

interface TrendPoint {
  period: string;
  overall: number;
  scores: SupplierScore;
}

interface DetailData {
  scorecard: {
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    scores: SupplierScore;
    metrics: {
      totalPOs: number;
      onTimePOs: number;
      totalInspections: number;
      passedInspections: number;
      totalNCRs: number;
      openNCRs: number;
      avgNCRResolutionDays: number | null;
      totalComplianceChecks: number;
      passedComplianceChecks: number;
      lastReviewDate: string | null;
    };
    grade: string;
    trend: string;
  };
  trend: TrendPoint[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-200",
  B: "bg-blue-100 text-blue-800 border-blue-200",
  C: "bg-yellow-100 text-yellow-800 border-yellow-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  F: "bg-red-100 text-red-800 border-red-200",
};

const SCORE_DIMENSIONS = [
  { key: "quality", label: "Quality", icon: PackageCheck, weight: "30%" },
  { key: "delivery", label: "Delivery", icon: Truck, weight: "30%" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, weight: "20%" },
  {
    key: "responsiveness",
    label: "Responsiveness",
    icon: MessageSquare,
    weight: "10%",
  },
  { key: "pricing", label: "Pricing", icon: DollarSign, weight: "10%" },
] as const;

function scoreColor(v: number): string {
  if (v >= 90) return "text-green-600";
  if (v >= 80) return "text-blue-600";
  if (v >= 70) return "text-yellow-600";
  if (v >= 60) return "text-orange-600";
  return "text-red-600";
}

function scoreBarColor(v: number): string {
  if (v >= 90) return "bg-green-500";
  if (v >= 80) return "bg-blue-500";
  if (v >= 70) return "bg-yellow-500";
  if (v >= 60) return "bg-orange-500";
  return "bg-red-500";
}

// ── Mini chart ────────────────────────────────────────────────────────────────

function SparkLine({ points }: { points: number[] }) {
  if (points.length < 2)
    return <span className="text-xs text-muted-foreground">—</span>;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={coords}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SupplierScorecardPage() {
  const [rankings, setRankings] = useState<SupplierRanking[]>([]);
  const [filteredRankings, setFilteredRankings] = useState<SupplierRanking[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [period, setPeriod] = useState("90");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, DetailData>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000,
      );
      const res = await fetch(
        `/api/suppliers/scorecards?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setRankings(data ?? []);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  useEffect(() => {
    let list = rankings;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.supplierName.toLowerCase().includes(q) ||
          r.supplierCode.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "ALL") {
      list = list.filter((r) => r.grade === gradeFilter);
    }
    setFilteredRankings(list);
  }, [rankings, search, gradeFilter]);

  const fetchDetail = async (supplierId: string) => {
    if (detailData[supplierId]) return;
    setDetailLoading(supplierId);
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000,
      );
      const res = await fetch(
        `/api/suppliers/scorecards?supplierId=${supplierId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setDetailData((prev) => ({ ...prev, [supplierId]: data }));
    } catch {
      // silent
    } finally {
      setDetailLoading(null);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  // Summary stats
  const aGrade = rankings.filter((r) => r.grade === "A").length;
  const avgScore =
    rankings.length > 0
      ? Math.round(
          rankings.reduce((s, r) => s + r.overallScore, 0) / rankings.length,
        )
      : 0;
  const atRisk = rankings.filter(
    (r) => r.grade === "D" || r.grade === "F",
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Supplier Scorecards
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated quality, delivery, and compliance scoring across your
            supplier base
          </p>
        </div>
        <Button variant="outline" onClick={fetchRankings} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Suppliers</p>
            <p className="text-2xl font-bold">{rankings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className={`text-2xl font-bold ${scoreColor(avgScore)}`}>
              {avgScore}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Grade A Suppliers</p>
            <p className="text-2xl font-bold text-green-600">{aGrade}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              At Risk (D/F)
            </p>
            <p className="text-2xl font-bold text-red-600">{atRisk}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search supplier…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Grades</SelectItem>
            {["A", "B", "C", "D", "F"].map((g) => (
              <SelectItem key={g} value={g}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rankings table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-16" />
          ))}
        </div>
      ) : filteredRankings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium">No scorecards found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add suppliers and record POs, inspections, and compliance checks
              to generate scores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredRankings.map((r) => (
            <Card key={r.supplierId} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Main row */}
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                    #{r.rank}
                  </div>

                  {/* Supplier info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.supplierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.supplierCode}
                    </p>
                  </div>

                  {/* Score bars */}
                  <div className="hidden md:flex gap-3 flex-1 max-w-lg">
                    {SCORE_DIMENSIONS.map((dim) => (
                      <div key={dim.key} className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          {dim.label}
                        </p>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBarColor(r.scores[dim.key])}`}
                            style={{ width: `${r.scores[dim.key]}%` }}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-medium mt-0.5 ${scoreColor(r.scores[dim.key])}`}
                        >
                          {r.scores[dim.key]}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Overall + grade */}
                  <div className="text-center w-16">
                    <p
                      className={`text-xl font-bold ${scoreColor(r.overallScore)}`}
                    >
                      {r.overallScore}
                    </p>
                    <Badge
                      className={`text-xs mt-0.5 ${GRADE_COLORS[r.grade]}`}
                      variant="outline"
                    >
                      Grade {r.grade}
                    </Badge>
                  </div>

                  {/* Expand */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExpand(r.supplierId)}
                  >
                    {expandedId === r.supplierId ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded detail */}
                {expandedId === r.supplierId && (
                  <div className="mt-4 border-t pt-4">
                    {detailLoading === r.supplierId ? (
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Loading detail…
                      </p>
                    ) : detailData[r.supplierId] ? (
                      <SupplierDetail data={detailData[r.supplierId]} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Unable to load detail.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Supplier Detail Sub-component ─────────────────────────────────────────────

function SupplierDetail({ data }: { data: DetailData }) {
  const { scorecard, trend } = data;
  const trendPoints = trend.map((t) => t.overall);

  const TrendIcon =
    scorecard.trend === "IMPROVING"
      ? TrendingUp
      : scorecard.trend === "DECLINING"
        ? TrendingDown
        : Minus;
  const trendColor =
    scorecard.trend === "IMPROVING"
      ? "text-green-600"
      : scorecard.trend === "DECLINING"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Scores breakdown */}
      <div>
        <p className="text-sm font-semibold mb-3">Score Breakdown</p>
        <div className="space-y-2">
          {SCORE_DIMENSIONS.map((dim) => (
            <div key={dim.key} className="flex items-center gap-2">
              <dim.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs w-24 text-muted-foreground">
                {dim.label}
              </span>
              <Progress
                value={scorecard.scores[dim.key]}
                className="flex-1 h-2"
              />
              <span
                className={`text-xs font-bold w-8 text-right ${scoreColor(scorecard.scores[dim.key])}`}
              >
                {scorecard.scores[dim.key]}
              </span>
              <span className="text-[10px] text-muted-foreground w-10">
                ({dim.weight})
              </span>
            </div>
          ))}
        </div>

        {/* Trend */}
        <div className="mt-4 flex items-center gap-2">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={`text-sm font-medium ${trendColor}`}>
            {scorecard.trend.replace("_", " ")}
          </span>
          <SparkLine points={trendPoints} />
        </div>
      </div>

      {/* Metrics */}
      <div>
        <p className="text-sm font-semibold mb-3">Activity Metrics</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Purchase Orders", scorecard.metrics.totalPOs],
            ["On-Time POs", scorecard.metrics.onTimePOs],
            ["Inspections", scorecard.metrics.totalInspections],
            ["Passed Inspections", scorecard.metrics.passedInspections],
            ["NCRs Raised", scorecard.metrics.totalNCRs],
            ["Open NCRs", scorecard.metrics.openNCRs],
            [
              "Avg NCR Close (days)",
              scorecard.metrics.avgNCRResolutionDays ?? "N/A",
            ],
            ["Compliance Checks", scorecard.metrics.totalComplianceChecks],
            ["Passed Checks", scorecard.metrics.passedComplianceChecks],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
        {scorecard.metrics.lastReviewDate && (
          <p className="text-xs text-muted-foreground mt-2">
            Last performance review:{" "}
            {new Date(scorecard.metrics.lastReviewDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Trend table */}
      {trend.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-sm font-semibold mb-2">6-Month Trend</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {trend.map((t) => (
              <div
                key={t.period}
                className="flex-shrink-0 text-center border rounded-md p-2 w-20"
              >
                <p className="text-[10px] text-muted-foreground">{t.period}</p>
                <p className={`text-lg font-bold ${scoreColor(t.overall)}`}>
                  {t.overall}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
