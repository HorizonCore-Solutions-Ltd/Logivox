"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BOL {
  id: string;
  bolNumber: string;
  shipmentId: string;
  carrierName: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  shipperInfo: any;
  consigneeInfo: any;
  items: Array<{
    description: string;
    quantity: number;
    weight: number;
    packageType: string;
    class?: string;
  }>;
  totalWeight: number;
  totalPieces: number;
  specialInstructions?: string;
  declaredValue?: number;
  freightCharges: string;
  signatures: Array<{
    signerName: string;
    signerRole: string;
    signedAt: Date;
    signatureUrl: string;
    notes?: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  }>;
  pdfUrl?: string;
}

interface BOLMetrics {
  totalBOLs: number;
  bolsToday: number;
  pendingSignatures: number;
  completedBOLs: number;
  avgProcessingTime: number;
  complianceRate: number;
  bolsByCarrier: Array<{
    carrier: string;
    count: number;
    percentage: number;
  }>;
  documentTypes: Array<{
    type: string;
    count: number;
  }>;
}

export default function BOLManagement() {
  const [bols, setBOLs] = useState<BOL[]>([]);
  const [metrics, setMetrics] = useState<BOLMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bolsRes, metricsRes] = await Promise.all([
        fetch("/api/dock/bol?action=recent_bols&limit=15"),
        fetch("/api/dock/bol?action=bol_metrics"),
      ]);

      const bolsData = await bolsRes.json();
      const metricsData = await metricsRes.json();

      setBOLs(bolsData.bols || []);
      setMetrics(metricsData.metrics);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING_CARRIER_SIGNATURE":
        return "bg-yellow-100 text-yellow-800";
      case "SIGNED":
        return "bg-green-100 text-green-800";
      case "DELIVERED":
        return "bg-blue-100 text-blue-800";
      case "VOIDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingBOLs = bols.filter(
    (b) => b.status === "PENDING_CARRIER_SIGNATURE" || b.status === "DRAFT",
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📋 BOL & Documentation</h1>
          <p className="text-gray-600">
            Bill of lading generation and compliance management
          </p>
        </div>
        <Button>+ Create BOL</Button>
      </div>

      {/* Pending Signatures Alert */}
      {pendingBOLs.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              ✍️ {pendingBOLs.length} BOL{pendingBOLs.length !== 1 ? "s" : ""}{" "}
              Pending Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingBOLs.slice(0, 3).map((bol) => (
                <div key={bol.id} className="p-2 bg-white rounded text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{bol.bolNumber}</span>
                    <span className="text-gray-600">{bol.carrierName}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3">
              Review All Pending
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total BOLs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.totalBOLs || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics?.bolsToday || 0} created today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics?.complianceRate?.toFixed(0) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">with all documents</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {metrics?.pendingSignatures || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">require action</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {metrics?.avgProcessingTime?.toFixed(0) || 0}m
            </div>
            <div className="text-sm text-gray-600 mt-1">to full signature</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bols" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bols">📋 BOLs</TabsTrigger>
          <TabsTrigger value="templates">📄 Templates</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* BOLs Tab */}
        <TabsContent value="bols" className="space-y-4">
          <div className="space-y-3">
            {bols.map((bol) => {
              const shipperSigned = bol.signatures.some(
                (s) => s.signerRole === "SHIPPER",
              );
              const carrierSigned = bol.signatures.some(
                (s) => s.signerRole === "CARRIER",
              );
              const consigneeSigned = bol.signatures.some(
                (s) => s.signerRole === "CONSIGNEE",
              );

              return (
                <Card key={bol.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${getStatusColor(bol.status)}`}
                          >
                            {bol.status.replace(/_/g, " ")}
                          </span>
                          {bol.declaredValue && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                              ${bol.declaredValue.toLocaleString()} Declared
                            </span>
                          )}
                        </div>

                        <div className="font-medium text-lg mb-1">
                          {bol.bolNumber}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {bol.shipmentId} • {bol.carrierName}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600 mb-1">
                              Shipper
                            </div>
                            <div className="font-medium text-sm">
                              {bol.shipperInfo.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {bol.shipperInfo.city}, {bol.shipperInfo.state}
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600 mb-1">
                              Consignee
                            </div>
                            <div className="font-medium text-sm">
                              {bol.consigneeInfo.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {bol.consigneeInfo.city},{" "}
                              {bol.consigneeInfo.state}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Items:</span>{" "}
                            <span className="font-medium">
                              {bol.items.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Pieces:</span>{" "}
                            <span className="font-medium">
                              {bol.totalPieces}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Weight:</span>{" "}
                            <span className="font-medium">
                              {bol.totalWeight.toFixed(1)} lbs
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Charges:</span>{" "}
                            <span className="font-medium">
                              {bol.freightCharges}
                            </span>
                          </div>
                        </div>

                        {/* Signature Status */}
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span
                              className={
                                shipperSigned
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {shipperSigned ? "✓" : "○"}
                            </span>
                            <span
                              className={
                                shipperSigned
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }
                            >
                              Shipper
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={
                                carrierSigned
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {carrierSigned ? "✓" : "○"}
                            </span>
                            <span
                              className={
                                carrierSigned
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }
                            >
                              Carrier
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={
                                consigneeSigned
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {consigneeSigned ? "✓" : "○"}
                            </span>
                            <span
                              className={
                                consigneeSigned
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }
                            >
                              Consignee
                            </span>
                          </div>
                        </div>

                        {bol.attachedDocuments.length > 0 && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            📎 {bol.attachedDocuments.length} document
                            {bol.attachedDocuments.length !== 1 ? "s" : ""}{" "}
                            attached
                          </div>
                        )}

                        {bol.specialInstructions && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                            <div className="font-medium text-yellow-800">
                              Special Instructions:
                            </div>
                            <div className="text-gray-700">
                              {bol.specialInstructions}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {bol.pdfUrl && (
                          <Button size="sm">📄 Download PDF</Button>
                        )}
                        <Button size="sm" variant="outline">
                          👁️ View Details
                        </Button>
                        {!carrierSigned && shipperSigned && (
                          <Button size="sm" className="bg-green-600">
                            ✍️ Sign (Carrier)
                          </Button>
                        )}
                        {bol.status === "DRAFT" && (
                          <Button size="sm" variant="destructive">
                            ❌ Void
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Standard BOL Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Standard bill of lading for general freight shipments
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• Shipper & consignee information</li>
                    <li>• Item details with NMFC codes</li>
                    <li>• Freight charges designation</li>
                    <li>• Triple signature workflow</li>
                  </ul>
                  <Button size="sm" className="w-full">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hazmat BOL Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Specialized template for hazardous materials shipping
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>• DOT hazmat classifications</li>
                    <li>• Emergency contact information</li>
                    <li>• Special handling instructions</li>
                    <li>• Required certifications</li>
                  </ul>
                  <Button size="sm" className="w-full">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Packing List", required: true },
                  { name: "Commercial Invoice", required: true },
                  { name: "Certificate of Origin", required: false },
                  { name: "Inspection Report", required: false },
                  { name: "Customs Forms", required: false },
                  { name: "Insurance Certificate", required: false },
                ].map((doc) => (
                  <div key={doc.name} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm mb-1">{doc.name}</div>
                    <div
                      className={`text-xs ${doc.required ? "text-red-600" : "text-gray-600"}`}
                    >
                      {doc.required ? "Required" : "Optional"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>BOLs by Carrier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.bolsByCarrier?.map((carrier) => (
                    <div key={carrier.carrier}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {carrier.carrier}
                        </span>
                        <span className="text-sm text-gray-600">
                          {carrier.count} ({carrier.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${carrier.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.documentTypes?.map((doc) => (
                    <div
                      key={doc.type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">
                        {doc.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium">{doc.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Development</span>
                    <span className="font-medium">$28,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Document Templates</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">E-Signature System</span>
                    <span className="font-medium">$12,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$4,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$52,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Paper Elimination</span>
                    <span className="font-medium text-green-600">$85,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Efficiency</span>
                    <span className="font-medium text-green-600">$68,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Compliance Savings</span>
                    <span className="font-medium text-green-600">$42,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Faster Processing</span>
                    <span className="font-medium text-green-600">$35,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $230,000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-3xl font-bold text-green-600">442%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.7</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600 mt-1">Digital BOLs</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">90%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Faster processing
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% paperless BOLs</strong> - Complete digital
                      transformation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>90% faster processing</strong> - E-signatures
                      eliminate delays
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% compliance tracking</strong> - Automated
                      document verification
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>95% error reduction</strong> - Standardized
                      templates and validation
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
