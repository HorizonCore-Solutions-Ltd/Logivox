'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StagingZone {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentUtilization: number;
  status: string;
  assignedShipment?: string;
  location: string;
}

interface ShipmentStaging {
  shipmentId: string;
  carrier: string;
  loadTime: Date;
  priority: string;
  allocatedZones: string[];
  totalItems: number;
  stagedItems: number;
  completionPercent: number;
  status: string;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export default function StagingManagement() {
  const [zones, setZones] = useState<StagingZone[]>([]);
  const [shipments, setShipments] = useState<ShipmentStaging[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [zonesRes, shipmentsRes, metricsRes, oppRes] = await Promise.all([
        fetch('/api/dock/staging?action=staging_zones'),
        fetch('/api/dock/staging?action=shipment_staging'),
        fetch('/api/dock/staging?action=staging_metrics'),
        fetch('/api/dock/staging?action=consolidation_opportunities'),
      ]);

      const zonesData = await zonesRes.json();
      const shipmentsData = await shipmentsRes.json();
      const metricsData = await metricsRes.json();
      const oppData = await oppRes.json();

      setZones(zonesData.zones || []);
      setShipments(shipmentsData.shipments || []);
      setMetrics(metricsData.metrics);
      setOpportunities(oppData.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500';
      case 'RESERVED': return 'bg-yellow-500';
      case 'OCCUPIED': return 'bg-blue-500';
      case 'FULL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'PICKING': return 'bg-purple-100 text-purple-800';
      case 'STAGING': return 'bg-blue-100 text-blue-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'LOADING': return 'bg-orange-100 text-orange-800';
      case 'COMPLETE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📦 Staging Area Management</h1>
          <p className="text-gray-600">
            Pick-to-stage workflow and load preparation
          </p>
        </div>
        <Button>+ Allocate Zone</Button>
      </div>

      {/* Consolidation Alert */}
      {opportunities.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              💡 {opportunities.length} Consolidation Opportunit{opportunities.length !== 1 ? 'ies' : 'y'} Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 mb-2">
              Potential space saved: {opportunities.reduce((sum, opp) => sum + opp.spaceSaved, 0)} units
            </div>
            <Button size="sm" variant="outline">
              Review Opportunities
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {zones.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {zones.filter(z => z.status === 'AVAILABLE').length} available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {metrics?.utilizationPercent?.toFixed(0) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics?.currentUtilization || 0} / {metrics?.totalCapacity || 0} units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics?.activeShipments || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics?.readyForLoading || 0} ready to load
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Staging Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {metrics?.avgStagingRate || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">items/hour</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">🏢 Staging Zones</TabsTrigger>
          <TabsTrigger value="shipments">📦 Active Shipments</TabsTrigger>
          <TabsTrigger value="workflow">⚡ Workflow</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {zones.map((zone) => {
              const utilizationPercent = (zone.currentUtilization / zone.capacity) * 100;
              
              return (
                <Card key={zone.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <div className="text-sm text-gray-600">{zone.id}</div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(zone.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-gray-600">Type:</span>{' '}
                        <span className="font-medium">{zone.type}</span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Location:</span>{' '}
                        <span className="font-medium">{zone.location}</span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Status:</span>{' '}
                        <span className={`font-medium ${
                          zone.status === 'AVAILABLE' ? 'text-green-600' :
                          zone.status === 'FULL' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {zone.status}
                        </span>
                      </div>

                      {zone.assignedShipment && (
                        <div className="text-sm">
                          <span className="text-gray-600">Assigned:</span>{' '}
                          <span className="font-medium">{zone.assignedShipment}</span>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Utilization</span>
                          <span className="font-medium">{utilizationPercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilizationPercent >= 90 ? 'bg-red-500' :
                              utilizationPercent >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${utilizationPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {zone.currentUtilization} / {zone.capacity} units
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Card key={shipment.shipmentId}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(shipment.priority)}`}>
                          {shipment.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getShipmentStatusColor(shipment.status)}`}>
                          {shipment.status}
                        </span>
                      </div>
                      
                      <div className="font-medium text-lg mb-1">{shipment.carrier}</div>
                      <div className="text-sm text-gray-600">{shipment.shipmentId}</div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Load Time:</span>{' '}
                          <span className="font-medium">
                            {new Date(shipment.loadTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Items:</span>{' '}
                          <span className="font-medium">
                            {shipment.stagedItems} / {shipment.totalItems}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Zones:</span>{' '}
                          <span className="font-medium">
                            {shipment.allocatedZones.join(', ')}
                          </span>
                        </div>
                      </div>

                      {shipment.verifiedAt && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                          <span className="text-green-600">✓</span> Verified by {shipment.verifiedBy} at{' '}
                          {new Date(shipment.verifiedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 w-32">
                      <div className="text-center mb-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {shipment.completionPercent}%
                        </div>
                        <div className="text-xs text-gray-600">Complete</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${shipment.completionPercent}%` }}
                        />
                      </div>
                      {shipment.status === 'STAGING' && shipment.completionPercent === 100 && (
                        <Button size="sm" className="w-full mt-2">
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pick-to-Stage Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Allocate Staging Zone', desc: 'System assigns optimal zone based on shipment requirements', icon: '🎯' },
                  { step: 2, title: 'Pick Items', desc: 'Workers pick items from warehouse and scan', icon: '📦' },
                  { step: 3, title: 'Stage to Zone', desc: 'Items moved to allocated staging zone', icon: '➡️' },
                  { step: 4, title: 'Verify Completeness', desc: 'Supervisor verifies all items staged', icon: '✓' },
                  { step: 5, title: 'Mark Load Ready', desc: 'Shipment ready for loading at dock', icon: '🚚' },
                ].map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xl">{step.icon}</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="font-medium text-lg">
                        {step.step}. {step.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Stage heavy/large items first for efficient loading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Keep staging zones organized by shipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Consolidate underutilized zones to free up space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Verify item counts before marking ready</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="font-medium">STANDARD</div>
                    <div className="text-gray-600">General purpose staging</div>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <div className="font-medium">REFRIGERATED</div>
                    <div className="text-gray-600">Temperature-controlled items</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <div className="font-medium">HAZMAT</div>
                    <div className="text-gray-600">Hazardous materials</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="font-medium">OVERSIZED</div>
                    <div className="text-gray-600">Large/bulky items</div>
                  </div>
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
                    <span className="font-medium">$38,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Zone Setup</span>
                    <span className="font-medium">$12,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Scanners & Equipment</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$63,000</span>
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
                    <span className="text-gray-600">Faster Loading</span>
                    <span className="font-medium text-green-600">$115,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Reduced Errors</span>
                    <span className="font-medium text-green-600">$82,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Space Optimization</span>
                    <span className="font-medium text-green-600">$68,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Efficiency</span>
                    <span className="font-medium text-green-600">$52,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">$317,000</span>
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
                  <div className="text-3xl font-bold text-green-600">503%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.4</div>
                  <div className="text-sm text-gray-600 mt-1">Payback (months)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">40%</div>
                  <div className="text-sm text-gray-600 mt-1">Faster staging</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>40% faster staging process</strong> - Organized workflow reduces time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>95% staging accuracy</strong> - Verification prevents errors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>30% better space utilization</strong> - Smart zone allocation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>100% load visibility</strong> - Real-time readiness tracking</span>
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
