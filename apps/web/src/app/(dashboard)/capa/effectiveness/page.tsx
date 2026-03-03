"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface EffectivenessReview {
  id: string;
  capaId: string;
  capaNumber: string;
  capaTitle: string;
  reviewDate: string;
  dueDate: string;
  status:
    | "PENDING"
    | "IN_REVIEW"
    | "EFFECTIVE"
    | "INEFFECTIVE"
    | "PARTIALLY_EFFECTIVE";
  score: number | null;
  reviewer: string | null;
  criteria: {
    name: string;
    met: boolean | null;
    notes: string;
  }[];
  recurrenceCount: number;
  notes: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
  },
  EFFECTIVE: {
    label: "Effective",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  INEFFECTIVE: {
    label: "Ineffective",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  PARTIALLY_EFFECTIVE: {
    label: "Partially Effective",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
};

const MOCK_REVIEWS: EffectivenessReview[] = [
  {
    id: "1",
    capaId: "c1",
    capaNumber: "CAPA-2026-001",
    capaTitle: "Reduce packaging defect rate",
    reviewDate: "2026-03-01",
    dueDate: "2026-03-15",
    status: "EFFECTIVE",
    score: 92,
    reviewer: "Jane Smith",
    recurrenceCount: 0,
    notes: "Defect rate reduced from 4.2% to 0.8% — target met.",
    criteria: [
      { name: "Root cause eliminated", met: true, notes: "" },
      { name: "Recurrence prevented", met: true, notes: "" },
      { name: "Process documented", met: true, notes: "" },
    ],
  },
  {
    id: "2",
    capaId: "c2",
    capaNumber: "CAPA-2026-003",
    capaTitle: "Supplier delivery variance correction",
    reviewDate: "2026-03-01",
    dueDate: "2026-03-20",
    status: "PARTIALLY_EFFECTIVE",
    score: 65,
    reviewer: "Mark Johnson",
    recurrenceCount: 2,
    notes:
      "Delivery times improved but variance window still exceeds SLA by 1 day.",
    criteria: [
      { name: "Root cause eliminated", met: true, notes: "" },
      {
        name: "Recurrence prevented",
        met: false,
        notes: "2 recurrences in past 30 days",
      },
      { name: "Process documented", met: true, notes: "" },
    ],
  },
  {
    id: "3",
    capaId: "c3",
    capaNumber: "CAPA-2026-005",
    capaTitle: "Calibration non-conformance resolution",
    reviewDate: "",
    dueDate: "2026-03-25",
    status: "PENDING",
    score: null,
    reviewer: null,
    recurrenceCount: 0,
    notes: null,
    criteria: [
      { name: "Root cause eliminated", met: null, notes: "" },
      { name: "Recurrence prevented", met: null, notes: "" },
      { name: "Process documented", met: null, notes: "" },
    ],
  },
];

export default function EffectivenessPage() {
  const [reviews, setReviews] = useState<EffectivenessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Attempt real API, fall back to mock data
    fetch("/api/capa/effectiveness")
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : MOCK_REVIEWS);
      })
      .catch(() => setReviews(MOCK_REVIEWS))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const stats = {
    total: reviews.length,
    effective: reviews.filter((r) => r.status === "EFFECTIVE").length,
    ineffective: reviews.filter((r) => r.status === "INEFFECTIVE").length,
    pending: reviews.filter((r) => r.status === "PENDING").length,
    avgScore:
      reviews.filter((r) => r.score !== null).length > 0
        ? Math.round(
            reviews
              .filter((r) => r.score !== null)
              .reduce((sum, r) => sum + (r.score ?? 0), 0) /
              reviews.filter((r) => r.score !== null).length,
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            CAPA Effectiveness Reviews
          </h1>
          <p className="mt-2 text-gray-600">
            Verify that corrective and preventive actions have resolved root
            causes and prevented recurrence.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Effective</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.effective}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ineffective</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.ineffective}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.avgScore}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-2">
          {[
            "all",
            "PENDING",
            "IN_REVIEW",
            "EFFECTIVE",
            "PARTIALLY_EFFECTIVE",
            "INEFFECTIVE",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            Loading effectiveness reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            No reviews match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((review) => {
              const cfg = STATUS_CONFIG[review.status];
              const Icon = cfg.icon;
              return (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start p-6 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-mono text-gray-500">
                            {review.capaNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          {review.score !== null && (
                            <span className="text-sm font-semibold text-gray-700">
                              Score: {review.score}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          {review.capaTitle}
                        </h3>

                        {/* Criteria */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {review.criteria.map((c, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                c.met === true
                                  ? "bg-green-50 text-green-700"
                                  : c.met === false
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-50 text-gray-500"
                              }`}
                            >
                              {c.met === true ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : c.met === false ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {c.name}
                            </span>
                          ))}
                        </div>

                        {review.notes && (
                          <p className="text-sm text-gray-600">
                            {review.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                        {review.reviewer && (
                          <div className="mb-1">
                            Reviewer: {review.reviewer}
                          </div>
                        )}
                        <div>
                          Due: {new Date(review.dueDate).toLocaleDateString()}
                        </div>
                        {review.recurrenceCount > 0 && (
                          <div className="text-orange-600 font-medium mt-1">
                            {review.recurrenceCount} recurrence(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
