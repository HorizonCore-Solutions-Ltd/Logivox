"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";

interface DebitMemo {
  id: string;
  memoNumber: string;
  supplierId: string;
  supplierName: string;
  reason: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "DISPUTED" | "SETTLED";
  relatedNcr: string | null;
  createdAt: string;
  approvedAt: string | null;
  settledAt: string | null;
  approvedBy: string | null;
}

const MOCK: DebitMemo[] = [
  { id: "1", memoNumber: "DM-2026-001", supplierId: "SUP-002", supplierName: "FastCast Foundry", reason: "Rejection of 50 castings — out of tolerance (NCR-2026-002)", amount: 4750.00, currency: "USD", status: "APPROVED", relatedNcr: "NCR-2026-002", createdAt: "2026-03-01T09:00:00Z", approvedAt: "2026-03-02T11:00:00Z", settledAt: null, approvedBy: "Finance Manager" },
  { id: "2", memoNumber: "DM-2026-002", supplierId: "SUP-004", supplierName: "Bolt & Fastener Co.", reason: "Wrong grade bolts supplied — Grade 5 instead of Grade 8", amount: 1200.00, currency: "USD", status: "DISPUTED", relatedNcr: "NCR-2026-004", createdAt: "2026-02-20T14:00:00Z", approvedAt: null, settledAt: null, approvedBy: null },
  { id: "3", memoNumber: "DM-2025-018", supplierId: "SUP-001", supplierName: "Precision Components Ltd", reason: "Late delivery penalty per contract clause 8.2", amount: 500.00, currency: "USD", status: "SETTLED", relatedNcr: null, createdAt: "2025-12-10T10:00:00Z", approvedAt: "2025-12-12T09:00:00Z", settledAt: "2026-01-15T00:00:00Z", approvedBy: "QA Manager" },
];

const STATUS_COLOR: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-600", PENDING_APPROVAL: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700", SENT: "bg-purple-100 text-purple-700", DISPUTED: "bg-red-100 text-red-700", SETTLED: "bg-green-100 text-green-700" };

export default function DebitMemosPage() {
  const router = useRouter();
  const [memos, setMemos] = useState<DebitMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/debit-memos")
      .then(r => r.json())
      .then(d => setMemos(Array.isArray(d.memos ?? d) ? (d.memos ?? d) : MOCK))
      .catch(() => setMemos(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = memos.filter(m => !["SETTLED"].includes(m.status)).reduce((s, m) => s + m.amount, 0);
  const filtered = filter === "all" ? memos : memos.filter(m => m.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Debit Memos</h1>
            <p className="mt-1 text-gray-600">Issue and track financial debits to suppliers for quality non-conformances.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Debit Memo</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total Memos", value: memos.length, color: "text-gray-900" }, { label: "Approved", value: memos.filter(m => m.status === "APPROVED" || m.status === "SENT").length, color: "text-blue-600" }, { label: "Disputed", value: memos.filter(m => m.status === "DISPUTED").length, color: "text-red-600" }, { label: "Outstanding", value: `$${totalOutstanding.toLocaleString()}`, color: "text-orange-600" }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 flex-wrap">
          {["all", "DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "DISPUTED", "SETTLED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">Loading debit memos…</div>
            : filtered.map(m => (
              <Card key={m.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="font-mono text-sm text-gray-500">{m.memoNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[m.status]}`}>{m.status.replace(/_/g, " ")}</span>
                        {m.relatedNcr && <span className="text-xs text-blue-600 underline cursor-pointer">{m.relatedNcr}</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-0.5">{m.supplierName} <span className="text-gray-500 font-mono text-sm">({m.supplierId})</span></h3>
                      <p className="text-sm text-gray-600">{m.reason}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        <span>Created {new Date(m.createdAt).toLocaleDateString()}</span>
                        {m.approvedBy && <span>Approved by {m.approvedBy}</span>}
                        {m.settledAt && <span className="text-green-600">Settled {new Date(m.settledAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${m.status === "SETTLED" ? "text-green-600" : "text-gray-900"}`}>${m.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{m.currency}</div>
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
