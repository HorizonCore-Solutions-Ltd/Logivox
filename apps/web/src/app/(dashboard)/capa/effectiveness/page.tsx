"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface EffectivenessApiItem {
  capaId: string;
  capaNumber: string;
  closedDate: string;
  monitoringDays: number;
  recurrenceDetected: boolean;
  effectivenessScore: number;
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  relatedIncidents: number;
  recommendation: string;
}

function mapApiStatus(
  status: EffectivenessApiItem["verificationStatus"],
  score: number,
): EffectivenessReview["status"] {
  if (status === "PENDING") return "PENDING";
  if (status === "FAILED") {
    return score > 0 && score < 70 ? "PARTIALLY_EFFECTIVE" : "INEFFECTIVE";
  }
  if (status === "PASSED") return "EFFECTIVE";
  return "IN_REVIEW";
}

export default function EffectivenessPage() {
  const [reviews, setReviews] = useState<EffectivenessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        setError(null);
        const response = await fetch("/api/capa/effectiveness", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load CAPA effectiveness data",
          );
        }

        const list: EffectivenessApiItem[] = Array.isArray(
          data.effectivenessData,
        )
          ? data.effectivenessData
          : [];

        setReviews(
          list.map((item) => {
            const mappedStatus = mapApiStatus(
              item.verificationStatus,
              item.effectivenessScore,
            );

            return {
              id: item.capaId,
              capaId: item.capaId,
              capaNumber: item.capaNumber,
              capaTitle: item.recommendation,
              reviewDate:
                item.verificationStatus === "PENDING"
                  ? ""
                  : new Date().toISOString(),
              dueDate: new Date(
                new Date(item.closedDate).getTime() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              status: mappedStatus,
              score: item.effectivenessScore ?? null,
              reviewer: null,
              criteria: [
                {
                  name: "Recurrence prevented",
                  met: !item.recurrenceDetected,
                  notes: item.recommendation,
                },
                {
                  name: "Effectiveness threshold met",
                  met: item.effectivenessScore >= 70,
                  notes: `Score: ${item.effectivenessScore}%`,
                },
                {
                  name: "Monitoring complete",
                  met: item.monitoringDays >= 30,
                  notes: `${item.monitoringDays} day(s) monitored`,
                },
              ],
              recurrenceCount: item.relatedIncidents,
              notes: item.recommendation,
            };
          }),
        );
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Failed to load CAPA effectiveness data");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    void loadReviews();
    return () => controller.abort();
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

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

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
