"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

// ============================================
// CAPA SYSTEM 16: CLOSURE VERIFICATION
// ============================================
// Automated verification before CAPA closure
// Prevents premature closure, ensures completeness

interface CheckResult {
  id: string;
  category: string;
  requirement: string;
  critical: boolean;
  passed: boolean;
  evidence: string;
  recommendation: string;
  description: string;
  overridden?: boolean;
  overrideReason?: string;
}

export default function ClosureVerificationPage() {
  const { data: session } = useSession();
  const [capaNumber, setCapaNumber] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const verifyClosureReadiness = async () => {
    if (!capaNumber) {
      alert("Please enter CAPA number");
      return;
    }

    try {
      setLoading(true);

      // First, find CAPA by number
      const searchResponse = await fetch(`/api/capa?capaNumber=${capaNumber}`);
      const searchData = await searchResponse.json();

      if (!searchData.capa) {
        alert("CAPA not found");
        return;
      }

      // Run verification
      const response = await fetch("/api/capa/closure-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_CLOSURE_READINESS",
          capaId: searchData.capa.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult(result);
      } else {
        alert(result.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to verify CAPA closure readiness");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Investigation":
        return "🔍";
      case "Actions":
        return "⚡";
      case "Effectiveness":
        return "✅";
      case "Training":
        return "📚";
      case "Documentation":
        return "📄";
      case "Approval":
        return "👔";
      case "Customer Impact":
        return "👥";
      default:
        return "📋";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🔒 CAPA Closure Verification</h1>
        <p className="text-gray-600 mt-1">
          Automated validation of closure criteria before closing CAPAs
        </p>
      </div>

      {/* Verification Input */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-bold text-lg mb-4">
          Verify CAPA Closure Readiness
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={capaNumber}
            onChange={(e) => setCapaNumber(e.target.value)}
            placeholder="Enter CAPA number (e.g., CAPA-2026-001)"
            className="flex-1 border rounded px-4 py-3 text-lg"
            onKeyPress={(e) => e.key === "Enter" && verifyClosureReadiness()}
          />
          <button
            onClick={verifyClosureReadiness}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 text-lg"
          >
            {loading ? "Verifying..." : "🔍 Verify"}
          </button>
        </div>
      </div>

      {/* Verification Results */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Overall Status Card */}
          <div
            className={`border-2 rounded-lg p-6 ${
              verificationResult.overallStatus === "APPROVED"
                ? "bg-green-50 border-green-500"
                : verificationResult.overallStatus === "REJECTED"
                  ? "bg-red-50 border-red-500"
                  : "bg-yellow-50 border-yellow-500"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl">
                {verificationResult.overallStatus === "APPROVED"
                  ? "✅"
                  : verificationResult.overallStatus === "REJECTED"
                    ? "❌"
                    : "⚠️"}
              </div>
              <div className="flex-1">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    verificationResult.overallStatus === "APPROVED"
                      ? "text-green-800"
                      : verificationResult.overallStatus === "REJECTED"
                        ? "text-red-800"
                        : "text-yellow-800"
                  }`}
                >
                  {verificationResult.overallStatus === "APPROVED"
                    ? "READY TO CLOSE"
                    : verificationResult.overallStatus === "REJECTED"
                      ? "CANNOT CLOSE"
                      : "NEEDS REVIEW"}
                </div>
                <div
                  className={`text-lg ${
                    verificationResult.overallStatus === "APPROVED"
                      ? "text-green-700"
                      : verificationResult.overallStatus === "REJECTED"
                        ? "text-red-700"
                        : "text-yellow-700"
                  }`}
                >
                  {verificationResult.message}
                </div>
              </div>
            </div>

            {/* Completion Score */}
            <div className="mt-6 bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Completion Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {verificationResult.completionScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    verificationResult.completionScore >= 90
                      ? "bg-green-500"
                      : verificationResult.completionScore >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${verificationResult.completionScore}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-gray-600">Passed</div>
                  <div className="text-xl font-bold text-green-600">
                    {verificationResult.verification.checksPassedCount}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Failed</div>
                  <div className="text-xl font-bold text-red-600">
                    {verificationResult.verification.checksFailedCount}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Critical Failures</div>
                  <div className="text-xl font-bold text-red-700">
                    {verificationResult.criticalFailures}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Checks (if any) */}
          {verificationResult.checkResults &&
            verificationResult.checkResults.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="font-bold text-lg mb-4 text-red-700">
                  ❌ Failed Checks ({verificationResult.checkResults.length})
                </h2>
                <div className="space-y-4">
                  {verificationResult.checkResults.map((check: CheckResult) => (
                    <div
                      key={check.id}
                      className={`border-l-4 p-4 rounded ${
                        check.critical
                          ? "bg-red-50 border-red-500"
                          : "bg-yellow-50 border-yellow-500"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {getCategoryIcon(check.category)}
                          </span>
                          <div>
                            <div className="font-bold text-lg">
                              {check.requirement}
                            </div>
                            <div className="text-sm text-gray-600">
                              {check.category}
                            </div>
                          </div>
                        </div>
                        {check.critical && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            CRITICAL
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <span className="font-medium">Evidence: </span>
                          <span className="text-gray-700">
                            {check.evidence}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Description: </span>
                          <span className="text-gray-600 text-sm">
                            {check.description}
                          </span>
                        </div>
                        {check.recommendation && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                            <div className="font-medium text-blue-900">
                              💡 Recommendation:
                            </div>
                            <div className="text-blue-800 text-sm mt-1">
                              {check.recommendation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* All Checks Summary */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">📋 Complete Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(
                verificationResult.verification.checkResults as CheckResult[]
              ).map((check) => (
                <div
                  key={check.id}
                  className={`flex items-center gap-3 p-3 rounded border ${
                    check.passed
                      ? "bg-green-50 border-green-200"
                      : check.critical
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="text-2xl">
                    {check.passed ? "✅" : check.critical ? "❌" : "⚠️"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {check.requirement}
                    </div>
                    <div className="text-xs text-gray-600">
                      {check.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {verificationResult.canClose && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">
              <div className="text-green-800 font-bold text-lg mb-2">
                ✅ This CAPA has passed all critical checks and is ready to be
                closed!
              </div>
              <button className="mt-4 px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-lg">
                Proceed to Close CAPA
              </button>
            </div>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">
          🤖 How Automated Verification Works
        </h3>
        <div className="space-y-3 text-gray-700">
          <div className="flex gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <div>
              <div className="font-medium">Enter CAPA Number</div>
              <div className="text-sm">
                System retrieves complete CAPA data including actions, training,
                effectiveness, etc.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <div>
              <div className="font-medium">
                AI Validation Engine Runs 14 Checks
              </div>
              <div className="text-sm">
                Automatically validates root cause, actions, effectiveness,
                training, documentation, approvals, and customer impacts
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <div>
              <div className="font-medium">Critical vs. Optional Criteria</div>
              <div className="text-sm">
                8 CRITICAL checks must pass. 6 optional checks improve score but
                don't block closure.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-600">4.</span>
            <div>
              <div className="font-medium">Instant Decision</div>
              <div className="text-sm">
                ✅ APPROVED (ready), ❌ REJECTED (critical failures), ⚠️ NEEDS
                REVIEW (optional failures)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-blue-300">
          <div className="font-bold text-blue-900 mb-2">Benefits:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>• Prevents premature closure</div>
            <div>• Ensures FDA compliance</div>
            <div>• Reduces audit findings</div>
            <div>• Standardizes closure criteria</div>
            <div>• Saves QA manager time</div>
            <div>• Increases CAPA effectiveness</div>
          </div>
        </div>
      </div>
    </div>
  );
}
