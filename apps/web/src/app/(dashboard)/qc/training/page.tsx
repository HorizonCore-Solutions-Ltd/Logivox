"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface TrainingRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  trainingTitle: string;
  trainingType: "SOP" | "SAFETY" | "QUALITY" | "REGULATORY" | "SKILLS";
  completedDate: string | null;
  expiryDate: string | null;
  status: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "NOT_STARTED";
  score: number | null;
  trainerName: string | null;
}

const MOCK: TrainingRecord[] = [
  {
    id: "1",
    employeeName: "Alex Torres",
    employeeId: "EMP-001",
    department: "Quality",
    trainingTitle: "Incoming Inspection SOP-QC-001",
    trainingType: "SOP",
    completedDate: "2025-06-01",
    expiryDate: "2026-06-01",
    status: "COMPLIANT",
    score: 95,
    trainerName: "QA Manager",
  },
  {
    id: "2",
    employeeName: "Jordan Kim",
    employeeId: "EMP-002",
    department: "Production",
    trainingTitle: "Lockout/Tagout Safety Procedure",
    trainingType: "SAFETY",
    completedDate: "2025-09-15",
    expiryDate: "2026-03-15",
    status: "EXPIRING_SOON",
    score: 88,
    trainerName: "EHS Manager",
  },
  {
    id: "3",
    employeeName: "Sam Lee",
    employeeId: "EMP-003",
    department: "Metrology",
    trainingTitle: "CMM Operation Work Instruction",
    trainingType: "SOP",
    completedDate: null,
    expiryDate: null,
    status: "NOT_STARTED",
    score: null,
    trainerName: null,
  },
  {
    id: "4",
    employeeName: "Chris Park",
    employeeId: "EMP-004",
    department: "Shipping",
    trainingTitle: "IATA Dangerous Goods Regulations",
    trainingType: "REGULATORY",
    completedDate: "2025-01-10",
    expiryDate: "2026-01-10",
    status: "EXPIRED",
    score: 78,
    trainerName: "External Trainer",
  },
];

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.FC<{ className?: string }> }
> = {
  COMPLIANT: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  EXPIRING_SOON: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  EXPIRED: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
  NOT_STARTED: { color: "bg-gray-100 text-gray-600", icon: Clock },
};

const TYPE_COLOR: Record<string, string> = {
  SOP: "bg-blue-100 text-blue-700",
  SAFETY: "bg-orange-100 text-orange-700",
  QUALITY: "bg-purple-100 text-purple-700",
  REGULATORY: "bg-red-100 text-red-700",
  SKILLS: "bg-teal-100 text-teal-700",
};

export default function TrainingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/training")
      .then((r) => r.json())
      .then((d) =>
        setRecords(Array.isArray(d.records ?? d) ? (d.records ?? d) : MOCK),
      )
      .catch(() => setRecords(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: records.length,
    compliant: records.filter((r) => r.status === "COMPLIANT").length,
    expiring: records.filter((r) => r.status === "EXPIRING_SOON").length,
    expired: records.filter((r) => r.status === "EXPIRED").length,
  };
  const filtered =
    filter === "all" ? records : records.filter((r) => r.status === filter);
  const complianceRate = records.length
    ? Math.round((stats.compliant / records.length) * 100)
    : 0;

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
              Training & Compliance
            </h1>
            <p className="mt-1 text-gray-600">
              Track employee training records, expiry dates, and compliance
              status.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Training
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total Records",
              value: records.length,
              color: "text-gray-900",
            },
            {
              label: "Compliant",
              value: stats.compliant,
              color: "text-green-600",
            },
            {
              label: "Expiring Soon",
              value: stats.expiring,
              color: "text-yellow-600",
            },
            { label: "Expired", value: stats.expired, color: "text-red-600" },
            {
              label: "Compliance Rate",
              value: `${complianceRate}%`,
              color:
                complianceRate >= 90
                  ? "text-green-600"
                  : complianceRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600",
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
          {["all", "COMPLIANT", "EXPIRING_SOON", "EXPIRED", "NOT_STARTED"].map(
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading training records…
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Employee",
                    "Dept",
                    "Training",
                    "Type",
                    "Completed",
                    "Expires",
                    "Score",
                    "Status",
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
                {filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {r.employeeName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {r.employeeId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[180px]">
                        {r.trainingTitle}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLOR[r.trainingType]}`}
                        >
                          {r.trainingType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.completedDate
                          ? new Date(r.completedDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.expiryDate
                          ? new Date(r.expiryDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {r.score !== null ? `${r.score}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
