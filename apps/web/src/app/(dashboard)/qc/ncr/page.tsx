"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

interface NCR {
  id: string;
  ncrNumber: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  status: "OPEN" | "UNDER_REVIEW" | "DISPOSITIONED" | "CLOSED";
  disposition: "USE_AS_IS" | "REWORK" | "SCRAP" | "RETURN_TO_VENDOR" | null;
  reportedBy: string;
  assignedTo: string | null;
  affectedItem: string;
  quantity: number;
  createdAt: string;
  closedAt: string | null;
}

const SEV_CONFIG: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
  MAJOR: "bg-orange-100 text-orange-700 border border-orange-200",
  MINOR: "bg-yellow-100 text-yellow-700 border border-yellow-200",
};

const STATUS_CONFIG: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  DISPOSITIONED: "bg-yellow-50 text-yellow-700",
  CLOSED: "bg-green-50 text-green-700",
};

const MOCK: NCR[] = [
  {
    id: "1",
    ncrNumber: "NCR-2026-001",
    title: "Surface contamination on batch B-2241",
    description: "Visual inspection revealed oil contamination on 12 units.",
    severity: "MAJOR",
    status: "UNDER_REVIEW",
    disposition: null,
    reportedBy: "QC Inspector",
    assignedTo: "Quality Manager",
    affectedItem: "Assembly-A01",
    quantity: 12,
    createdAt: "2026-02-28T08:00:00Z",
    closedAt: null,
  },
  {
    id: "2",
    ncrNumber: "NCR-2026-002",
    title: "Dimension out of tolerance — shaft diameter",
    description: "Shaft diameter measured 15.12mm vs spec 15.00±0.05mm.",
    severity: "CRITICAL",
    status: "DISPOSITIONED",
    disposition: "REWORK",
    reportedBy: "Line Inspector",
    assignedTo: "Production Lead",
    affectedItem: "Shaft-300",
    quantity: 5,
    createdAt: "2026-02-20T14:30:00Z",
    closedAt: null,
  },
  {
    id: "3",
    ncrNumber: "NCR-2026-003",
    title: "Minor label misprint",
    description: "Date code printed incorrectly on label batch.",
    severity: "MINOR",
    status: "CLOSED",
    disposition: "USE_AS_IS",
    reportedBy: "Shipping QC",
    assignedTo: null,
    affectedItem: "Label-L100",
    quantity: 200,
    createdAt: "2026-02-10T09:00:00Z",
    closedAt: "2026-02-12T11:00:00Z",
  },
];

export default function NCRPage() {
  const router = useRouter();
  const [records, setRecords] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/ncr")
      .then((r) => r.json())
      .then((d) =>
        setRecords(Array.isArray(d.ncrs ?? d) ? (d.ncrs ?? d) : MOCK),
      )
      .catch(() => setRecords(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: records.length,
    open: records.filter((r) => r.status === "OPEN").length,
    critical: records.filter((r) => r.severity === "CRITICAL").length,
    closed: records.filter((r) => r.status === "CLOSED").length,
  };
  const filtered =
    filter === "all" ? records : records.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/qc")}
              className="text-sm text-blue-600 hover:underline mb-1"
            >
              ← Quality Control
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Non-Conformance Reports
            </h1>
            <p className="mt-1 text-gray-600">
              Create and track non-conforming material reports through
              disposition.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New NCR
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total NCRs", value: stats.total, color: "text-gray-900" },
            { label: "Open", value: stats.open, color: "text-red-600" },
            { label: "Critical", value: stats.critical, color: "text-red-700" },
            { label: "Closed", value: stats.closed, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 flex-wrap">
          {["all", "OPEN", "UNDER_REVIEW", "DISPOSITIONED", "CLOSED"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ),
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Loading NCRs…
            </div>
          ) : (
            filtered.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-mono text-gray-500">
                          {r.ncrNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEV_CONFIG[r.severity]}`}
                        >
                          {r.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[r.status]}`}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                        {r.disposition && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                            {r.disposition.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {r.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {r.description}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          Item:{" "}
                          <span className="font-medium text-gray-700">
                            {r.affectedItem}
                          </span>
                        </span>
                        <span>
                          Qty:{" "}
                          <span className="font-medium text-gray-700">
                            {r.quantity}
                          </span>
                        </span>
                        <span>
                          Reported by:{" "}
                          <span className="font-medium text-gray-700">
                            {r.reportedBy}
                          </span>
                        </span>
                        {r.assignedTo && (
                          <span>
                            Assigned:{" "}
                            <span className="font-medium text-gray-700">
                              {r.assignedTo}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                      <div>{new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.closedAt && (
                        <div className="text-green-600 mt-0.5">
                          Closed {new Date(r.closedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
