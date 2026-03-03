"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface QCDocument {
  id: string;
  documentNumber: string;
  title: string;
  type:
    | "SOP"
    | "WORK_INSTRUCTION"
    | "FORM"
    | "SPECIFICATION"
    | "POLICY"
    | "RECORD";
  revision: string;
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "OBSOLETE";
  approvedBy: string | null;
  reviewDueDate: string | null;
  trainedCount: number;
  totalRequired: number;
  department: string;
  createdAt: string;
  approvedAt: string | null;
}

const MOCK: QCDocument[] = [
  {
    id: "1",
    documentNumber: "SOP-QC-001",
    title: "Incoming Inspection Procedure",
    type: "SOP",
    revision: "Rev C",
    status: "APPROVED",
    approvedBy: "QA Manager",
    reviewDueDate: "2026-09-01",
    trainedCount: 12,
    totalRequired: 12,
    department: "Quality",
    createdAt: "2025-09-01T00:00:00Z",
    approvedAt: "2025-09-10T00:00:00Z",
  },
  {
    id: "2",
    documentNumber: "WI-QC-014",
    title: "CMM Operation Work Instruction",
    type: "WORK_INSTRUCTION",
    revision: "Rev A",
    status: "UNDER_REVIEW",
    approvedBy: null,
    reviewDueDate: null,
    trainedCount: 3,
    totalRequired: 8,
    department: "Metrology",
    createdAt: "2026-02-01T00:00:00Z",
    approvedAt: null,
  },
  {
    id: "3",
    documentNumber: "SPEC-PROD-203",
    title: "Surface Finish Specification",
    type: "SPECIFICATION",
    revision: "Rev B",
    status: "APPROVED",
    approvedBy: "Engineering Lead",
    reviewDueDate: "2027-01-01",
    trainedCount: 20,
    totalRequired: 20,
    department: "Engineering",
    createdAt: "2024-01-15T00:00:00Z",
    approvedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "4",
    documentNumber: "FORM-NCR-001",
    title: "NCR Initiation Form",
    type: "FORM",
    revision: "Rev D",
    status: "APPROVED",
    approvedBy: "QA Manager",
    reviewDueDate: "2026-06-01",
    trainedCount: 18,
    totalRequired: 25,
    department: "Quality",
    createdAt: "2024-06-01T00:00:00Z",
    approvedAt: "2024-06-15T00:00:00Z",
  },
];

const TYPE_COLOR: Record<string, string> = {
  SOP: "bg-blue-100 text-blue-700",
  WORK_INSTRUCTION: "bg-purple-100 text-purple-700",
  FORM: "bg-teal-100 text-teal-700",
  SPECIFICATION: "bg-orange-100 text-orange-700",
  POLICY: "bg-pink-100 text-pink-700",
  RECORD: "bg-gray-100 text-gray-600",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  OBSOLETE: "bg-red-100 text-red-600",
};

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<QCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/documents")
      .then((r) => r.json())
      .then((d) =>
        setDocs(Array.isArray(d.documents ?? d) ? (d.documents ?? d) : MOCK),
      )
      .catch(() => setDocs(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: docs.length,
    approved: docs.filter((d) => d.status === "APPROVED").length,
    review: docs.filter((d) => d.status === "UNDER_REVIEW").length,
    draft: docs.filter((d) => d.status === "DRAFT").length,
  };
  const filtered =
    filter === "all" ? docs : docs.filter((d) => d.status === filter);

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
              Quality Documents
            </h1>
            <p className="mt-1 text-gray-600">
              Manage SOPs, work instructions, specifications, forms, and
              policies.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Documents",
              value: stats.total,
              color: "text-gray-900",
            },
            {
              label: "Approved",
              value: stats.approved,
              color: "text-green-600",
            },
            {
              label: "Under Review",
              value: stats.review,
              color: "text-yellow-600",
            },
            { label: "Draft", value: stats.draft, color: "text-gray-500" },
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
          {["all", "APPROVED", "UNDER_REVIEW", "DRAFT", "OBSOLETE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading documents…
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Document #",
                    "Title",
                    "Type",
                    "Rev",
                    "Status",
                    "Department",
                    "Approved By",
                    "Review Due",
                    "Training",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">
                      {d.documentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px]">
                      {d.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLOR[d.type]}`}
                      >
                        {d.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {d.revision}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[d.status]}`}
                      >
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.approvedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.reviewDueDate
                        ? new Date(d.reviewDueDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={
                            d.trainedCount >= d.totalRequired
                              ? "text-green-600 font-semibold"
                              : "text-orange-600 font-semibold"
                          }
                        >
                          {d.trainedCount}/{d.totalRequired}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
