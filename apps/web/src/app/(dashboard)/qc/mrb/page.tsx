"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MRBItem {
  id: string;
  mrbNumber: string;
  sku: string;
  itemName: string;
  quantity: number;
  nonConformanceReason: string;
  proposedDisposition:
    | "USE_AS_IS"
    | "REWORK"
    | "SCRAP"
    | "RETURN_TO_VENDOR"
    | "PENDING";
  finalDisposition:
    | "USE_AS_IS"
    | "REWORK"
    | "SCRAP"
    | "RETURN_TO_VENDOR"
    | null;
  status: "PENDING_REVIEW" | "IN_REVIEW" | "DISPOSITIONED" | "CLOSED";
  reviewBoard: string[];
  createdAt: string;
  dispositionedAt: string | null;
  notes: string | null;
  estimatedScrapCost: number | null;
}

const MOCK: MRBItem[] = [
  {
    id: "1",
    mrbNumber: "MRB-2026-001",
    sku: "SKU-GEAR-X4",
    itemName: "Helical Gear X4",
    quantity: 30,
    nonConformanceReason: "Pitch diameter 0.15mm beyond tolerance",
    proposedDisposition: "REWORK",
    finalDisposition: "REWORK",
    status: "DISPOSITIONED",
    reviewBoard: ["QA Manager", "Engineering", "Production"],
    createdAt: "2026-02-20T09:00:00Z",
    dispositionedAt: "2026-02-24T14:00:00Z",
    notes: "Rework approved. Return to grinding operation.",
    estimatedScrapCost: 4500,
  },
  {
    id: "2",
    mrbNumber: "MRB-2026-002",
    sku: "SKU-SEAL-B2",
    itemName: "O-Ring Seal B2",
    quantity: 500,
    nonConformanceReason: "Wrong durometer — 70A received, 80A specified",
    proposedDisposition: "RETURN_TO_VENDOR",
    finalDisposition: null,
    status: "IN_REVIEW",
    reviewBoard: ["QA Manager", "Purchasing"],
    createdAt: "2026-03-01T10:30:00Z",
    dispositionedAt: null,
    notes: null,
    estimatedScrapCost: 800,
  },
  {
    id: "3",
    mrbNumber: "MRB-2026-003",
    sku: "SKU-FRAME-01",
    itemName: "Main Frame Assembly",
    quantity: 2,
    nonConformanceReason: "Weld porosity detected by X-ray",
    proposedDisposition: "SCRAP",
    finalDisposition: "SCRAP",
    status: "CLOSED",
    reviewBoard: ["QA Manager", "Engineering", "Finance"],
    createdAt: "2026-01-15T08:00:00Z",
    dispositionedAt: "2026-01-20T16:00:00Z",
    notes: "Scrapped. Root cause: insufficient pre-heat.",
    estimatedScrapCost: 12000,
  },
];

const DISP_COLOR: Record<string, string> = {
  USE_AS_IS: "bg-green-100 text-green-700",
  REWORK: "bg-blue-100 text-blue-700",
  SCRAP: "bg-red-100 text-red-700",
  RETURN_TO_VENDOR: "bg-orange-100 text-orange-700",
  PENDING: "bg-gray-100 text-gray-600",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  DISPOSITIONED: "bg-purple-100 text-purple-700",
  CLOSED: "bg-green-100 text-green-700",
};

export default function MRBPage() {
  const router = useRouter();
  const [items, setItems] = useState<MRBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/mrb")
      .then((r) => r.json())
      .then((d) =>
        setItems(Array.isArray(d.items ?? d) ? (d.items ?? d) : MOCK),
      )
      .catch(() => setItems(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const totalCost = items.reduce((s, i) => s + (i.estimatedScrapCost ?? 0), 0);
  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

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
              Material Review Board
            </h1>
            <p className="mt-1 text-gray-600">
              Cross-functional disposition of non-conforming materials.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Submit to MRB
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Items",
              value: items.length,
              color: "text-gray-900",
            },
            {
              label: "In Review",
              value: items.filter(
                (i) =>
                  i.status === "IN_REVIEW" || i.status === "PENDING_REVIEW",
              ).length,
              color: "text-blue-600",
            },
            {
              label: "Dispositioned",
              value: items.filter(
                (i) => i.status === "DISPOSITIONED" || i.status === "CLOSED",
              ).length,
              color: "text-green-600",
            },
            {
              label: "Est. Scrap Cost",
              value: `$${totalCost.toLocaleString()}`,
              color: "text-red-600",
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
          {[
            "all",
            "PENDING_REVIEW",
            "IN_REVIEW",
            "DISPOSITIONED",
            "CLOSED",
          ].map((s) => (
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
              Loading MRB items…
            </div>
          ) : (
            filtered.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">
                          {item.mrbNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[item.status]}`}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                        {item.finalDisposition && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DISP_COLOR[item.finalDisposition]}`}
                          >
                            {item.finalDisposition.replace(/_/g, " ")}
                          </span>
                        )}
                        {!item.finalDisposition && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DISP_COLOR[item.proposedDisposition]}`}
                          >
                            Proposed:{" "}
                            {item.proposedDisposition.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.itemName}{" "}
                        <span className="text-gray-500 font-mono text-sm">
                          ({item.sku})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.nonConformanceReason}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                        <span>
                          Qty: <strong>{item.quantity}</strong>
                        </span>
                        {item.estimatedScrapCost && (
                          <span>
                            Est. Cost:{" "}
                            <strong className="text-red-600">
                              ${item.estimatedScrapCost.toLocaleString()}
                            </strong>
                          </span>
                        )}
                        <span>Board: {item.reviewBoard.join(", ")}</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      {item.dispositionedAt && (
                        <div className="text-green-600 mt-0.5">
                          Dispositioned{" "}
                          {new Date(item.dispositionedAt).toLocaleDateString()}
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
