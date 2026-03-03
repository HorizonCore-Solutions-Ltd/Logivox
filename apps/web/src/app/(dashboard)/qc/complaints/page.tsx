"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";

interface Complaint {
  id: string;
  complaintNumber: string;
  source: "CUSTOMER" | "INTERNAL" | "REGULATORY" | "SUPPLIER";
  category: string;
  description: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  reportedBy: string;
  assignedTo: string | null;
  productSku: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

const MOCK: Complaint[] = [
  { id: "1", complaintNumber: "COMP-2026-001", source: "CUSTOMER", category: "Product Defect", description: "Customer received unit with cracked housing.", status: "INVESTIGATING", priority: "HIGH", reportedBy: "Customer Support", assignedTo: "QA Engineer", productSku: "SKU-UNIT-A1", createdAt: "2026-02-28T10:00:00Z", resolvedAt: null, resolution: null },
  { id: "2", complaintNumber: "COMP-2026-002", source: "INTERNAL", category: "Process Deviation", description: "Assembly line deviation from SOP detected during audit.", status: "RESOLVED", priority: "MEDIUM", reportedBy: "Internal Audit", assignedTo: "Process Lead", productSku: null, createdAt: "2026-02-15T09:00:00Z", resolvedAt: "2026-02-22T11:00:00Z", resolution: "SOP updated and team retrained." },
  { id: "3", complaintNumber: "COMP-2026-003", source: "REGULATORY", category: "Labeling Issue", description: "Missing required safety symbol on product label.", status: "CLOSED", priority: "HIGH", reportedBy: "Regulatory Affairs", assignedTo: "Packaging Team", productSku: "SKU-LABEL-X", createdAt: "2026-01-20T08:00:00Z", resolvedAt: "2026-02-01T16:00:00Z", resolution: "Label redesigned and approved. All stock relabeled." },
];

const STATUS_COLOR: Record<string, string> = { OPEN: "bg-red-100 text-red-700", INVESTIGATING: "bg-blue-100 text-blue-700", RESOLVED: "bg-yellow-100 text-yellow-700", CLOSED: "bg-green-100 text-green-700" };
const PRI_COLOR: Record<string, string> = { HIGH: "bg-red-100 text-red-700", MEDIUM: "bg-yellow-100 text-yellow-700", LOW: "bg-gray-100 text-gray-600" };
const SRC_COLOR: Record<string, string> = { CUSTOMER: "bg-purple-100 text-purple-700", INTERNAL: "bg-blue-100 text-blue-700", REGULATORY: "bg-orange-100 text-orange-700", SUPPLIER: "bg-teal-100 text-teal-700" };

export default function ComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/complaints")
      .then(r => r.json())
      .then(d => setComplaints(Array.isArray(d.complaints ?? d) ? (d.complaints ?? d) : MOCK))
      .catch(() => setComplaints(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = { total: complaints.length, open: complaints.filter(c => c.status === "OPEN" || c.status === "INVESTIGATING").length, high: complaints.filter(c => c.priority === "HIGH").length, resolved: complaints.filter(c => c.status === "CLOSED" || c.status === "RESOLVED").length };
  const filtered = filter === "all" ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
            <p className="mt-1 text-gray-600">Track customer, internal, regulatory, and supplier complaints through resolution.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Complaint</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total", value: stats.total, color: "text-gray-900" }, { label: "Active", value: stats.open, color: "text-red-600" }, { label: "High Priority", value: stats.high, color: "text-red-700" }, { label: "Resolved/Closed", value: stats.resolved, color: "text-green-600" }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
          {["all", "OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">Loading complaints…</div>
            : filtered.map(c => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-1 flex-wrap items-center">
                        <span className="font-mono text-sm text-gray-500">{c.complaintNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SRC_COLOR[c.source]}`}>{c.source}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRI_COLOR[c.priority]}`}>{c.priority}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{c.category}</h3>
                      <p className="text-sm text-gray-600 mb-2">{c.description}</p>
                      {c.resolution && <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">Resolution: {c.resolution}</p>}
                      <div className="flex gap-3 text-xs text-gray-500 mt-2">
                        <span>By: {c.reportedBy}</span>
                        {c.assignedTo && <span>Assigned: {c.assignedTo}</span>}
                        {c.productSku && <span>SKU: {c.productSku}</span>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>{new Date(c.createdAt).toLocaleDateString()}</div>
                      {c.resolvedAt && <div className="text-green-600 mt-0.5">Resolved {new Date(c.resolvedAt).toLocaleDateString()}</div>}
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
