'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface LoadVerification {
  id: string;
  shipmentId: string;
  dockId: string;
  verifierName: string;
  verificationType: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  scannedItems: number;
  passedItems: number;
  discrepancies: number;
  verificationScore: number;
}

interface Discrepancy {
  id: string;
  verificationId: string;
  itemId: string;
  sku: string;
  discrepancyType: string;
  severity: string;
  description: string;
  status: string;
  reportedAt: Date;
  reportedBy: string;
  resolvedAt?: Date;
  resolution?: string;
  imageUrl?: string;
  actionRequired?: string;
}

interface QualityMetrics {
  totalVerifications: number;
  passRate: number;
  avgVerificationTime: number;
  avgAccuracy: number;
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  topIssues: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  verifierPerformance: Array<{
    verifierId: string;
    verifierName: string;
    verificationsCompleted: number;
    avgAccuracy: number;
    avgTime: number;
  }>;
}

export default function LoadVerification() {
  const [activeVerifications, setActiveVerifications] = useState<LoadVerification[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [currentScan, setCurrentScan] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [verificationsRes, discrepanciesRes, metricsRes] = await Promise.all([
        fetch('/api/dock/verification?action=active_verifications'),
        fetch('/api/dock/verification?action=discrepancies'),
        fetch('/api/dock/verification?action=quality_metrics'),
      ]);

      const verificationsData = await verificationsRes.json();
      const discrepanciesData = await discrepanciesRes.json();
      const metricsData = await metricsRes.json();

      setActiveVerifications(verificationsData.verifications || []);
      setDiscrepancies(discrepanciesData.discrepancies || []);
      setMetrics(metricsData.metrics);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'PASSED_WITH_EXCEPTIONS': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscrepancyIcon = (type: string) => {
    switch (type) {
      case 'QUANTITY_MISMATCH': return '📊';
      case 'DAMAGED_ITEM': return '💥';
      case 'MISSING_ITEM': return '❓';
      case 'WRONG_ITEM': return '❌';
      case 'PACKAGING_ISSUE': return '📦';
      default: return '⚠️';
    }
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentScan) {
      // Process scan
      console.log('Scanned:', currentScan);
      setCurrentScan('');
      // In production, call API to verify item
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

  const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'CRITICAL' && d.status === 'OPEN');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">✓ Loading Verification & QC</h1>
          <p className="text-gray-600">
            Scan validation and quality control for outbound shipments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={scanMode ? 'default' : 'outline'}
            onClick={() => setScanMode(!scanMode)}
          >
            {scanMode ? '📷 Scanning...' : '📷 Start Scan'}
          </Button>
          <Button>+ New Verification</Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalDiscrepancies.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              🚨 {criticalDiscrepancies.length} Critical Discrepanc{criticalDiscrepancies.length !== 1 ? 'ies' : 'y'} Require Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalDiscrepancies.slice(0, 3).map((disc) => (
                <div key={disc.id} className="p-2 bg-white rounded text-sm">
                  <div className="font-medium">{disc.sku} - {disc.discrepancyType.replace(/_/g, ' ')}</div>
                  <div className="text-gray-600">{disc.description}</div>
                  <div className="text-red-600 mt-1">Action: {disc.actionRequired}</div>
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3" variant="destructive">
              Review All Critical Issues
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan Mode */}
      {scanMode && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📷</div>
              <div className="text-lg font-medium mb-2">Scan Item Barcode</div>
              <Input
                type="text"
                placeholder="Scan or enter barcode..."
                value={currentScan}
                onChange={(e) => setCurrentScan(e.target.value)}
                onKeyDown={handleScan}
                className="max-w-md mx-auto text-lg"
                autoFocus
              />
              <div className="text-sm text-gray-600 mt-2">
                Scan barcode or press Enter to verify
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics?.passRate?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics?.totalVerifications || 0} verifications
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.avgAccuracy?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">average score</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {discrepancies.filter(d => d.status === 'OPEN').length}
            </div>
            <div className="text-sm text-red-600 mt-1">
              {metrics?.criticalDiscrepancies || 0} critical
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {metrics?.avgVerificationTime?.toFixed(0) || 0}m
            </div>
            <div className="text-sm text-gray-600 mt-1">per verification</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">⚡ Active Verifications</TabsTrigger>
          <TabsTrigger value="discrepancies">⚠️ Discrepancies</TabsTrigger>
          <TabsTrigger value="quality">📊 Quality Metrics</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Active Verifications Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeVerifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No active verifications
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeVerifications.map((verification) => {
                const progress = verification.totalItems > 0
                  ? (verification.scannedItems / verification.totalItems) * 100
                  : 0;

                return (
                  <Card key={verification.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(verification.status)}`}>
                              {verification.status}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                              {verification.verificationType.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="font-medium text-lg mb-1">
                            {verification.shipmentId} - {verification.dockId}
                          </div>
                          <div className="text-sm text-gray-600">{verification.id}</div>

                          <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-600">Verifier:</span>{' '}
                              <span className="font-medium">{verification.verifierName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Started:</span>{' '}
                              <span className="font-medium">
                                {new Date(verification.startedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Items:</span>{' '}
                              <span className="font-medium">
                                {verification.scannedItems} / {verification.totalItems}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Issues:</span>{' '}
                              <span className={`font-medium ${verification.discrepancies > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {verification.discrepancies}
                              </span>
                            </div>
                          </div>

                          {verification.discrepancies > 0 && (
                            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                              ⚠️ {verification.discrepancies} discrepanc{verification.discrepancies !== 1 ? 'ies' : 'y'} detected
                            </div>
                          )}
                        </div>

                        <div className="ml-4 w-40">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold text-blue-600">
                              {progress.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">Progress</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {verification.verificationScore > 0 && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                verification.verificationScore >= 95 ? 'text-green-600' :
                                verification.verificationScore >= 85 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {verification.verificationScore.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Score</div>
                            </div>
                          )}
                          {progress === 100 && (
                            <Button size="sm" className="w-full mt-2">
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Discrepancies Tab */}
        <TabsContent value="discrepancies" className="space-y-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card className="border-red-300">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {discrepancies.filter(d => d.severity === 'CRITICAL' && d.status === 'OPEN').length}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </CardContent>
            </Card>
            <Card className="border-orange-300">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {discrepancies.filter(d => d.severity === 'HIGH' && d.status === 'OPEN').length}
                </div>
                <div className="text-sm text-gray-600">High</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-300">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {discrepancies.filter(d => d.severity === 'MEDIUM' && d.status === 'OPEN').length}
                </div>
                <div className="text-sm text-gray-600">Medium</div>
              </CardContent>
            </Card>
            <Card className="border-blue-300">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {discrepancies.filter(d => d.severity === 'LOW' && d.status === 'OPEN').length}
                </div>
                <div className="text-sm text-gray-600">Low</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {discrepancies.map((disc) => (
              <Card key={disc.id} className={disc.severity === 'CRITICAL' ? 'border-red-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getDiscrepancyIcon(disc.discrepancyType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(disc.severity)}`}>
                          {disc.severity}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(disc.status)}`}>
                          {disc.status}
                        </span>
                      </div>

                      <div className="font-medium text-lg mb-1">
                        {disc.sku} - {disc.discrepancyType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{disc.description}</div>

                      {disc.actionRequired && (
                        <div className="p-2 bg-orange-50 rounded text-sm text-orange-800 mb-2">
                          <strong>Action Required:</strong> {disc.actionRequired}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Reported:</span>{' '}
                          <span className="font-medium">
                            {new Date(disc.reportedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">By:</span>{' '}
                          <span className="font-medium">{disc.reportedBy}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Verification:</span>{' '}
                          <span className="font-medium">{disc.verificationId}</span>
                        </div>
                      </div>

                      {disc.status === 'RESOLVED' && disc.resolution && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                          <div className="font-medium text-green-800">✓ Resolved</div>
                          <div className="text-gray-600">{disc.resolution}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {disc.resolvedAt && new Date(disc.resolvedAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {disc.status === 'OPEN' && (
                      <Button size="sm">
                        Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quality Metrics Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.topIssues?.map((issue, index) => (
                    <div key={issue.type}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {index + 1}. {issue.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {issue.count} ({issue.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${issue.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verifier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.verifierPerformance?.map((verifier) => (
                    <div key={verifier.verifierId} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-2">{verifier.verifierName}</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600">Completed</div>
                          <div className="font-medium">{verifier.verificationsCompleted}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Accuracy</div>
                          <div className={`font-medium ${
                            verifier.avgAccuracy >= 95 ? 'text-green-600' :
                            verifier.avgAccuracy >= 85 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {verifier.avgAccuracy.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Avg Time</div>
                          <div className="font-medium">{verifier.avgTime.toFixed(0)}m</div>
                        </div>
                      </div>
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
                    <span className="font-medium">$42,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Scanning Equipment</span>
                    <span className="font-medium">$18,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$7,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">QC Stations</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$72,000</span>
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
                    <span className="text-gray-600">Error Prevention</span>
                    <span className="font-medium text-green-600">$145,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Returns Reduction</span>
                    <span className="font-medium text-green-600">$98,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Efficiency</span>
                    <span className="font-medium text-green-600">$67,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Damage Prevention</span>
                    <span className="font-medium text-green-600">$42,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">$352,000</span>
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
                  <div className="text-3xl font-bold text-green-600">489%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.5</div>
                  <div className="text-sm text-gray-600 mt-1">Payback (months)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">Accuracy rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">65%</div>
                  <div className="text-sm text-gray-600 mt-1">Fewer returns</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>95% verification accuracy</strong> - Barcode scanning eliminates manual errors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>65% reduction in returns</strong> - Catch errors before shipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>50% faster verification</strong> - Automated scanning workflow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>100% traceability</strong> - Complete verification audit trail</span>
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
