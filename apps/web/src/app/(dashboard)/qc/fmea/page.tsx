"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

interface FMEAEntry {
  id: string;
  itemNumber: string;
  processStep: string;
  potentialFailureMode: string;
  potentialEffect: string;
  severity: number;
  potentialCause: string;
  occurrence: number;
  currentControls: string;
  detection: number;
  rpn: number;
  recommendedAction: string;
  responsible: string | null;
  targetDate: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

const MOCK: FMEAEntry[] = [
  { id: "1", itemNumber: "FMEA-001", processStep: "Assembly - Torque Step 3", potentialFailureMode: "Under-torque on fastener", potentialEffect: "Unit failure in field", severity: 9, potentialCause: "Torque wrench mis-calibration", occurrence: 3, currentControls: "Annual calibration check", detection: 5, rpn: 135, recommendedAction: "Increase calibration frequency to quarterly", responsible: "Maintenance Eng.", targetDate: "2026-04-01", status: "IN_PROGRESS" },
  { id: "2", itemNumber: "FMEA-002", processStep: "Incoming Inspection", potentialFailureMode: "Missed dimensional defect", potentialEffect: "Defective part reaches production", severity: 7, potentialCause: "Sample inspection only", occurrence: 4, currentControls: "Visual inspection 10% sample", detection: 6, rpn: 168, recommendedAction: "100% CMM inspection for critical dimensions", responsible: "QC Lead", targetDate: "2026-03-15", status: "OPEN" },
  { id: "3", itemNumber: "FMEA-003", processStep: "Painting & Coating", potentialFailureMode: "Adhesion failure", potentialEffect: "Corrosion, cosmetic defect", severity: 5, potentialCause: "Surface preparation insufficient", occurrence: 2, currentControls: "Visual adhesion test", detection: 3, rpn: 30, recommendedAction: "Add cross-hatch adhesion test per batch", responsible: "Process Eng.", targetDate: "2026-02-28", status: "COMPLETED" },
];

const RPN_COLOR = (rpn: number) => rpn >= 150 ? "text-red-700 font-bold" : rpn >= 80 ? "text-orange-600 font-semibold" : "text-green-700";

export default function FMEAPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<FMEAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/fmea")
      .then(r => r.json())
      .then(d => setEntries(Array.isArray(d.entries ?? d) ? (d.entries ?? d) : MOCK))
      .catch(() => setEntries(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? entries : entries.filter(e => e.status === filter);
  const avgRpn = entries.length ? Math.round(entries.reduce((s, e) => s + e.rpn, 0) / entries.length) : 0;
  const highRisk = entries.filter(e => e.rpn >= 150).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Failure Mode & Effects Analysis</h1>
            <p className="mt-1 text-gray-600">Identify and mitigate potential failure modes in processes and products.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> New FMEA Entry</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total Entries", value: entries.length, color: "text-gray-900" }, { label: "High Risk (RPN≥150)", value: highRisk, color: "text-red-600" }, { label: "Avg RPN", value: avgRpn, color: avgRpn >= 100 ? "text-orange-600" : "text-green-600" }, { label: "Open Actions", value: entries.filter(e => e.status === "OPEN").length, color: "text-blue-600" }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
          {["all", "OPEN", "IN_PROGRESS", "COMPLETED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading FMEA data…</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>{["#", "Process Step", "Failure Mode", "Effect", "SEV", "Cause", "OCC", "Controls", "DET", "RPN", "Action", "Owner", "Status"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-gray-500 text-xs">{e.itemNumber}</td>
                    <td className="px-3 py-3 text-gray-900 max-w-[140px]">{e.processStep}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-[140px]">{e.potentialFailureMode}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[120px]">{e.potentialEffect}</td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-800">{e.severity}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[120px]">{e.potentialCause}</td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-800">{e.occurrence}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[120px]">{e.currentControls}</td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-800">{e.detection}</td>
                    <td className={`px-3 py-3 text-center text-base ${RPN_COLOR(e.rpn)}`}>{e.rpn}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[140px]">{e.recommendedAction}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{e.responsible ?? "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === "COMPLETED" ? "bg-green-100 text-green-700" : e.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {e.status.replace(/_/g, " ")}
                      </span>
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
