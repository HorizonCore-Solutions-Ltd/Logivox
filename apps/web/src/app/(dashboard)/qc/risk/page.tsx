"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Shield } from "lucide-react";

interface RiskItem {
  id: string;
  riskId: string;
  title: string;
  description: string;
  category: "PRODUCT" | "PROCESS" | "SUPPLIER" | "REGULATORY" | "EQUIPMENT";
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "MITIGATING" | "ACCEPTED" | "CLOSED";
  owner: string;
  mitigationPlan: string | null;
  residualScore: number | null;
  reviewDate: string;
}

const MOCK: RiskItem[] = [
  {
    id: "1",
    riskId: "RISK-2026-001",
    title: "Single-source supplier for critical components",
    description: "Sole supplier for gear assemblies poses supply chain risk.",
    category: "SUPPLIER",
    likelihood: 4,
    impact: 5,
    riskScore: 20,
    riskLevel: "CRITICAL",
    status: "MITIGATING",
    owner: "Supply Chain Mgr",
    mitigationPlan: "Qualify second supplier by Q2 2026",
    residualScore: 8,
    reviewDate: "2026-04-01",
  },
  {
    id: "2",
    riskId: "RISK-2026-002",
    title: "Aging calibration equipment",
    description: "CMM Unit 2 (2012 vintage) showing drift beyond spec.",
    category: "EQUIPMENT",
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: "HIGH",
    status: "OPEN",
    owner: "Metrology Lead",
    mitigationPlan: null,
    residualScore: null,
    reviewDate: "2026-03-15",
  },
  {
    id: "3",
    riskId: "RISK-2026-003",
    title: "Regulatory label change mandate",
    description:
      "New EU CE regulation requires updated product labeling by Q3 2026.",
    category: "REGULATORY",
    likelihood: 5,
    impact: 3,
    riskScore: 15,
    riskLevel: "HIGH",
    status: "MITIGATING",
    owner: "Regulatory Affairs",
    mitigationPlan: "Label redesign in progress — target approval April 2026.",
    residualScore: 6,
    reviewDate: "2026-05-01",
  },
  {
    id: "4",
    riskId: "RISK-2026-004",
    title: "Minor process variation in painting",
    description: "Occasional adhesion variability in paint line.",
    category: "PROCESS",
    likelihood: 2,
    impact: 2,
    riskScore: 4,
    riskLevel: "LOW",
    status: "ACCEPTED",
    owner: "Process Eng.",
    mitigationPlan: "Enhanced adhesion testing added to process.",
    residualScore: 4,
    reviewDate: "2026-06-01",
  },
];

const LEVEL_COLOR: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-800",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  MITIGATING: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-yellow-50 text-yellow-700",
  CLOSED: "bg-green-50 text-green-700",
};

export default function RiskPage() {
  const router = useRouter();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/risk")
      .then((r) => r.json())
      .then((d) =>
        setRisks(Array.isArray(d.risks ?? d) ? (d.risks ?? d) : MOCK),
      )
      .catch(() => setRisks(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: risks.length,
    critical: risks.filter((r) => r.riskLevel === "CRITICAL").length,
    high: risks.filter((r) => r.riskLevel === "HIGH").length,
    open: risks.filter((r) => r.status === "OPEN").length,
  };
  const filtered =
    filter === "all"
      ? risks
      : risks.filter((r) => r.riskLevel === filter || r.status === filter);

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
              Risk Management
            </h1>
            <p className="mt-1 text-gray-600">
              Identify, assess, and mitigate quality risks across products,
              processes, and suppliers.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Risk
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Risks",
              value: stats.total,
              color: "text-gray-900",
            },
            { label: "Critical", value: stats.critical, color: "text-red-700" },
            { label: "High", value: stats.high, color: "text-orange-600" },
            {
              label: "Open (no plan)",
              value: stats.open,
              color: "text-red-600",
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

        {/* Risk Matrix visual hint */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
              Risk Score = Likelihood × Impact (1–25)
            </p>
            <div className="flex gap-3 text-xs">
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">
                1–5: Low
              </span>
              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                6–10: Medium
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                11–16: High
              </span>
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">
                17–25: Critical
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 flex-wrap">
          {[
            "all",
            "CRITICAL",
            "HIGH",
            "MEDIUM",
            "LOW",
            "OPEN",
            "MITIGATING",
            "ACCEPTED",
            "CLOSED",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Loading risks…
            </div>
          ) : (
            filtered.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">
                          {r.riskId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_COLOR[r.riskLevel]}`}
                        >
                          {r.riskLevel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status]}`}
                        >
                          {r.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {r.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {r.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {r.description}
                      </p>
                      {r.mitigationPlan && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                          Mitigation: {r.mitigationPlan}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs text-gray-500 mt-2">
                        <span>Owner: {r.owner}</span>
                        <span>
                          Review: {new Date(r.reviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold text-gray-800">
                        {r.riskScore}
                      </div>
                      <div className="text-xs text-gray-400">
                        L{r.likelihood} × I{r.impact}
                      </div>
                      {r.residualScore !== null && (
                        <div className="text-sm font-semibold text-green-600 mt-1">
                          → {r.residualScore} residual
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
