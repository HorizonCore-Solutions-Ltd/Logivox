"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// ============================================
// CAPA SYSTEM 13: RISK SCORING DASHBOARD
// ============================================
// Risk Priority Number (RPN) = Severity × Occurrence × Detection
// FMEA-based risk assessment and prioritization
// Visual risk matrix and resource allocation guidance

interface RiskAssessment {
  id: string;
  capaId: string;
  severity: number;
  occurrence: number;
  detection: number;
  initialRPN: number;
  postActionRPN?: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  riskReduction?: number;
  reductionPercent?: number;
  notes?: string;
  assessedAt: string;
  reassessedAt?: string;
  capa: {
    capaNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
  };
}

export default function RiskScoringPage() {
  const { data: session } = useSession();
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("rpn");

  // New RPN calculation state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorCapa, setCalculatorCapa] = useState("");
  const [severity, setSeverity] = useState(5);
  const [occurrence, setOccurrence] = useState(5);
  const [detection, setDetection] = useState(5);

  useEffect(() => {
    fetchAssessments();
  }, [riskLevelFilter, sortBy]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (riskLevelFilter !== "all")
        params.append("riskLevel", riskLevelFilter);
      params.append("sortBy", sortBy);

      const response = await fetch(`/api/capa/risk-scoring?${params}`);
      const data = await response.json();

      setAssessments(data.assessments || []);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch risk assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRPN = async () => {
    if (!calculatorCapa) {
      alert("Please enter CAPA number");
      return;
    }

    try {
      const response = await fetch("/api/capa/risk-scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CALCULATE_RPN",
          capaId: calculatorCapa,
          severity,
          occurrence,
          detection,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `RPN Calculated: ${result.rpn}\nRisk Level: ${result.riskLevel}\n${result.priorityChanged ? `Priority changed: ${result.oldPriority} → ${result.newPriority}` : ""}`,
        );
        setShowCalculator(false);
        fetchAssessments();
      } else {
        alert(result.error || "Failed to calculate RPN");
      }
    } catch (error) {
      console.error("RPN calculation error:", error);
      alert("Failed to calculate RPN");
    }
  };

  const autoPrioritize = async () => {
    if (!confirm("Auto-prioritize all CAPAs without risk assessments?")) return;

    try {
      const response = await fetch("/api/capa/risk-scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "AUTO_PRIORITIZE_CAPAS" }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `${result.message}\n${result.assessmentsCreated} CAPAs auto-prioritized`,
        );
        fetchAssessments();
      }
    } catch (error) {
      console.error("Auto-prioritize error:", error);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (!searchTerm) return true;
    return (
      a.capa.capaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.capa.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const calculatedRPN = severity * occurrence * detection;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CAPA Risk Scoring (RPN)</h1>
          <p className="text-gray-600 mt-1">
            Risk Priority Number = Severity × Occurrence × Detection
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Calculate RPN
          </button>
          <button
            onClick={autoPrioritize}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Auto-Prioritize All
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm font-medium">
              CRITICAL RISK
            </div>
            <div className="text-3xl font-bold text-red-700 mt-2">
              {stats.criticalRisk}
            </div>
            <div className="text-xs text-red-600 mt-1">RPN ≥ 200</div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 text-sm font-medium">HIGH RISK</div>
            <div className="text-3xl font-bold text-orange-700 mt-2">
              {stats.highRisk}
            </div>
            <div className="text-xs text-orange-600 mt-1">RPN 100-199</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-700 text-sm font-medium">
              MEDIUM RISK
            </div>
            <div className="text-3xl font-bold text-yellow-800 mt-2">
              {stats.mediumRisk}
            </div>
            <div className="text-xs text-yellow-700 mt-1">RPN 50-99</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">LOW RISK</div>
            <div className="text-3xl font-bold text-blue-700 mt-2">
              {stats.lowRisk}
            </div>
            <div className="text-xs text-blue-600 mt-1">RPN &lt; 50</div>
          </div>
        </div>
      )}

      {/* Average RPN & Effectiveness */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-gray-600 text-sm">Average RPN</div>
            <div className="text-2xl font-bold mt-1">{stats.averageRPN}</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700 text-sm">Risk Reduced (CAPAs)</div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {stats.riskReduced}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Post-action RPN lower than initial
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700 text-sm">Average Risk Reduction</div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {stats.averageReduction}%
            </div>
            <div className="text-xs text-green-600 mt-1">
              Average improvement after CAPA
            </div>
          </div>
        </div>
      )}

      {/* RPN Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Calculate Risk Priority Number (RPN)
              </h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              {/* CAPA Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  CAPA Number/ID
                </label>
                <input
                  type="text"
                  value={calculatorCapa}
                  onChange={(e) => setCalculatorCapa(e.target.value)}
                  placeholder="e.g., CAPA-2026-001"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity (Impact):{" "}
                  <span className="text-blue-600 font-bold">{severity}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {severity >= 9
                    ? "9-10: Catastrophic (death, serious injury, FDA recall)"
                    : severity >= 7
                      ? "7-8: Critical (injury, product recall, regulatory action)"
                      : severity >= 5
                        ? "5-6: Moderate (customer dissatisfaction, performance impact)"
                        : severity >= 3
                          ? "3-4: Low (minor impact)"
                          : "1-2: Negligible (no impact)"}
                </div>
              </div>

              {/* Occurrence */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Occurrence (Frequency):{" "}
                  <span className="text-blue-600 font-bold">{occurrence}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={occurrence}
                  onChange={(e) => setOccurrence(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {occurrence >= 9
                    ? "9-10: Almost certain (≥33% of time)"
                    : occurrence >= 7
                      ? "7-8: Frequent (5-12% of time)"
                      : occurrence >= 5
                        ? "5-6: Moderate (0.25-1.25%)"
                        : occurrence >= 3
                          ? "3-4: Low (0.007-0.05%)"
                          : "1-2: Rare (≤0.0007%)"}
                </div>
              </div>

              {/* Detection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Detection (Ability to Catch):{" "}
                  <span className="text-blue-600 font-bold">{detection}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={detection}
                  onChange={(e) => setDetection(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {detection >= 9
                    ? "9-10: No detection method (defects reach customer)"
                    : detection >= 7
                      ? "7-8: Very low detection chance"
                      : detection >= 5
                        ? "5-6: Moderate detection"
                        : detection >= 3
                          ? "3-4: High detection chance"
                          : "1-2: Detection almost certain (caught before shipping)"}
                </div>
              </div>

              {/* Calculated RPN */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    Risk Priority Number (RPN)
                  </div>
                  <div className="text-5xl font-bold text-blue-700 mb-2">
                    {calculatedRPN}
                  </div>
                  <div className="text-sm text-gray-600">
                    {severity} (Severity) × {occurrence} (Occurrence) ×{" "}
                    {detection} (Detection)
                  </div>
                  <div
                    className={`inline-block mt-3 px-4 py-2 rounded text-sm font-bold ${
                      calculatedRPN >= 200
                        ? "bg-red-100 text-red-800"
                        : calculatedRPN >= 100
                          ? "bg-orange-100 text-orange-800"
                          : calculatedRPN >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {calculatedRPN >= 200
                      ? "CRITICAL RISK"
                      : calculatedRPN >= 100
                        ? "HIGH RISK"
                        : calculatedRPN >= 50
                          ? "MEDIUM RISK"
                          : "LOW RISK"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={calculateRPN}
                  className="flex-1 bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
                >
                  Save RPN Assessment
                </button>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="px-6 py-3 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by CAPA number or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded px-4 py-2"
        />

        <select
          value={riskLevelFilter}
          onChange={(e) => setRiskLevelFilter(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="all">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="rpn">Sort by RPN (High to Low)</option>
          <option value="severity">Sort by Severity</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Risk Assessments Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                CAPA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                S
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                O
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                D
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                Initial RPN
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                Post-Action RPN
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                Reduction
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                Risk Level
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredAssessments.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No risk assessments found
                </td>
              </tr>
            ) : (
              filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-600">
                      {assessment.capa.capaNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm max-w-xs truncate">
                      {assessment.capa.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold">{assessment.severity}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold">{assessment.occurrence}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold">{assessment.detection}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div
                      className={`font-bold text-lg ${
                        assessment.initialRPN >= 200
                          ? "text-red-700"
                          : assessment.initialRPN >= 100
                            ? "text-orange-600"
                            : assessment.initialRPN >= 50
                              ? "text-yellow-600"
                              : "text-blue-600"
                      }`}
                    >
                      {assessment.initialRPN}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {assessment.postActionRPN ? (
                      <div className="font-bold text-green-700">
                        {assessment.postActionRPN}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {assessment.reductionPercent ? (
                      <div className="text-green-700 font-bold">
                        ↓ {assessment.reductionPercent}%
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        assessment.riskLevel === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : assessment.riskLevel === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : assessment.riskLevel === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {assessment.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        assessment.capa.status === "CLOSED"
                          ? "bg-green-100 text-green-800"
                          : assessment.capa.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {assessment.capa.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FMEA Methodology Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">📘 FMEA Risk Scoring Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-bold text-blue-900 mb-2">Severity (S)</div>
            <div className="space-y-1 text-gray-700">
              <div>10: Death, serious injury, FDA recall</div>
              <div>7-9: Injury, product recall</div>
              <div>4-6: Performance impact</div>
              <div>1-3: Minor/no impact</div>
            </div>
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2">Occurrence (O)</div>
            <div className="space-y-1 text-gray-700">
              <div>10: Almost certain (≥50%)</div>
              <div>7-9: Frequent (5-33%)</div>
              <div>4-6: Moderate (&lt;1.25%)</div>
              <div>1-3: Rare (&lt;0.05%)</div>
            </div>
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2">Detection (D)</div>
            <div className="space-y-1 text-gray-700">
              <div>10: No detection method</div>
              <div>7-9: Very low detection</div>
              <div>4-6: Moderate detection</div>
              <div>1-3: Almost certain detection</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-300">
          <div className="font-bold text-blue-900 mb-2">
            Risk Priority Number (RPN) = S × O × D
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-red-100 text-red-800 p-2 rounded text-center font-bold">
              ≥200: CRITICAL
              <br />
              Immediate action
            </div>
            <div className="bg-orange-100 text-orange-800 p-2 rounded text-center font-bold">
              100-199: HIGH
              <br />
              Urgent priority
            </div>
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center font-bold">
              50-99: MEDIUM
              <br />
              Scheduled action
            </div>
            <div className="bg-blue-100 text-blue-800 p-2 rounded text-center font-bold">
              &lt;50: LOW
              <br />
              Monitor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
