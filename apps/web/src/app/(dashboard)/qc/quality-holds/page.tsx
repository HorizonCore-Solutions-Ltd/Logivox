"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lock, Unlock } from "lucide-react";

interface QualityHold {
  id: string;
  holdNumber: string;
  reason: string;
  sku: string;
  itemName: string;
  quantity: number;
  location: string;
  status: "ACTIVE" | "RELEASED" | "SCRAPPED" | "REWORKED";
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  heldBy: string;
  releasedBy: string | null;
  createdAt: string;
  releasedAt: string | null;
  notes: string | null;
}

const MOCK: QualityHold[] = [
  {
    id: "1",
    holdNumber: "QH-2026-001",
    reason: "Failed incoming inspection — dimension OOT",
    sku: "SKU-SHAFT-300",
    itemName: "Drive Shaft 300mm",
    quantity: 50,
    location: "HOLD-ZONE-A",
    status: "ACTIVE",
    severity: "MAJOR",
    heldBy: "QC Inspector",
    releasedBy: null,
    createdAt: "2026-02-25T10:00:00Z",
    releasedAt: null,
    notes: "Awaiting supplier response",
  },
  {
    id: "2",
    holdNumber: "QH-2026-002",
    reason: "Possible cross-contamination during packaging",
    sku: "SKU-PACK-B10",
    itemName: "Packaging B10",
    quantity: 200,
    location: "HOLD-ZONE-B",
    status: "SCRAPPED",
    severity: "CRITICAL",
    heldBy: "Production Supervisor",
    releasedBy: "QA Manager",
    createdAt: "2026-02-18T09:30:00Z",
    releasedAt: "2026-02-22T14:00:00Z",
    notes: "Full batch scrapped per QA decision",
  },
  {
    id: "3",
    holdNumber: "QH-2026-003",
    reason: "Minor label error — date code format",
    sku: "SKU-LABEL-100",
    itemName: "Product Label v4",
    quantity: 1000,
    location: "HOLD-ZONE-A",
    status: "RELEASED",
    severity: "MINOR",
    heldBy: "QC Tech",
    releasedBy: "QA Lead",
    createdAt: "2026-02-10T13:00:00Z",
    releasedAt: "2026-02-11T09:00:00Z",
    notes: "Released after relabeling",
  },
];

const STATUS_CONFIG: Record<string, string> = {
  ACTIVE: "bg-red-100 text-red-700",
  RELEASED: "bg-green-100 text-green-700",
  SCRAPPED: "bg-gray-200 text-gray-600",
  REWORKED: "bg-blue-100 text-blue-700",
};

const SEV_CONFIG: Record<string, string> = {
  CRITICAL: "bg-red-200 text-red-800",
  MAJOR: "bg-orange-100 text-orange-700",
  MINOR: "bg-yellow-100 text-yellow-700",
};

export default function QualityHoldsPage() {
  const router = useRouter();
  const [holds, setHolds] = useState<QualityHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/quality-holds")
      .then((r) => r.json())
      .then((d) =>
        setHolds(Array.isArray(d.holds ?? d) ? (d.holds ?? d) : MOCK),
      )
      .catch(() => setHolds(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: holds.length,
    active: holds.filter((h) => h.status === "ACTIVE").length,
    released: holds.filter((h) => h.status === "RELEASED").length,
    totalQty: holds.reduce((s, h) => s + h.quantity, 0),
  };
  const filtered =
    filter === "all" ? holds : holds.filter((h) => h.status === filter);

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
            <h1 className="text-3xl font-bold text-gray-900">Quality Holds</h1>
            <p className="mt-1 text-gray-600">
              Quarantine and manage non-conforming inventory pending
              disposition.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Place Hold
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Holds",
              value: stats.total,
              color: "text-gray-900",
            },
            { label: "Active", value: stats.active, color: "text-red-600" },
            {
              label: "Released",
              value: stats.released,
              color: "text-green-600",
            },
            {
              label: "Units on Hold",
              value: stats.totalQty.toLocaleString(),
              color: "text-orange-600",
            },
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
          {["all", "ACTIVE", "RELEASED", "SCRAPPED", "REWORKED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Loading quality holds…
            </div>
          ) : (
            filtered.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">
                          {h.holdNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEV_CONFIG[h.severity]}`}
                        >
                          {h.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[h.status]}`}
                        >
                          {h.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {h.itemName}{" "}
                        <span className="font-mono text-gray-500 text-sm">
                          ({h.sku})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{h.reason}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>
                          Qty:{" "}
                          <strong className="text-gray-700">
                            {h.quantity.toLocaleString()}
                          </strong>
                        </span>
                        <span>
                          Location:{" "}
                          <strong className="text-gray-700">
                            {h.location}
                          </strong>
                        </span>
                        <span>
                          Held by:{" "}
                          <strong className="text-gray-700">{h.heldBy}</strong>
                        </span>
                        {h.releasedBy && (
                          <span>
                            Released by:{" "}
                            <strong className="text-gray-700">
                              {h.releasedBy}
                            </strong>
                          </span>
                        )}
                      </div>
                      {h.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {h.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>{new Date(h.createdAt).toLocaleDateString()}</div>
                      {h.releasedAt && (
                        <div className="text-green-600 mt-0.5">
                          Released {new Date(h.releasedAt).toLocaleDateString()}
                        </div>
                      )}
                      {h.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 flex items-center gap-1 text-xs"
                        >
                          <Unlock className="h-3 w-3" /> Release
                        </Button>
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
