"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChangeRequest {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  changeType: "PROCESS" | "PRODUCT" | "DOCUMENT" | "EQUIPMENT" | "SUPPLIER";
  priority: "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "IMPLEMENTING" | "VERIFIED" | "CLOSED" | "REJECTED";
  submittedBy: string;
  approvedBy: string | null;
  submittedAt: string;
  targetDate: string | null;
  implementedAt: string | null;
  impactAssessment: string | null;
}

const MOCK: ChangeRequest[] = [
  { id: "1", changeNumber: "CCR-2026-001", title: "Update CNC tooling parameters for Shaft OD operation", description: "Adjust cutting speed and feed rate to improve tool life and reduce cycle time.", changeType: "PROCESS", priority: "MEDIUM", status: "APPROVED", submittedBy: "Process Engineer", approvedBy: "Engineering Manager", submittedAt: "2026-02-15T10:00:00Z", targetDate: "2026-03-15", implementedAt: null, impactAssessment: "Reduces tool cost by ~18%. No dimensional impact expected." },
  { id: "2", changeNumber: "CCR-2026-002", title: "Qualify alternate adhesive supplier", description: "Current supplier delivery time exceeds SLA. Adding backup supplier.", changeType: "SUPPLIER", priority: "HIGH", status: "UNDER_REVIEW", submittedBy: "Supply Chain Mgr", approvedBy: null, submittedAt: "2026-03-01T09:00:00Z", targetDate: "2026-04-01", implementedAt: null, impactAssessment: null },
  { id: "3", changeNumber: "CCR-2025-015", title: "Revise inspection criteria for coating thickness", description: "Updated per customer specification rev change.", changeType: "DOCUMENT", priority: "HIGH", status: "CLOSED", submittedBy: "QA Engineer", approvedBy: "QA Manager", submittedAt: "2025-11-10T08:00:00Z", targetDate: "2025-12-01", implementedAt: "2025-11-28T00:00:00Z", impactAssessment: "Affects 3 SOPs. Training required for 15 operators." },
];

const STATUS_COLOR: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-600", SUBMITTED: "bg-blue-100 text-blue-700", UNDER_REVIEW: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700", IMPLEMENTING: "bg-purple-100 text-purple-700", VERIFIED: "bg-teal-100 text-teal-700", CLOSED: "bg-gray-200 text-gray-700", REJECTED: "bg-red-100 text-red-700" };
const PRI_COLOR: Record<string, string> = { EMERGENCY: "bg-red-200 text-red-800", HIGH: "bg-orange-100 text-orange-700", MEDIUM: "bg-yellow-100 text-yellow-700", LOW: "bg-gray-100 text-gray-600" };
const TYPE_COLOR: Record<string, string> = { PROCESS: "bg-blue-100 text-blue-700", PRODUCT: "bg-purple-100 text-purple-700", DOCUMENT: "bg-teal-100 text-teal-700", EQUIPMENT: "bg-orange-100 text-orange-700", SUPPLIER: "bg-pink-100 text-pink-700" };

export default function ChangesPage() {
  const router = useRouter();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/changes")
      .then(r => r.json())
      .then(d => setChanges(Array.isArray(d.changes ?? d) ? (d.changes ?? d) : MOCK))
      .catch(() => setChanges(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = { total: changes.length, open: changes.filter(c => !["CLOSED", "REJECTED"].includes(c.status)).length, approved: changes.filter(c => c.status === "APPROVED").length, emergency: changes.filter(c => c.priority === "EMERGENCY").length };
  const filtered = filter === "all" ? changes : changes.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Change Control</h1>
            <p className="mt-1 text-gray-600">Submit, review, and approve changes to processes, products, documents, equipment, and suppliers.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Submit Change Request</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total", value: stats.total, color: "text-gray-900" }, { label: "Open", value: stats.open, color: "text-blue-600" }, { label: "Approved", value: stats.approved, color: "text-green-600" }, { label: "Emergency", value: stats.emergency, color: "text-red-600" }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 flex-wrap">
          {["all", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "IMPLEMENTING", "CLOSED", "REJECTED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">Loading change requests…</div>
            : filtered.map(c => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">{c.changeNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLOR[c.changeType]}`}>{c.changeType}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRI_COLOR[c.priority]}`}>{c.priority}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[c.status]}`}>{c.status.replace(/_/g, " ")}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">{c.description}</p>
                      {c.impactAssessment && <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">Impact: {c.impactAssessment}</p>}
                      <div className="flex gap-3 text-xs text-gray-400 mt-2">
                        <span>By: {c.submittedBy}</span>
                        {c.approvedBy && <span>Approved by: {c.approvedBy}</span>}
                        {c.targetDate && <span>Target: {new Date(c.targetDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      <div>{new Date(c.submittedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
