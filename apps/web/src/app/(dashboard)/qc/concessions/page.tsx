"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Concession {
  id: string;
  concessionNumber: string;
  title: string;
  description: string;
  partNumber: string;
  affectedQty: number;
  nonConformanceDescription: string;
  justification: string;
  riskAssessment: string;
  requestedBy: string;
  approvedBy: string | null;
  customerApprovalRequired: boolean;
  customerApproved: boolean | null;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  validUntil: string | null;
  createdAt: string;
}

const MOCK: Concession[] = [
  {
    id: "1",
    concessionNumber: "CON-2026-001",
    title: "Use-as-is for minor surface scratch on PN-PANEL-01",
    description:
      "Cosmetic scratch below workmanship standard but within functional limits.",
    partNumber: "PN-PANEL-01",
    affectedQty: 25,
    nonConformanceDescription:
      "0.8mm scratch on non-mating surface, Spec = No marks visible.",
    justification:
      "Scratch is on internal non-mating surface. Functional testing passed. Engineering confirms no performance impact.",
    riskAssessment: "LOW — cosmetic only, no structural or functional impact.",
    requestedBy: "Production Lead",
    approvedBy: "QA Manager",
    customerApprovalRequired: false,
    customerApproved: null,
    status: "APPROVED",
    validUntil: "2026-06-30",
    createdAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "2",
    concessionNumber: "CON-2026-002",
    title: "Temporary use of alternate sealant compound",
    description:
      "Approved sealant out of stock — requesting concession for alternate.",
    partNumber: "PROCESS-SEAL-LINE-3",
    affectedQty: 100,
    nonConformanceDescription:
      "Sealant Compound-A (approved) substituted with Compound-B (not on approved list).",
    justification:
      "Compound-B has equivalent viscosity and cure profile. Material Safety Data confirms compatibility.",
    riskAssessment: "MEDIUM — requires monitoring for 30 days post-release.",
    requestedBy: "Process Engineer",
    approvedBy: null,
    customerApprovalRequired: true,
    customerApproved: null,
    status: "PENDING_REVIEW",
    validUntil: null,
    createdAt: "2026-03-01T09:30:00Z",
  },
];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-200 text-gray-500",
};

export default function ConcessionsPage() {
  const router = useRouter();
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/concessions")
      .then((r) => r.json())
      .then((d) =>
        setConcessions(
          Array.isArray(d.concessions ?? d) ? (d.concessions ?? d) : MOCK,
        ),
      )
      .catch(() => setConcessions(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? concessions
      : concessions.filter((c) => c.status === filter);

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
              Concessions & Deviations
            </h1>
            <p className="mt-1 text-gray-600">
              Request and track approved waivers for use-as-is non-conformances.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Concession
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: concessions.length,
              color: "text-gray-900",
            },
            {
              label: "Pending Review",
              value: concessions.filter((c) => c.status === "PENDING_REVIEW")
                .length,
              color: "text-yellow-600",
            },
            {
              label: "Approved",
              value: concessions.filter((c) => c.status === "APPROVED").length,
              color: "text-green-600",
            },
            {
              label: "Customer Approval Req.",
              value: concessions.filter((c) => c.customerApprovalRequired)
                .length,
              color: "text-blue-600",
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
            "APPROVED",
            "REJECTED",
            "EXPIRED",
            "DRAFT",
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

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Loading concessions…
            </div>
          ) : (
            filtered.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">
                          {c.concessionNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[c.status]}`}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                        {c.customerApprovalRequired && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${c.customerApproved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                          >
                            Customer Approval:{" "}
                            {c.customerApproved ? "Granted" : "Pending"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {c.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Non-conformance:</strong>{" "}
                        {c.nonConformanceDescription}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Justification:</strong> {c.justification}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Risk:</strong> {c.riskAssessment}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                        <span>Part: {c.partNumber}</span>
                        <span>Qty: {c.affectedQty}</span>
                        <span>By: {c.requestedBy}</span>
                        {c.approvedBy && (
                          <span>Approved by: {c.approvedBy}</span>
                        )}
                        {c.validUntil && (
                          <span>
                            Valid until:{" "}
                            {new Date(c.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {new Date(c.createdAt).toLocaleDateString()}
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
