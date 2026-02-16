/**
 * CAPA Blockchain Audit Trail Viewer
 * Displays immutable blockchain record for FDA compliance
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Shield,
  Lock,
  AlertTriangle,
  Download,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";

interface BlockchainBlock {
  index: number;
  timestamp: string;
  capaId: string;
  action: string;
  data: any;
  userId: string;
  userName: string;
  previousHash: string;
  hash: string;
  signature?: string;
  verified: boolean;
}

interface IntegrityReport {
  isValid: boolean;
  tamperedBlocks: number[];
  brokenChainAt: number | null;
  totalBlocks: number;
  verifiedBlocks: number;
}

interface ComplianceMetrics {
  totalActions: number;
  uniqueUsers: number;
  signedBlocks: number;
  verifiedBlocks: number;
  integrityPercentage: number;
  signaturePercentage: number;
  completedSteps: number;
  requiredSteps: number;
  compliancePercentage: number;
  fdaCompliant: boolean;
  requirements: {
    creation: boolean;
    rootCauseAnalysis: boolean;
    correctiveActions: boolean;
    verification: boolean;
    closure: boolean;
  };
}

export default function BlockchainAuditTrailPage() {
  const params = useParams();
  const capaId = params.id as string;

  const [blockchain, setBlockchain] = useState<BlockchainBlock[]>([]);
  const [capaNumber, setCapaNumber] = useState<string>("");
  const [integrityReport, setIntegrityReport] =
    useState<IntegrityReport | null>(null);
  const [complianceMetrics, setComplianceMetrics] =
    useState<ComplianceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchBlockchain = async (verify: boolean = false) => {
    setIsLoading(true);
    try {
      const url = `/api/capa/blockchain?capaId=${capaId}&verify=${verify}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch blockchain");

      const data = await response.json();
      setBlockchain(data.blockchain || []);
      setCapaNumber(data.capaNumber || "");
      setIntegrityReport(data.integrityReport);
      setComplianceMetrics(data.complianceMetrics);
    } catch (error) {
      console.error("Error fetching blockchain:", error);
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (capaId) {
      fetchBlockchain(false);
    }
  }, [capaId]);

  const handleVerify = () => {
    setIsVerifying(true);
    fetchBlockchain(true);
  };

  const handleExport = () => {
    const exportData = {
      capaNumber,
      blockchain,
      integrityReport,
      complianceMetrics,
      exportedAt: new Date().toISOString(),
      exportedBy: "Current User",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CAPA-${capaNumber}-Blockchain-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Blockchain Audit Trail
          </h1>
          <p className="text-gray-600 mt-1">
            CAPA {capaNumber} · Immutable Record · FDA 21 CFR Part 11
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Verify Integrity
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* Integrity Status */}
      {integrityReport && (
        <Card
          className={
            integrityReport.isValid
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {integrityReport.isValid ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900">
                      Blockchain Verified ✓
                    </h3>
                    <p className="text-green-700">
                      All {integrityReport.totalBlocks} blocks verified. No
                      tampering detected. Chain integrity intact.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-900">
                      Integrity Compromised
                    </h3>
                    <p className="text-red-700">
                      {integrityReport.tamperedBlocks.length} tampered block(s)
                      detected.
                      {integrityReport.brokenChainAt &&
                        ` Chain broken at block ${integrityReport.brokenChainAt}.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Metrics */}
      {complianceMetrics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                FDA Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl font-bold ${
                    complianceMetrics.fdaCompliant
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {complianceMetrics.compliancePercentage}%
                </div>
                {complianceMetrics.fdaCompliant ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {complianceMetrics.completedSteps}/
                {complianceMetrics.requiredSteps} requirements met
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Integrity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {complianceMetrics.integrityPercentage}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {complianceMetrics.verifiedBlocks}/
                {complianceMetrics.totalActions} blocks verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Digital Signatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {complianceMetrics.signedBlocks}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {complianceMetrics.signaturePercentage}% of blocks signed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Audit Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {complianceMetrics.uniqueUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Unique users in audit trail
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FDA Requirements Checklist */}
      {complianceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>FDA 21 CFR Part 11 Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(complianceMetrics.requirements).map(
                ([key, met]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border-2 ${
                      met
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          met ? "text-green-900" : "text-gray-600"
                        }`}
                      >
                        {met ? "Complete" : "Pending"}
                      </span>
                    </div>
                    <div className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockchain Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Immutable Blockchain Record</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blockchain.map((block, index) => (
              <div key={block.index} className="relative">
                {/* Chain Link */}
                {index > 0 && (
                  <div className="absolute left-6 -top-4 h-4 w-0.5 bg-blue-300" />
                )}

                <div
                  className={`border-2 rounded-lg p-4 ${
                    block.verified
                      ? "border-blue-200 bg-blue-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Block Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        block.verified ? "bg-blue-500" : "bg-red-500"
                      }`}
                    >
                      {block.verified ? (
                        <Lock className="h-6 w-6 text-white" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-white" />
                      )}
                    </div>

                    {/* Block Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">Block #{block.index}</Badge>
                        <span className="text-sm font-medium">
                          {block.action}
                        </span>
                        {block.signature && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        )}
                        {block.verified && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Timestamp:</span>{" "}
                          <span className="font-mono">
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">User:</span>{" "}
                          {block.userName}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Hash:</span>{" "}
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {block.hash.substring(0, 32)}...
                          </code>
                        </div>
                        {index > 0 && (
                          <div className="col-span-2 flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">
                              Previous:
                            </span>{" "}
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {block.previousHash.substring(0, 32)}...
                            </code>
                          </div>
                        )}
                      </div>

                      {/* Block Data */}
                      {block.data && Object.keys(block.data).length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View block data
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(block.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {blockchain.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No blockchain records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
