"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Star } from "lucide-react";

interface SupplierQualityRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  category: string;
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  documentationScore: number;
  responsiveness: number;
  rating: "PREFERRED" | "APPROVED" | "CONDITIONAL" | "DISQUALIFIED";
  ncrCount: number;
  onTimeDeliveryRate: number;
  defectRate: number;
  lastAuditDate: string | null;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
}

const MOCK: SupplierQualityRecord[] = [
  { id: "1", supplierId: "SUP-001", supplierName: "Precision Components Ltd", category: "Machined Parts", overallScore: 94, qualityScore: 96, deliveryScore: 92, documentationScore: 95, responsiveness: 93, rating: "PREFERRED", ncrCount: 1, onTimeDeliveryRate: 97.5, defectRate: 0.3, lastAuditDate: "2025-11-01", trend: "STABLE" },
  { id: "2", supplierId: "SUP-002", supplierName: "FastCast Foundry", category: "Castings", overallScore: 72, qualityScore: 70, deliveryScore: 75, documentationScore: 72, responsiveness: 71, rating: "CONDITIONAL", ncrCount: 5, onTimeDeliveryRate: 84.0, defectRate: 2.1, lastAuditDate: "2025-08-15", trend: "DECLINING" },
  { id: "3", supplierId: "SUP-003", supplierName: "ElectroSupply Co.", category: "Electronic Components", overallScore: 88, qualityScore: 91, deliveryScore: 86, documentationScore: 88, responsiveness: 87, rating: "APPROVED", ncrCount: 2, onTimeDeliveryRate: 92.3, defectRate: 0.7, lastAuditDate: "2026-01-10", trend: "IMPROVING" },
];

const RATING_COLOR: Record<string, string> = { PREFERRED: "bg-green-100 text-green-700", APPROVED: "bg-blue-100 text-blue-700", CONDITIONAL: "bg-yellow-100 text-yellow-700", DISQUALIFIED: "bg-red-100 text-red-700" };
const TREND_COLOR: Record<string, string> = { IMPROVING: "text-green-600", STABLE: "text-gray-500", DECLINING: "text-red-600" };
const SCORE_COLOR = (s: number) => s >= 90 ? "text-green-600" : s >= 75 ? "text-yellow-600" : "text-red-600";

export default function SupplierQualityPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierQualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/supplier-quality")
      .then(r => r.json())
      .then(d => setSuppliers(Array.isArray(d.suppliers ?? d) ? (d.suppliers ?? d) : MOCK))
      .catch(() => setSuppliers(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const avgScore = suppliers.length ? Math.round(suppliers.reduce((s, r) => s + r.overallScore, 0) / suppliers.length) : 0;
  const filtered = filter === "all" ? suppliers : suppliers.filter(s => s.rating === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Quality</h1>
            <p className="mt-1 text-gray-600">Monitor supplier scorecards, rankings, NCR rates, and performance trends.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Supplier</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total Suppliers", value: suppliers.length, color: "text-gray-900" }, { label: "Preferred", value: suppliers.filter(s => s.rating === "PREFERRED").length, color: "text-green-600" }, { label: "Conditional", value: suppliers.filter(s => s.rating === "CONDITIONAL").length, color: "text-yellow-600" }, { label: "Avg Score", value: `${avgScore}%`, color: SCORE_COLOR(avgScore) }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
          {["all", "PREFERRED", "APPROVED", "CONDITIONAL", "DISQUALIFIED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? <div className="p-12 text-center text-gray-400">Loading supplier data…</div> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>{["Supplier", "Category", "Overall", "Quality", "Delivery", "Docs", "Responsiveness", "NCRs", "OTD Rate", "Defect Rate", "Trend", "Rating"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3"><div className="font-medium text-sm text-gray-900">{s.supplierName}</div><div className="text-xs text-gray-500 font-mono">{s.supplierId}</div></td>
                    <td className="px-3 py-3 text-sm text-gray-600">{s.category}</td>
                    <td className={`px-3 py-3 text-sm font-bold ${SCORE_COLOR(s.overallScore)}`}>{s.overallScore}%</td>
                    <td className={`px-3 py-3 text-sm ${SCORE_COLOR(s.qualityScore)}`}>{s.qualityScore}%</td>
                    <td className={`px-3 py-3 text-sm ${SCORE_COLOR(s.deliveryScore)}`}>{s.deliveryScore}%</td>
                    <td className={`px-3 py-3 text-sm ${SCORE_COLOR(s.documentationScore)}`}>{s.documentationScore}%</td>
                    <td className={`px-3 py-3 text-sm ${SCORE_COLOR(s.responsiveness)}`}>{s.responsiveness}%</td>
                    <td className={`px-3 py-3 text-sm font-semibold ${s.ncrCount > 3 ? "text-red-600" : "text-gray-700"}`}>{s.ncrCount}</td>
                    <td className={`px-3 py-3 text-sm ${SCORE_COLOR(s.onTimeDeliveryRate)}`}>{s.onTimeDeliveryRate}%</td>
                    <td className={`px-3 py-3 text-sm font-semibold ${s.defectRate > 1 ? "text-red-600" : "text-green-600"}`}>{s.defectRate}%</td>
                    <td className={`px-3 py-3 text-sm font-semibold ${TREND_COLOR[s.trend]}`}>{s.trend === "IMPROVING" ? "↑ " : s.trend === "DECLINING" ? "↓ " : "→ "}{s.trend}</td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RATING_COLOR[s.rating]}`}>{s.rating}</span></td>
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
