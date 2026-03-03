"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";

interface CalibrationRecord {
  id: string;
  instrumentId: string;
  instrumentName: string;
  serialNumber: string;
  calibrationDate: string;
  nextDueDate: string;
  status: "CALIBRATED" | "DUE_SOON" | "OVERDUE" | "OUT_OF_SERVICE";
  result: "PASS" | "FAIL" | "ADJUSTED" | "PENDING";
  technician: string;
  certificateNumber: string | null;
  tolerance: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  CALIBRATED: { color: "bg-green-100 text-green-700", label: "Calibrated" },
  DUE_SOON: { color: "bg-yellow-100 text-yellow-700", label: "Due Soon" },
  OVERDUE: { color: "bg-red-100 text-red-700", label: "Overdue" },
  OUT_OF_SERVICE: {
    color: "bg-gray-200 text-gray-600",
    label: "Out of Service",
  },
};

const RESULT_CONFIG: Record<string, { color: string }> = {
  PASS: { color: "bg-green-100 text-green-700" },
  FAIL: { color: "bg-red-100 text-red-700" },
  ADJUSTED: { color: "bg-blue-100 text-blue-700" },
  PENDING: { color: "bg-gray-100 text-gray-600" },
};

const MOCK: CalibrationRecord[] = [
  {
    id: "1",
    instrumentId: "INST-001",
    instrumentName: "Torque Wrench #3",
    serialNumber: "TW-2023-003",
    calibrationDate: "2026-01-15",
    nextDueDate: "2026-07-15",
    status: "CALIBRATED",
    result: "PASS",
    technician: "Alex Torres",
    certificateNumber: "CAL-2026-0042",
    tolerance: "±2%",
  },
  {
    id: "2",
    instrumentId: "INST-002",
    instrumentName: "Digital Caliper #7",
    serialNumber: "DC-2022-007",
    calibrationDate: "2025-09-01",
    nextDueDate: "2026-03-01",
    status: "OVERDUE",
    result: "PENDING",
    technician: "",
    certificateNumber: null,
    tolerance: "±0.01mm",
  },
  {
    id: "3",
    instrumentId: "INST-003",
    instrumentName: "Pressure Gauge #12",
    serialNumber: "PG-2024-012",
    calibrationDate: "2025-12-01",
    nextDueDate: "2026-06-01",
    status: "DUE_SOON",
    result: "PASS",
    technician: "Sam Lee",
    certificateNumber: "CAL-2025-0198",
    tolerance: "±0.5 PSI",
  },
  {
    id: "4",
    instrumentId: "INST-004",
    instrumentName: "Thermometer #2",
    serialNumber: "TH-2023-002",
    calibrationDate: "2026-02-01",
    nextDueDate: "2027-02-01",
    status: "CALIBRATED",
    result: "ADJUSTED",
    technician: "Jordan Kim",
    certificateNumber: "CAL-2026-0055",
    tolerance: "±0.5°C",
  },
];

export default function CalibrationPage() {
  const router = useRouter();
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/calibration")
      .then((r) => r.json())
      .then((d) =>
        setRecords(Array.isArray(d.records ?? d) ? (d.records ?? d) : MOCK),
      )
      .catch(() => setRecords(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: records.length,
    overdue: records.filter((r) => r.status === "OVERDUE").length,
    dueSoon: records.filter((r) => r.status === "DUE_SOON").length,
    calibrated: records.filter((r) => r.status === "CALIBRATED").length,
  };

  const filtered =
    statusFilter === "all"
      ? records
      : records.filter((r) => r.status === statusFilter);

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
              Calibration Management
            </h1>
            <p className="mt-1 text-gray-600">
              Track and manage instrument calibration schedules and records.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Schedule Calibration
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Instruments",
              value: stats.total,
              color: "text-gray-900",
            },
            {
              label: "Calibrated",
              value: stats.calibrated,
              color: "text-green-600",
            },
            {
              label: "Due Soon",
              value: stats.dueSoon,
              color: "text-yellow-600",
            },
            { label: "Overdue", value: stats.overdue, color: "text-red-600" },
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
          {["all", "CALIBRATED", "DUE_SOON", "OVERDUE", "OUT_OF_SERVICE"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ),
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading calibration records…
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Instrument",
                    "Serial #",
                    "Last Calibrated",
                    "Next Due",
                    "Status",
                    "Result",
                    "Technician",
                    "Certificate",
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
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900">
                        {r.instrumentName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.instrumentId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {r.serialNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.calibrationDate
                        ? new Date(r.calibrationDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(r.nextDueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[r.status].color}`}
                      >
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RESULT_CONFIG[r.result].color}`}
                      >
                        {r.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.technician || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {r.certificateNumber || "—"}
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
