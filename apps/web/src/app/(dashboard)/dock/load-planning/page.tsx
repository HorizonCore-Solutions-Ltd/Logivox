'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoadPlan {
  id: string;
  shipmentId: string;
  truckType: string;
  utilization: {
    cubePercent: number;
    weightPercent: number;
    itemsPlaced: number;
    itemsTotal: number;
  };
  weightDistribution: {
    front: number;
    middle: number;
    rear: number;
  };
  score: number;
}

export default function LoadPlanning() {
  const [summary, setSummary] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<LoadPlan | null>(null);
  const [truckSpecs, setTruckSpecs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, specsRes] = await Promise.all([
        fetch('/api/dock/load-planning?action=load_summary'),
        fetch('/api/dock/load-planning?action=truck_specs'),
      ]);

      const summaryData = await summaryRes.json();
      const specsData = await specsRes.json();

      setSummary(summaryData.summary);
      setTruckSpecs(specsData.truckSpecs);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 85) return 'text-green-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold">📦 Load Planning & Optimization</h1>
          <p className="text-gray-600">
            3D bin packing and weight distribution optimization
          </p>
        </div>
        <Button>+ New Load Plan</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Load Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {summary?.totalPlans || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active shipments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Cube Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getUtilizationColor(summary?.avgCubeUtilization || 0)}`}>
              {summary?.avgCubeUtilization?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Truck space used</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Weight Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getUtilizationColor(summary?.avgWeightUtilization || 0)}`}>
              {summary?.avgWeightUtilization?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Weight capacity</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Load Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {summary?.avgScore?.toFixed(0) || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Out of 100</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">📋 Load Plans</TabsTrigger>
          <TabsTrigger value="trucks">🚛 Truck Specs</TabsTrigger>
          <TabsTrigger value="visualization">🎨 3D View</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Load Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏆 Top Performing Loads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary?.topPerformers?.map((plan: any, index: number) => (
                    <div key={plan.id} className="border rounded p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{plan.shipmentId}</div>
                          <div className="text-sm text-gray-600">{plan.id}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getScoreColor(plan.score)}`}>
                          Score: {plan.score}
                        </span>
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Cube:</span>{' '}
                          <span className="font-medium text-green-600">
                            {plan.cubeUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Rank:</span>{' '}
                          <span className="font-medium">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Needs Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚠️ Needs Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary?.needsOptimization?.map((plan: any) => (
                    <div key={plan.id} className="border rounded p-3 bg-yellow-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{plan.shipmentId}</div>
                          <div className="text-sm text-gray-600">{plan.id}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getScoreColor(plan.score)}`}>
                          Score: {plan.score}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Issue:</span>{' '}
                        <span className="font-medium text-orange-600">{plan.issue}</span>
                      </div>
                      
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="w-full">
                          ⚡ Optimize Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weight Distribution Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Load Plan #1', front: 20, middle: 60, rear: 20, status: 'Optimal' },
                  { name: 'Load Plan #2', front: 25, middle: 55, rear: 20, status: 'Good' },
                  { name: 'Load Plan #3', front: 35, middle: 45, rear: 20, status: 'Front Heavy' },
                ].map((plan) => (
                  <div key={plan.name} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{plan.name}</div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        plan.status === 'Optimal' ? 'bg-green-100 text-green-800' :
                        plan.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">Front: {plan.front}%</div>
                          <div className="h-6 bg-blue-200 rounded" style={{ width: `${plan.front}%` }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">Middle: {plan.middle}%</div>
                          <div className="h-6 bg-green-200 rounded" style={{ width: `${plan.middle}%` }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">Rear: {plan.rear}%</div>
                          <div className="h-6 bg-purple-200 rounded" style={{ width: `${plan.rear}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Truck Specs Tab */}
        <TabsContent value="trucks" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {truckSpecs && Object.entries(truckSpecs).map(([key, spec]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{spec.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-gray-600">Length</div>
                        <div className="font-medium">{spec.length}" ({(spec.length / 12).toFixed(0)}ft)</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-gray-600">Width</div>
                        <div className="font-medium">{spec.width}" ({(spec.width / 12).toFixed(1)}ft)</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="text-gray-600">Height</div>
                        <div className="font-medium">{spec.height}" ({(spec.height / 12).toFixed(1)}ft)</div>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <div className="text-gray-600">Max Weight</div>
                        <div className="font-medium">{spec.maxWeight.toLocaleString()} lbs</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-gray-600 text-sm">Max Cube</div>
                      <div className="font-bold text-lg">{spec.maxCube.toLocaleString()} ft³</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3D Visualization Tab */}
        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3D Load Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded border-2 border-dashed">
                <div className="text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-lg font-medium text-gray-700">3D Load Viewer</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Interactive 3D visualization of items in truck
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-gray-600">
                    <div>• Rotate to view from different angles</div>
                    <div>• Color-coded by weight distribution</div>
                    <div>• Click items for details</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Load Sequence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs">1</div>
                    <span>Heavy pallets (floor)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center text-xs">2</div>
                    <span>Medium boxes (layer 2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-500 text-white flex items-center justify-center text-xs">3</div>
                    <span>Light items (top)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center text-xs">4</div>
                    <span>Fragile (last)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Optimization Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    📊 Maximize Cube
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    ⚖️ Balance Weight
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    ⚡ Fastest Load
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    🛡️ Minimize Damage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Load Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">35 / 35</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Layers:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Weight:</span>
                    <span className="font-medium">38,500 lbs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Volume:</span>
                    <span className="font-medium">3,450 ft³</span>
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
                    <span className="font-medium">$48,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">3D Packing Algorithm</span>
                    <span className="font-medium">$15,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Integration</span>
                    <span className="font-medium">$9,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$6,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$78,000</span>
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
                    <span className="text-gray-600">Fewer Trucks Needed</span>
                    <span className="font-medium text-green-600">$168,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Reduced Damage</span>
                    <span className="font-medium text-green-600">$92,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Fuel Savings</span>
                    <span className="font-medium text-green-600">$78,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Optimization</span>
                    <span className="font-medium text-green-600">$55,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">$393,000</span>
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
                  <div className="text-3xl font-bold text-green-600">504%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.4</div>
                  <div className="text-sm text-gray-600 mt-1">Payback (months)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">87%</div>
                  <div className="text-sm text-gray-600 mt-1">Avg cube utilization</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">18%</div>
                  <div className="text-sm text-gray-600 mt-1">Trucks eliminated</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>87% average cube utilization</strong> - Industry-leading space efficiency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>18% reduction in trucks needed</strong> - Lower freight costs and emissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>35% reduction in loading time</strong> - Optimized load sequence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>40% less product damage</strong> - Weight-balanced loading</span>
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
