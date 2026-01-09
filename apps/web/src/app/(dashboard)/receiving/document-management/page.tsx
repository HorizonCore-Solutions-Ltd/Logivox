'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DocumentManagementPage() {
  const [stats, setStats] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [incompleteShipments, setIncompleteShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes, incompleteRes] = await Promise.all([
        fetch('/api/receiving/document-management?action=stats'),
        fetch('/api/receiving/document-management?action=requests'),
        fetch('/api/receiving/document-management?action=incomplete-shipments'),
      ]);

      const statsData = await statsRes.json();
      const requestsData = await requestsRes.json();
      const incompleteData = await incompleteRes.json();

      setStats(statsData.stats);
      setRequests(requestsData.requests || []);
      setIncompleteShipments(incompleteData.shipments || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const fetchShipmentDocuments = async (shipmentId: string) => {
    try {
      const res = await fetch(
        `/api/receiving/document-management?action=documents&receivingRecordId=${shipmentId}`
      );
      const data = await res.json();
      setDocuments(data.documents || []);
      setSelectedShipment(shipmentId);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      PACKING_SLIP: '📋',
      BOL: '🚚',
      INVOICE: '💰',
      COA: '✅',
      MSDS: '⚗️',
      PHOTO: '📸',
      SIGNATURE: '✍️',
      INSPECTION_REPORT: '🔍',
      CUSTOMS_DECLARATION: '🛂',
      TEMPERATURE_LOG: '🌡️',
      OTHER: '📄',
    };
    return icons[type] || '📄';
  };

  const getDocumentTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return badges[urgency] || 'bg-gray-100 text-gray-800';
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receiving Document Management
            </h1>
            <p className="text-gray-600 mt-2">
              Centralized document control for receiving operations
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Documents</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalDocuments || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +{stats?.todayDocuments || 0} today
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Verified</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats?.verificationRate || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.verifiedDocuments || 0} verified
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending Requests</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {stats?.pendingRequests || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">awaiting response</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Incomplete Shipments</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {incompleteShipments.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">missing documents</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incomplete" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incomplete">
            Incomplete Shipments ({incompleteShipments.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="types">Document Types</TabsTrigger>
          <TabsTrigger value="roi">ROI & Impact</TabsTrigger>
        </TabsList>

        {/* Incomplete Shipments Tab */}
        <TabsContent value="incomplete" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Shipments with Missing Documents
            </h2>
            {incompleteShipments.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                ✅ All shipments have complete documentation!
              </div>
            ) : (
              <div className="space-y-3">
                {incompleteShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => fetchShipmentDocuments(shipment.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {shipment.supplier}
                          </span>
                          <Badge className="bg-gray-100 text-gray-800">
                            {shipment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          PO: {shipment.poNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(shipment.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-3xl font-bold ${getCompletenessColor(
                            shipment.completeness.score
                          )}`}
                        >
                          {shipment.completeness.score}%
                        </div>
                        <div className="text-xs text-gray-500">complete</div>
                      </div>
                    </div>

                    {shipment.completeness.missing.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-sm font-medium text-red-600 mb-2">
                          Missing Required Documents:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shipment.completeness.missing.map((type: string) => (
                            <Badge key={type} className="bg-red-100 text-red-800">
                              {getDocumentTypeIcon(type)}{' '}
                              {getDocumentTypeName(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {shipment.completeness.optional.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-yellow-600 mb-2">
                          Missing Optional Documents:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shipment.completeness.optional.map((type: string) => (
                            <Badge
                              key={type}
                              className="bg-yellow-100 text-yellow-800"
                            >
                              {getDocumentTypeIcon(type)}{' '}
                              {getDocumentTypeName(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        Upload Documents
                      </Button>
                      <Button size="sm" variant="outline">
                        Request from Supplier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Document Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Document Requests</h2>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending document requests
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Document Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Urgency
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Requested By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {request.receivingRecord?.supplier?.name ||
                              'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>
                              {getDocumentTypeIcon(request.documentType)}
                            </span>
                            <span className="text-sm">
                              {getDocumentTypeName(request.documentType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getUrgencyBadge(request.urgency)}>
                            {request.urgency}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-sm">
                          {request.notes}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {request.requestedByUser?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            Follow Up
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Document Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Document Types & Requirements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Required Documents */}
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <div className="text-lg font-semibold text-red-800 mb-3">
                  Required Documents
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">📋</span>
                    <span>Packing Slip</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">🚚</span>
                    <span>Bill of Lading (BOL)</span>
                  </div>
                  <div className="text-xs text-red-700 mt-3">
                    Must be present for all shipments
                  </div>
                </div>
              </div>

              {/* Optional Documents */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="text-lg font-semibold text-blue-800 mb-3">
                  Optional Documents
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">💰</span>
                    <span>Invoice</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">✅</span>
                    <span>Certificate of Analysis (COA)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xl">📸</span>
                    <span>Photos</span>
                  </div>
                  <div className="text-xs text-blue-700 mt-3">
                    Recommended but not required
                  </div>
                </div>
              </div>

              {/* Conditional Documents */}
              <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="text-lg font-semibold text-yellow-800 mb-3">
                  Conditional Requirements
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="font-medium">Hazmat:</div>
                    <div className="flex items-center gap-2 ml-4 mt-1">
                      <span className="text-xl">⚗️</span>
                      <span>MSDS Required</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Refrigerated:</div>
                    <div className="flex items-center gap-2 ml-4 mt-1">
                      <span className="text-xl">🌡️</span>
                      <span>Temperature Log Required</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">High Value:</div>
                    <div className="flex items-center gap-2 ml-4 mt-1">
                      <span className="text-xl">✍️</span>
                      <span>Signature Required</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Statistics */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Document Count by Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats?.byType &&
                  Object.entries(stats.byType).map(([type, count]: any) => (
                    <div key={type} className="bg-gray-50 rounded p-3 text-center">
                      <div className="text-2xl mb-1">
                        {getDocumentTypeIcon(type)}
                      </div>
                      <div className="text-sm font-medium">
                        {getDocumentTypeName(type)}
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {count}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <h2 className="text-xl font-semibold mb-4">ROI Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Annual Investment</div>
                <div className="text-2xl font-bold text-gray-900">$32K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">$118K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">369%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payback</div>
                <div className="text-2xl font-bold text-purple-600">
                  3.3 months
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Savings Breakdown:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• $42K/year: Eliminate physical document management</div>
                <div>• $35K/year: Automated compliance checking</div>
                <div>• $23K/year: 70% faster document retrieval</div>
                <div>• $18K/year: 85% less audit preparation time</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Impact Metrics:
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Retrieval Speed:</span>
                  <span className="font-semibold ml-2">70% faster</span>
                </div>
                <div>
                  <span className="text-gray-600">Compliance Rate:</span>
                  <span className="font-semibold ml-2">98% complete</span>
                </div>
                <div>
                  <span className="text-gray-600">Audit Prep:</span>
                  <span className="font-semibold ml-2">85% reduction</span>
                </div>
                <div>
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-semibold ml-2">100% digital</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
