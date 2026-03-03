"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2 } from "lucide-react";

interface MeasurementRecord {
  id: string;
  featureId: string;
  featureName: string;
  partNumber: string;
  nominal: number;
  usl: number;
  lsl: number;
  unit: string;
  actualValue: number;
  deviation: number;
  result: "PASS" | "FAIL";
  measurementDate: string;
  instrument: string;
  operator: string;
  workOrder: string | null;
}

const MOCK: MeasurementRecord[] = [
  {
    id: "1",
    featureId: "FEAT-001",
    featureName: "Bore Diameter",
    partNumber: "PN-BLOCK-A1",
    nominal: 50.0,
    usl: 50.05,
    lsl: 49.95,
    unit: "mm",
    actualValue: 50.02,
    deviation: 0.02,
    result: "PASS",
    measurementDate: "2026-03-02T08:30:00Z",
    instrument: "CMM-001",
    operator: "Alex T.",
    workOrder: "WO-2026-0341",
  },
  {
    id: "2",
    featureId: "FEAT-002",
    featureName: "Surface Roughness Ra",
    partNumber: "PN-SHAFT-B3",
    nominal: 1.6,
    usl: 2.0,
    lsl: 0.8,
    unit: "µm Ra",
    actualValue: 2.15,
    deviation: 0.15,
    result: "FAIL",
    measurementDate: "2026-03-02T09:00:00Z",
    instrument: "SURF-002",
    operator: "Sam L.",
    workOrder: "WO-2026-0338",
  },
  {
    id: "3",
    featureId: "FEAT-003",
    featureName: "Thread Major Diameter",
    partNumber: "PN-BOLT-M12",
    nominal: 12.0,
    usl: 12.0,
    lsl: 11.9,
    unit: "mm",
    actualValue: 11.97,
    deviation: -0.03,
    result: "PASS",
    measurementDate: "2026-03-01T15:00:00Z",
    instrument: "CMM-001",
    operator: "Jordan K.",
    workOrder: null,
  },
];

export default function MeasurementsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/measurements")
      .then((r) => r.json())
      .then((d) =>
        setRecords(
          Array.isArray(d.measurements ?? d) ? (d.measurements ?? d) : MOCK,
        ),
      )
      .catch(() => setRecords(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: records.length,
    pass: records.filter((r) => r.result === "PASS").length,
    fail: records.filter((r) => r.result === "FAIL").length,
  };
  const yieldRate = stats.total
    ? Math.round((stats.pass / stats.total) * 100)
    : 0;
  const filtered =
    filter === "all" ? records : records.filter((r) => r.result === filter);

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
              Measurement Results
            </h1>
            <p className="mt-1 text-gray-600">
              Raw dimensional and characteristic measurement data with pass/fail
              status.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Measurement
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Pass", value: stats.pass, color: "text-green-600" },
            { label: "Fail", value: stats.fail, color: "text-red-600" },
            {
              label: "First Pass Yield",
              value: `${yieldRate}%`,
              color: yieldRate >= 95 ? "text-green-600" : "text-orange-600",
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

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
          {["all", "PASS", "FAIL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading measurements…
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Feature",
                    "Part #",
                    "Nominal",
                    "LSL",
                    "USL",
                    "Actual",
                    "Deviation",
                    "Unit",
                    "Result",
                    "Instrument",
                    "Operator",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      r.result === "FAIL" ? "bg-red-50" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {r.featureName}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-600">
                      {r.partNumber}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{r.nominal}</td>
                    <td className="px-3 py-3 text-gray-600">{r.lsl}</td>
                    <td className="px-3 py-3 text-gray-600">{r.usl}</td>
                    <td
                      className={`px-3 py-3 font-semibold ${r.result === "FAIL" ? "text-red-700" : "text-gray-900"}`}
                    >
                      {r.actualValue}
                    </td>
                    <td
                      className={`px-3 py-3 font-semibold ${Math.abs(r.deviation) > 0.1 ? "text-red-600" : "text-gray-600"}`}
                    >
                      {r.deviation > 0 ? "+" : ""}
                      {r.deviation}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{r.unit}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.result === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {r.result}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{r.instrument}</td>
                    <td className="px-3 py-3 text-gray-600">{r.operator}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(r.measurementDate).toLocaleDateString()}
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
