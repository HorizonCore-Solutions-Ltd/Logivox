"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";

interface RTVItem {
  id: string;
  rtvNumber: string;
  supplierId: string;
  supplierName: string;
  sku: string;
  itemName: string;
  quantity: number;
  reason: string;
  status: "PENDING_AUTHORIZATION" | "AUTHORIZED" | "SHIPPED" | "RECEIVED_BY_SUPPLIER" | "CREDIT_ISSUED" | "CLOSED";
  raNumber: string | null;
  estimatedCredit: number;
  actualCredit: number | null;
  shippedDate: string | null;
  createdAt: string;
}

const MOCK: RTVItem[] = [
  { id: "1", rtvNumber: "RTV-2026-001", supplierId: "SUP-002", supplierName: "FastCast Foundry", sku: "SKU-CASTING-A3", itemName: "Housing Casting A3", quantity: 30, reason: "Porosity defects confirmed by X-ray — per NCR-2026-002", status: "SHIPPED", raNumber: "FCF-RA-1234", estimatedCredit: 3600, actualCredit: null, shippedDate: "2026-03-01", createdAt: "2026-02-25T10:00:00Z" },
  { id: "2", rtvNumber: "RTV-2026-002", supplierId: "SUP-004", supplierName: "Bolt & Fastener Co.", sku: "SKU-BOLT-M12G8", itemName: "M12 Grade 8 Bolt", quantity: 500, reason: "Wrong grade supplied — Grade 5 received, Grade 8 required", status: "AUTHORIZED", raNumber: "BFC-RA-0088", estimatedCredit: 1100, actualCredit: null, shippedDate: null, createdAt: "2026-03-01T14:00:00Z" },
  { id: "3", rtvNumber: "RTV-2025-009", supplierId: "SUP-001", supplierName: "Precision Components Ltd", sku: "SKU-SHAFT-300", itemName: "Drive Shaft 300mm", quantity: 5, reason: "Dimension OOT — shaft OD 0.12mm beyond tolerance", status: "CLOSED", raNumber: "PCL-RA-2205", estimatedCredit: 750, actualCredit: 750, shippedDate: "2025-12-15", createdAt: "2025-12-10T09:00:00Z" },
];

const STATUS_COLOR: Record<string, string> = { PENDING_AUTHORIZATION: "bg-yellow-100 text-yellow-700", AUTHORIZED: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", RECEIVED_BY_SUPPLIER: "bg-teal-100 text-teal-700", CREDIT_ISSUED: "bg-green-100 text-green-700", CLOSED: "bg-gray-200 text-gray-600" };

export default function RTVPage() {
  const router = useRouter();
  const [items, setItems] = useState<RTVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/rtv")
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.returns ?? d) ? (d.returns ?? d) : MOCK))
      .catch(() => setItems(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const totalCredit = items.reduce((s, i) => s + (i.actualCredit ?? i.estimatedCredit), 0);
  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/qc")} className="text-sm text-blue-600 hover:underline mb-1">← Quality Control</button>
            <h1 className="text-3xl font-bold text-gray-900">Return to Vendor</h1>
            <p className="mt-1 text-gray-600">Manage authorized returns of non-conforming materials to suppliers.</p>
          </div>
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Initiate RTV</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: "Total RTVs", value: items.length, color: "text-gray-900" }, { label: "In Progress", value: items.filter(i => !["CLOSED"].includes(i.status)).length, color: "text-blue-600" }, { label: "Shipped", value: items.filter(i => i.status === "SHIPPED" || i.status === "RECEIVED_BY_SUPPLIER").length, color: "text-purple-600" }, { label: "Total Credit", value: `$${totalCredit.toLocaleString()}`, color: "text-green-600" }].map(s => (
            <Card key={s.label}><CardContent className="pt-6"><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 flex-wrap">
          {["all", "PENDING_AUTHORIZATION", "AUTHORIZED", "SHIPPED", "RECEIVED_BY_SUPPLIER", "CREDIT_ISSUED", "CLOSED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">Loading RTVs…</div>
            : filtered.map(item => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">{item.rtvNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[item.status]}`}>{item.status.replace(/_/g, " ")}</span>
                        {item.raNumber && <span className="text-xs text-gray-500">RA#: {item.raNumber}</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-0.5">{item.itemName} <span className="font-mono text-gray-500 text-sm">({item.sku})</span></h3>
                      <p className="text-sm text-gray-700 font-medium">{item.supplierName} <span className="text-gray-400 font-normal">{item.supplierId}</span></p>
                      <p className="text-sm text-gray-600 my-1">{item.reason}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        {item.shippedDate && <span>Shipped: {new Date(item.shippedDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-green-700">${item.estimatedCredit.toLocaleString()}</div>
                      {item.actualCredit !== null && <div className="text-xs text-green-600">Actual: ${item.actualCredit.toLocaleString()}</div>}
                      <div className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>
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
